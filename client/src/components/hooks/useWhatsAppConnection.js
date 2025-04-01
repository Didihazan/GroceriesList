import { useState, useEffect } from 'react';
import { io } from "socket.io-client";
import {apiService} from "../services/apiServices";
import {API_BASE_URL} from "../services/config";

// יצירת שירות ייעודי ל-WhatsApp
const whatsappService = {
    getStatus: (userId) => apiService.get(`/api/whatsapp/status/${userId}`),
    connect: (userId) => apiService.post('/api/whatsapp/connect', { userId }),
    getGroups: (userId) => apiService.get(`/api/whatsapp/groups/${userId}`),
    selectGroup: (userId, groupId) => apiService.post('/api/whatsapp/select-group', { userId, groupId }),
    testGroup: (userId) => apiService.post('/api/whatsapp/test-group', { userId }),
    toggleListening: (userId, enabled) => apiService.post('/api/whatsapp/toggle-listening', { userId, enabled })
};

export const useWhatsAppConnection = (currentUser, fetchGroceryItems, onItemsUpdate) => {
    const [socket, setSocket] = useState(null);
    const [whatsappStatus, setWhatsappStatus] = useState('disconnected');
    const [qrCode, setQrCode] = useState(null);
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedGroupDetails, setSelectedGroupDetails] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(false);
    const [listeningEnabled, setListeningEnabled] = useState(true);

    // אתחול Socket.IO וחיבור
    useEffect(() => {
        const newSocket = io(API_BASE_URL);
        setSocket(newSocket);

        return () => {
            if (newSocket) newSocket.disconnect();
        };
    }, []);

    // הרשמה לעדכונים של המשתמש
    useEffect(() => {
        if (!socket || !currentUser?._id) return;

        socket.emit('register_user', currentUser._id);

        const checkWhatsAppStatus = async () => {
            try {
                const response = await whatsappService.getStatus(currentUser._id);

                if (response.error) {
                    console.error('Error checking WhatsApp status:', response.error);
                    return;
                }

                if (response.data.success) {
                    setWhatsappStatus(response.data.status);
                    if (response.data.selectedGroup) {
                        setSelectedGroup(response.data.selectedGroup);
                        getGroupDetails(response.data.selectedGroup);
                    }
                    if (response.data.listeningEnabled !== undefined) {
                        setListeningEnabled(response.data.listeningEnabled);
                    }
                }
            } catch (err) {
                console.error('Error checking WhatsApp status:', err);
            }
        };

        checkWhatsAppStatus();
    }, [socket, currentUser]);

    // טיפול באירועי Socket.IO
    useEffect(() => {
        if (!socket) return;

        socket.on('whatsapp_qr', (qr) => {
            setQrCode(qr);
            setStatusMessage('סרוק את קוד ה-QR באמצעות הטלפון שלך');
            setWhatsappStatus('qr_ready');
        });

        socket.on('whatsapp_status', (data) => {
            setWhatsappStatus(data.status);

            if (data.status === 'connected') {
                setStatusMessage('מחובר בהצלחה! בחר קבוצה כדי לקבל הודעות.');
                setQrCode(null);
            } else if (data.status === 'disconnected') {
                setStatusMessage('מנותק מ-WhatsApp. התחבר מחדש כדי להמשיך.');
                setSelectedGroup('');
                setSelectedGroupDetails(null);
            } else if (data.status === 'error') {
                setStatusMessage(`שגיאה: ${data.message}`);
                setError(data.error || 'אירעה שגיאה לא ידועה');
            }
        });

        socket.on('whatsapp_groups', (groupsData) => {
            setGroups(groupsData);
        });

        socket.on('newGroceryItemAdded', (item) => {
            if (item.user === currentUser?._id) {
                fetchGroceryItems();
                onItemsUpdate([item]);
                setStatusMessage(`פריט חדש התקבל: "${item.text}"`);
            }
        });

        socket.on('whatsapp_message_processed', (data) => {
            if (data.success) {
                fetchGroceryItems();
                if (data.itemCount > 0) {
                    if (data.duplicatesFound > 0) {
                        setStatusMessage(`נוספו ${data.itemCount} פריטים חדשים מ-WhatsApp, התעלמתי מ-${data.duplicatesFound} פריטים כפולים`);
                    } else {
                        setStatusMessage(`נוספו ${data.itemCount} פריטים מ-WhatsApp`);
                    }
                } else if (data.duplicatesFound > 0) {
                    setStatusMessage(`לא נוספו פריטים חדשים, כל ${data.duplicatesFound} הפריטים כבר קיימים ברשימה`);
                } else {
                    setStatusMessage(`הודעה עובדה אך לא זוהו פריטים להוספה`);
                }
            }
        });

        socket.on('whatsapp_listening_status', (data) => {
            setListeningEnabled(data.enabled);
            setStatusMessage(data.message);
        });

        socket.on('connect_error', () => {
            setError('שגיאה בחיבור לשרת. נסה להתחבר מחדש.');
        });

        return () => {
            socket.off('whatsapp_qr');
            socket.off('whatsapp_status');
            socket.off('whatsapp_groups');
            socket.off('newGroceryItemAdded');
            socket.off('whatsapp_message_processed');
            socket.off('whatsapp_listening_status');
            socket.off('connect_error');
        };
    }, [socket, currentUser, fetchGroceryItems, onItemsUpdate]);

    // פונקציות
    const connectWhatsApp = async () => {
        try {
            setError('');
            setStatusMessage('מתחיל חיבור ל-WhatsApp...');
            setProcessing(true);

            const response = await whatsappService.connect(currentUser._id);

            if (response.error) {
                if (typeof response.error === 'string') {
                    setError('שגיאה: ' + response.error);
                } else if (response.error instanceof Error) {
                    setError('שגיאה: ' + response.error.message);
                } else {
                    setError('אירעה שגיאה לא ידועה');
                }
                return;
            }

            setWhatsappStatus('initializing');
        } catch (err) {
            setError('שגיאה בחיבור ל-WhatsApp: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const refreshGroups = async () => {
        try {
            setError('');
            setStatusMessage('מרענן רשימת קבוצות...');
            setProcessing(true);

            const response = await whatsappService.getGroups(currentUser._id);

            if (response.error) {
                if (typeof response.error === 'string') {
                    setError('שגיאה: ' + response.error);
                } else if (response.error instanceof Error) {
                    setError('שגיאה: ' + response.error.message);
                } else {
                    setError('אירעה שגיאה לא ידועה');
                }
                return;
            }

            if (response.data.success) {
                setGroups(response.data.groups);
                setStatusMessage(`נטענו ${response.data.groups.length} קבוצות`);
            }
        } catch (err) {
            setError('שגיאה בטעינת קבוצות: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const getGroupDetails = async (groupId) => {
        if (!groupId) return;

        const group = groups.find(g => g.id === groupId);
        if (group) {
            setSelectedGroupDetails({
                name: group.name,
                id: group.id
            });
        }
    };

    const selectGroup = async (groupId) => {
        try {
            setError('');
            setStatusMessage('מגדיר קבוצה נבחרת...');
            setProcessing(true);

            const response = await whatsappService.selectGroup(currentUser._id, groupId);

            if (response.error) {
                if (typeof response.error === 'string') {
                    setError('שגיאה: ' + response.error);
                } else if (response.error instanceof Error) {
                    setError('שגיאה: ' + response.error.message);
                } else {
                    setError('אירעה שגיאה לא ידועה');
                }
                return;
            }

            if (response.data.success) {
                setSelectedGroup(groupId);
                setSelectedGroupDetails({
                    name: response.data.groupName,
                    participantsCount: response.data.participantsCount,
                    id: groupId
                });
                setStatusMessage(`קבוצה "${response.data.groupName}" נבחרה בהצלחה. הודעות יתווספו לרשימה.`);
            }
        } catch (err) {
            setError('שגיאה בבחירת קבוצה: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const testGroup = async () => {
        try {
            setError('');
            setStatusMessage('שולח הודעת בדיקה לקבוצה...');
            setProcessing(true);

            const response = await whatsappService.testGroup(currentUser._id);

            if (response.error) {
                if (typeof response.error === 'string') {
                    setError('שגיאה: ' + response.error);
                } else if (response.error instanceof Error) {
                    setError('שגיאה: ' + response.error.message);
                } else {
                    setError('אירעה שגיאה לא ידועה');
                }
                return;
            }

            if (response.data.success) {
                setStatusMessage('הודעת בדיקה נשלחה בהצלחה! בדוק את הקבוצה בטלפון.');
            }
        } catch (err) {
            setError('שגיאה בשליחת הודעת בדיקה: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const toggleListening = async () => {
        try {
            setError('');
            setProcessing(true);

            const response = await whatsappService.toggleListening(currentUser._id, !listeningEnabled);

            if (response.error) {
                if (typeof response.error === 'string') {
                    setError('שגיאה: ' + response.error);
                } else if (response.error instanceof Error) {
                    setError('שגיאה: ' + response.error.message);
                } else {
                    setError('אירעה שגיאה לא ידועה');
                }
                return;
            }

            if (response.data.success) {
                setListeningEnabled(response.data.enabled);
                setStatusMessage(response.data.message);
            }
        } catch (err) {
            setError('שגיאה בשינוי מצב האזנה: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    return {
        whatsappStatus,
        qrCode,
        groups,
        selectedGroup,
        selectedGroupDetails,
        statusMessage,
        error,
        processing,
        listeningEnabled,
        connectWhatsApp,
        refreshGroups,
        selectGroup,
        testGroup,
        toggleListening
    };
};
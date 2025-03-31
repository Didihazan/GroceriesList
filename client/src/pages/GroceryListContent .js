import React, { useState, useContext, useEffect } from 'react';
import { UserContext } from '../context/UserContext';
import { GroceryContext } from '../context/GroceryContext';
import { Check, Trash2, Plus, Database, ShoppingCart, Send, RefreshCw, Smartphone } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import axios from 'axios';
import {io} from "socket.io-client";

const GroceryListContent = () => {
    const { currentUser } = useContext(UserContext);
    const { groceryItems, loading, addGroceryItem, toggleItemCompletion, deleteItem, mockWhatsAppData, fetchGroceryItems } = useContext(GroceryContext);

    const [newItem, setNewItem] = useState('');
    const [socket, setSocket] = useState(null);

    // סטטוס WhatsApp
    const [whatsappStatus, setWhatsappStatus] = useState('disconnected');
    const [qrCode, setQrCode] = useState(null);
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedGroupDetails, setSelectedGroupDetails] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(false);
    const [recentWhatsAppItems, setRecentWhatsAppItems] = useState([]);
    const [listeningEnabled, setListeningEnabled] = useState(true);

    // אתחול Socket.IO וחיבור למחדלים
    useEffect(() => {
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        return () => {
            if (newSocket) newSocket.disconnect();
        };
    }, []);

    // הרשמה לעדכונים של המשתמש באמצעות Socket.IO
    useEffect(() => {
        if (!socket || !currentUser?._id) return;

        // רישום לעדכונים ספציפיים של המשתמש
        socket.emit('register_user', currentUser._id);

        // איסוף מצב חיבור WhatsApp
        const checkWhatsAppStatus = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/whatsapp/status/${currentUser._id}`);
                if (res.data.success) {
                    setWhatsappStatus(res.data.status);
                    if (res.data.selectedGroup) {
                        setSelectedGroup(res.data.selectedGroup);
                        getGroupDetails(res.data.selectedGroup);
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

        // קבלת קוד QR
        socket.on('whatsapp_qr', (qr) => {
            setQrCode(qr);
            setStatusMessage('סרוק את קוד ה-QR באמצעות הטלפון שלך');
            setWhatsappStatus('qr_ready');
        });

        // עדכון סטטוס WhatsApp
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

        // קבלת רשימת קבוצות
        socket.on('whatsapp_groups', (groupsData) => {
            setGroups(groupsData);
        });

        // כאשר פריט חדש נוסף מ-WhatsApp
        socket.on('newGroceryItemAdded', (item) => {
            if (item.user === currentUser?._id) {
                fetchGroceryItems();
                setRecentWhatsAppItems(prev => [...prev, item].slice(-5));
                setStatusMessage(`פריט חדש התקבל: "${item.text}"`);
            }
        });

        // כאשר הודעת WhatsApp מעובדת
        socket.on('whatsapp_message_processed', (data) => {
            if (data.success) {
                setStatusMessage(`פריט חדש נוסף מ-WhatsApp: "${data.messageText}"`);
            }
        });

        // טיפול בשגיאות חיבור
        socket.on('connect_error', () => {
            setError('שגיאה בחיבור לשרת. נסה להתחבר מחדש.');
        });

        socket.on('whatsapp_listening_status', (data) => {
            setListeningEnabled(data.enabled);
            setStatusMessage(data.message);
        });
        return () => {
            socket.off('whatsapp_qr');
            socket.off('whatsapp_status');
            socket.off('whatsapp_groups');
            socket.off('newGroceryItemAdded');
            socket.off('whatsapp_message_processed');
            socket.off('connect_error');
            socket.off('whatsapp_listening_status');
        };
    }, [socket, currentUser, fetchGroceryItems]);

    // פונקציות טיפול באינטראקציה
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newItem.trim()) {
            await addGroceryItem(newItem);
            setNewItem('');
        }
    };
    const toggleListening = async () => {
        try {
            setError('');
            setProcessing(true);

            const res = await axios.post('http://localhost:5000/api/whatsapp/toggle-listening', {
                userId: currentUser._id,
                enabled: !listeningEnabled
            });

            if (res.data.success) {
                setListeningEnabled(res.data.enabled);
                setStatusMessage(res.data.message);
            }
        } catch (err) {
            setError('שגיאה בשינוי מצב האזנה: ' + (err.response?.data?.message || err.message));
        } finally {
            setProcessing(false);
        }
    };
    const handleDeleteItem = async (id) => {
        await deleteItem(id);
    };

    const handleConnectWhatsApp = async () => {
        try {
            setError('');
            setStatusMessage('מתחיל חיבור ל-WhatsApp...');
            setProcessing(true);

            await axios.post('http://localhost:5000/api/whatsapp/connect', { userId: currentUser._id });
            setWhatsappStatus('initializing');
        } catch (err) {
            setError('שגיאה בחיבור ל-WhatsApp: ' + (err.response?.data?.message || err.message));
        } finally {
            setProcessing(false);
        }
    };

    const handleRefreshGroups = async () => {
        try {
            setError('');
            setStatusMessage('מרענן רשימת קבוצות...');
            setProcessing(true);

            const res = await axios.get(`http://localhost:5000/api/whatsapp/groups/${currentUser._id}`);
            if (res.data.success) {
                setGroups(res.data.groups);
                setStatusMessage(`נטענו ${res.data.groups.length} קבוצות`);
            }
        } catch (err) {
            setError('שגיאה בטעינת קבוצות: ' + (err.response?.data?.message || err.message));
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

    const handleSelectGroup = async (groupId) => {
        try {
            setError('');
            setStatusMessage('מגדיר קבוצה נבחרת...');
            setProcessing(true);

            const res = await axios.post('http://localhost:5000/api/whatsapp/select-group', {
                userId: currentUser._id,
                groupId
            });

            if (res.data.success) {
                setSelectedGroup(groupId);
                setSelectedGroupDetails({
                    name: res.data.groupName,
                    participantsCount: res.data.participantsCount,
                    id: groupId
                });
                setStatusMessage(`קבוצה "${res.data.groupName}" נבחרה בהצלחה. הודעות יתווספו לרשימה.`);
            }
        } catch (err) {
            setError('שגיאה בבחירת קבוצה: ' + (err.response?.data?.message || err.message));
        } finally {
            setProcessing(false);
        }
    };

    const handleTestGroup = async () => {
        try {
            setError('');
            setStatusMessage('שולח הודעת בדיקה לקבוצה...');
            setProcessing(true);

            const res = await axios.post('http://localhost:5000/api/whatsapp/test-group', {
                userId: currentUser._id
            });

            if (res.data.success) {
                setStatusMessage('הודעת בדיקה נשלחה בהצלחה! בדוק את הקבוצה בטלפון.');
            }
        } catch (err) {
            setError('שגיאה בשליחת הודעת בדיקה: ' + (err.response?.data?.message || err.message));
        } finally {
            setProcessing(false);
        }
    };

    const handleLoadMockData = async () => {
        await mockWhatsAppData();
    };

    // רנדור ממשק
    if (loading) {
        return (
            <div className="text-center py-8 rtl">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">טוען רשימת קניות...</p>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto rtl">
            <div className="bg-white p-6 rounded-lg shadow-lg mb-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-bold">רשימת הקניות שלי</h1>
                    <span className="text-gray-500 text-sm flex items-center">
                        <ShoppingCart size={16} className="ml-1" />
                        {groceryItems.length} פריטים
                    </span>
                </div>

                {/* חיבור WhatsApp */}
                <div className="mb-6 bg-gray-50 p-4 rounded-md">
                    <h2 className="text-lg font-semibold mb-2 flex items-center">
                        <Smartphone size={18} className="ml-2" />
                        חיבור ל-WhatsApp
                    </h2>

                    {/* סטטוס והודעות */}
                    {statusMessage && (
                        <div className={`text-sm mb-3 p-2 rounded ${error ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                            {statusMessage}
                        </div>
                    )}

                    {/* שלב התחברות */}
                    {whatsappStatus === 'disconnected' && (
                        <div className="text-center">
                            <button
                                onClick={handleConnectWhatsApp}
                                disabled={processing}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center mx-auto disabled:bg-blue-300"
                            >
                                <Plus size={20} className="ml-2" />
                                התחבר ל-WhatsApp
                            </button>
                        </div>
                    )}

                    {/* שלב סריקת QR */}
                    {whatsappStatus === 'qr_ready' && qrCode && (
                        <div className="flex flex-col items-center mt-4">
                            <p className="text-sm text-gray-600 mb-2">סרוק את קוד ה-QR באמצעות WhatsApp בטלפון שלך:</p>
                            <ol className="text-sm text-gray-600 mb-3 pr-5 list-decimal">
                                <li>פתח את WhatsApp בטלפון</li>
                                <li>לחץ על שלוש נקודות (תפריט) למעלה</li>
                                <li>בחר "התקנים מקושרים"</li>
                                <li>לחץ על "קשר התקן"</li>
                                <li>סרוק את הקוד שלהלן</li>
                            </ol>
                            <div className="border-4 border-blue-500 rounded-lg p-2 bg-white">
                                <QRCodeCanvas
                                    value={qrCode}
                                    size={200}
                                    level="H"
                                />
                            </div>
                        </div>
                    )}

                    {/* מחובר - בחירת קבוצה */}
                    {whatsappStatus === 'connected' && (
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-sm text-green-600">סטטוס: מחובר</p>
                                <button
                                    onClick={handleRefreshGroups}
                                    disabled={processing}
                                    className="text-blue-600 text-sm flex items-center disabled:text-blue-300"
                                >
                                    <RefreshCw size={14} className="ml-1" />
                                    רענן קבוצות
                                </button>
                            </div>

                            <select
                                value={selectedGroup}
                                onChange={(e) => handleSelectGroup(e.target.value)}
                                disabled={processing}
                                className="w-full p-2 border rounded-md mb-2"
                            >
                                <option value="">בחר קבוצת WhatsApp</option>
                                {groups.map(group => (
                                    <option key={group.id} value={group.id}>{group.name}</option>
                                ))}
                            </select>

                            {selectedGroupDetails && (
                                <div className="bg-green-50 p-3 rounded-md mb-2">
                                    <p className="text-green-800 text-sm font-semibold">
                                        קבוצה מחוברת: {selectedGroupDetails.name}
                                    </p>
                                    <p className="text-green-700 text-xs">
                                        הודעות מקבוצה זו יתווספו אוטומטית לרשימת הקניות
                                    </p>

                                    {/* מתג למצב האזנה */}
                                    <div className="flex items-center justify-between mt-2 border-t pt-2 border-green-200">
            <span className="text-sm">
                {listeningEnabled ? (
                    <span className="text-green-700">מצב האזנה: פעיל</span>
                ) : (
                    <span className="text-red-600">מצב האזנה: מושבת</span>
                )}
            </span>

                                        <button
                                            onClick={toggleListening}
                                            disabled={processing}
                                            className={`px-3 py-1 rounded-md text-xs text-white flex items-center ${
                                                listeningEnabled
                                                    ? 'bg-red-500 hover:bg-red-600'
                                                    : 'bg-green-600 hover:bg-green-700'
                                            }`}
                                        >
                                            {listeningEnabled ? (
                                                <>
                                                    <span>כבה האזנה</span>
                                                    <span className="ml-1">(מצב קניה)</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>הפעל האזנה</span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <button
                                        onClick={handleTestGroup}
                                        disabled={processing}
                                        className="mt-2 text-xs px-3 py-1 bg-green-600 text-white rounded-md flex items-center max-w-max disabled:bg-green-300"
                                    >
                                        <Send size={12} className="ml-1" />
                                        שלח הודעת בדיקה
                                    </button>
                                </div>
                            )}

                            {/* פריטים שהתקבלו לאחרונה */}
                            {recentWhatsAppItems.length > 0 && (
                                <div className="mt-3 border-t pt-2">
                                    <p className="text-xs font-semibold mb-1">פריטים אחרונים שהתקבלו מ-WhatsApp:</p>
                                    <ul className="text-xs">
                                        {recentWhatsAppItems.map((item, idx) => (
                                            <li key={idx} className="text-gray-700">• {item.text}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="mb-4">
                    <div className="flex">
                        <input
                            type="text"
                            value={newItem}
                            onChange={(e) => setNewItem(e.target.value)}
                            className="flex-1 p-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="הוסף פריט חדש לרשימה"
                        />
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded-l-md hover:bg-blue-700 transition-colors duration-200 flex items-center"
                        >
                            <Plus size={20}/>
                            <span className="hidden sm:inline ml-1">הוסף</span>
                        </button>
                    </div>
                </form>

                {groceryItems.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <p className="text-gray-600 mb-4">הרשימה שלך ריקה</p>
                        <button
                            onClick={handleLoadMockData}
                            className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors duration-200 flex items-center mx-auto"
                        >
                            <Database className="mr-2" size={18}/>
                            טען נתוני דוגמה
                        </button>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100 -mx-6">
                        {groceryItems.map(item => (
                            <li
                                key={item._id}
                                className="p-4 flex items-center justify-between hover:bg-blue-50 transition-colors duration-150"
                            >
                                <div className="flex items-center">
                                    <button
                                        onClick={() => toggleItemCompletion(item._id)}
                                        className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors duration-200 ${
                                            item.completed ? 'bg-green-500 border-green-500' : 'border-gray-400'
                                        }`}
                                    >
                                        {item.completed && <Check size={16} className="text-white"/>}
                                    </button>
                                    <span className={`mr-3 ${item.completed ? 'line-through text-gray-500' : ''}`}>
        {item.text}
      </span>
                                </div>
                                <button
                                    onClick={() => handleDeleteItem(item._id)}
                                    className="text-gray-400 hover:text-red-500 transition-colors duration-200 p-2"
                                >
                                    <Trash2 size={18}/>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

        </div>
    );
};

export default GroceryListContent;
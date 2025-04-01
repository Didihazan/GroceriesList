// components/grocery/WhatsAppConnection.jsx
import React from 'react';
import { Smartphone, Send, RefreshCw, Plus } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useWhatsAppConnection } from '../hooks/useWhatsAppConnection';

const WhatsAppConnection = ({ currentUser, onItemsUpdate, recentItems, fetchGroceryItems }) => {
    const {
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
    } = useWhatsAppConnection(currentUser, fetchGroceryItems, onItemsUpdate);

    return (
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
                        onClick={connectWhatsApp}
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
                            onClick={refreshGroups}
                            disabled={processing}
                            className="text-blue-600 text-sm flex items-center disabled:text-blue-300"
                        >
                            <RefreshCw size={14} className="ml-1" />
                            רענן קבוצות
                        </button>
                    </div>

                    <select
                        value={selectedGroup}
                        onChange={(e) => selectGroup(e.target.value)}
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
                                onClick={testGroup}
                                disabled={processing}
                                className="mt-2 text-xs px-3 py-1 bg-green-600 text-white rounded-md flex items-center max-w-max disabled:bg-green-300"
                            >
                                <Send size={12} className="ml-1" />
                                שלח הודעת בדיקה
                            </button>
                        </div>
                    )}

                    {/* פריטים שהתקבלו לאחרונה */}
                    {recentItems.length > 0 && (
                        <div className="mt-3 border-t pt-2">
                            <p className="text-xs font-semibold mb-1">פריטים אחרונים שהתקבלו מ-WhatsApp:</p>
                            <ul className="text-xs">
                                {recentItems.map((item, idx) => (
                                    <li key={idx} className="text-gray-700">• {item.text}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default WhatsAppConnection;
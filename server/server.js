const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { Client, LocalAuth } = require('whatsapp-web.js');
const http = require('http');
const { Server } = require('socket.io');
const User = require('./models/User');
const GroceryItem = require('./models/GroceryItem');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: 'http://localhost:3000' } });

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// ניהול משתמשי WhatsApp
const whatsappClients = {};
let whatsappConnectionState = {};

// פונקציה ליצירת ושמירת פריט מכולת חדש
const createAndSaveGroceryItem = async (userId, text) => {
    try {
        const item = new GroceryItem({
            user: userId,
            text: text
        });
        const newItem = await item.save();
        io.emit('newGroceryItemAdded', newItem);
        return newItem;
    } catch (err) {
        console.error('Error saving grocery item:', err);
        return null;
    }
};

// פונקציה חדשה לפירוק טקסט להודעות נפרדות
const processMessageText = async (userId, messageText) => {
    // בדוק אם ההודעה מכילה ירידות שורה
    if (messageText.includes('\n')) {
        const items = messageText.split('\n');
        const results = [];

        // עבור על כל שורה והוסף כפריט נפרד
        for (const item of items) {
            const trimmedItem = item.trim();
            if (trimmedItem) {  // אם לא ריק
                const newItem = await createAndSaveGroceryItem(userId, trimmedItem);
                if (newItem) {
                    results.push(newItem);
                }
            }
        }

        return results;
    } else {
        // אם זו הודעה רגילה (ללא ירידות שורה)
        const newItem = await createAndSaveGroceryItem(userId, messageText);
        return newItem ? [newItem] : [];
    }
};

// מתודה ליצירת ואתחול לקוח WhatsApp
const initializeWhatsAppClient = async (userId) => {
    // אם כבר יש לקוח למשתמש זה, הפסק אותו ותנקה
    if (whatsappClients[userId]) {
        try {
            await whatsappClients[userId].destroy();
        } catch (err) {
            console.log('Error destroying existing WhatsApp client:', err);
        }
    }

    // יצירת לקוח חדש
    const client = new Client({
        authStrategy: new LocalAuth({ clientId: `user-${userId}` }),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        },
        selfNotifyOptions: {
            selfNotifyOnMessage: true
        }
    });

    // הגדרת סטטוס התחלתי
    whatsappConnectionState[userId] = {
        status: 'initializing',
        selectedGroup: null,
        groups: [],
        listeningEnabled: true
    };

    // אירועי לקוח
    client.on('qr', (qr) => {
        console.log(`QR code generated for user ${userId}`);
        whatsappConnectionState[userId].status = 'qr_ready';
        io.to(userId).emit('whatsapp_qr', qr);
    });

    client.on('ready', async () => {
        console.log(`WhatsApp client ready for user ${userId}`);
        whatsappConnectionState[userId].status = 'connected';
        io.to(userId).emit('whatsapp_status', { status: 'connected' });

        // קבל רשימת קבוצות מעודכנת
        try {
            const chats = await client.getChats();
            const groups = chats
                .filter(chat => chat.isGroup)
                .map(group => ({
                    id: group.id._serialized,
                    name: group.name
                }));

            whatsappConnectionState[userId].groups = groups;
            io.to(userId).emit('whatsapp_groups', groups);
        } catch (err) {
            console.error('Error fetching groups:', err);
        }
    });

    // בטיפול באירוע message
    client.on('message', async (msg) => {
        console.log(`Message received for user ${userId}:`, msg.body);
        console.log('Chat ID:', msg.from);
        console.log('Selected group:', whatsappConnectionState[userId]?.selectedGroup);

        // בדוק האם האזנה מופעלת
        if (whatsappConnectionState[userId]?.listeningEnabled === false) {
            console.log('Listening disabled, ignoring message');
            return;
        }

        if (whatsappConnectionState[userId]?.selectedGroup === msg.from) {
            const items = await processMessageText(userId, msg.body);
            if (items.length > 0) {
                console.log(`${items.length} grocery items created from WhatsApp message`);
                items.forEach(item => {
                    console.log('New grocery item created:', item);
                });

                io.to(userId).emit('whatsapp_message_processed', {
                    success: true,
                    messageText: msg.body,
                    items: items,
                    itemCount: items.length
                });
            }
        }
    });

// בטיפול באירוע message_create
    client.on('message_create', async (msg) => {
        if (msg.fromMe) {
            console.log(`Self message created for user ${userId}:`, msg.body);
            console.log('Self message Chat ID:', msg.from);
            console.log('Self message To:', msg.to);
            console.log('Selected group:', whatsappConnectionState[userId]?.selectedGroup);

            // בדוק האם האזנה מופעלת
            if (whatsappConnectionState[userId]?.listeningEnabled === false) {
                console.log('Listening disabled, ignoring self message');
                return;
            }
            // בדוק את שני השדות האפשריים
            if (whatsappConnectionState[userId]?.selectedGroup === msg.from ||
                whatsappConnectionState[userId]?.selectedGroup === msg.to) {

                const items = await processMessageText(userId, msg.body);
                if (items.length > 0) {
                    console.log(`${items.length} grocery items created from self WhatsApp message`);
                    items.forEach(item => {
                        console.log('New grocery item created:', item);
                    });

                    io.to(userId).emit('whatsapp_message_processed', {
                        success: true,
                        messageText: msg.body,
                        items: items,
                        itemCount: items.length
                    });
                }
            }
        }
    });
    client.on('disconnected', (reason) => {
        console.log(`WhatsApp client disconnected for user ${userId}: ${reason}`);
        whatsappConnectionState[userId] = {
            status: 'disconnected',
            selectedGroup: null,
            groups: []
        };
        io.to(userId).emit('whatsapp_status', { status: 'disconnected', reason });

        // נקה את הלקוח
        whatsappClients[userId] = null;
    });

    try {
        console.log(`Initializing WhatsApp client for user ${userId}`);
        await client.initialize();
        whatsappClients[userId] = client;
        return true;
    } catch (err) {
        console.error(`Error initializing WhatsApp client for user ${userId}:`, err);
        io.to(userId).emit('whatsapp_status', {
            status: 'error',
            message: 'שגיאה באתחול WhatsApp',
            error: err.message
        });
        return false;
    }
};

// Socket.IO כשמשתמש מתחבר
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // משתמש נרשם לערוץ ספציפי
    socket.on('register_user', (userId) => {
        if (userId) {
            socket.join(userId);
            console.log(`User ${userId} registered for updates`);

            // שלח סטטוס נוכחי אם קיים
            if (whatsappConnectionState[userId]) {
                socket.emit('whatsapp_status', { status: whatsappConnectionState[userId].status });

                if (whatsappConnectionState[userId].groups.length > 0) {
                    socket.emit('whatsapp_groups', whatsappConnectionState[userId].groups);
                }
            }
        }
    });

    // ניתוק
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// API routes
// התחברות ל-WhatsApp
app.post('/api/whatsapp/connect', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'מזהה משתמש נדרש' });
        }

        const success = await initializeWhatsAppClient(userId);

        if (success) {
            res.json({ success: true, message: 'מתחבר ל-WhatsApp...' });
        } else {
            res.status(500).json({ success: false, message: 'שגיאה באתחול WhatsApp' });
        }
    } catch (err) {
        console.error('Error connecting to WhatsApp:', err);
        res.status(500).json({ success: false, message: 'שגיאה בחיבור ל-WhatsApp', error: err.message });
    }
});

// בחירת קבוצה
app.post('/api/whatsapp/select-group', async (req, res) => {
    try {
        const { userId, groupId } = req.body;

        if (!userId || !groupId) {
            return res.status(400).json({ success: false, message: 'מזהה משתמש וקבוצה נדרשים' });
        }

        if (!whatsappClients[userId]) {
            return res.status(400).json({ success: false, message: 'משתמש לא מחובר ל-WhatsApp' });
        }

        // שמור את הקבוצה שנבחרה
        whatsappConnectionState[userId].selectedGroup = groupId;

        // קבל פרטי קבוצה
        try {
            const chat = await whatsappClients[userId].getChatById(groupId);
            res.json({
                success: true,
                message: 'קבוצה נבחרה בהצלחה',
                groupName: chat.name,
                participantsCount: chat.participants?.length || 0
            });
        } catch (err) {
            console.error('Error getting chat details:', err);
            res.status(400).json({
                success: true,
                message: 'קבוצה נבחרה, אך לא ניתן לקבל פרטים נוספים',
                error: err.message
            });
        }
    } catch (err) {
        console.error('Error selecting group:', err);
        res.status(500).json({ success: false, message: 'שגיאה בבחירת קבוצה', error: err.message });
    }
});

// קבלת סטטוס חיבור
app.get('/api/whatsapp/status/:userId', (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({ success: false, message: 'מזהה משתמש נדרש' });
    }

    res.json({
        success: true,
        status: whatsappConnectionState[userId]?.status || 'disconnected',
        selectedGroup: whatsappConnectionState[userId]?.selectedGroup || null
    });
});

// קבלת רשימת קבוצות
app.get('/api/whatsapp/groups/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'מזהה משתמש נדרש' });
        }

        if (!whatsappClients[userId]) {
            return res.status(400).json({ success: false, message: 'משתמש לא מחובר ל-WhatsApp' });
        }

        try {
            const chats = await whatsappClients[userId].getChats();
            const groups = chats
                .filter(chat => chat.isGroup)
                .map(group => ({
                    id: group.id._serialized,
                    name: group.name
                }));

            whatsappConnectionState[userId].groups = groups;
            res.json({ success: true, groups });
        } catch (err) {
            console.error('Error fetching groups:', err);
            res.status(500).json({ success: false, message: 'שגיאה בטעינת קבוצות', error: err.message });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'שגיאה בטעינת קבוצות', error: err.message });
    }
});

// שלח הודעת בדיקה לקבוצה
app.post('/api/whatsapp/test-group', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'מזהה משתמש נדרש' });
        }

        const state = whatsappConnectionState[userId];

        if (!whatsappClients[userId]) {
            return res.status(400).json({ success: false, message: 'משתמש לא מחובר ל-WhatsApp' });
        }

        if (!state.selectedGroup) {
            return res.status(400).json({ success: false, message: 'לא נבחרה קבוצה' });
        }

        try {
            // שלח הודעת בדיקה
            await whatsappClients[userId].sendMessage(state.selectedGroup, 'בדיקת חיבור מאפליקציית רשימת קניות 🛒');
            res.json({ success: true, message: 'הודעת בדיקה נשלחה בהצלחה' });
        } catch (err) {
            console.error('Error sending test message:', err);
            res.status(500).json({ success: false, message: 'שגיאה בשליחת הודעת בדיקה', error: err.message });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'שגיאה בשליחת הודעת בדיקה', error: err.message });
    }
});
app.post('/api/whatsapp/toggle-listening', async (req, res) => {
    try {
        const { userId, enabled } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'מזהה משתמש נדרש' });
        }

        if (whatsappConnectionState[userId]) {
            // עדכון מצב האזנה
            whatsappConnectionState[userId].listeningEnabled = enabled;

            // הודע ללקוח על שינוי המצב
            io.to(userId).emit('whatsapp_listening_status', {
                enabled: enabled,
                message: enabled ? 'האזנה לקבוצת WhatsApp מופעלת' : 'האזנה לקבוצת WhatsApp מושבתת'
            });

            res.json({
                success: true,
                enabled: enabled,
                message: enabled ? 'האזנה לקבוצת WhatsApp הופעלה' : 'האזנה לקבוצת WhatsApp הושבתה'
            });
        } else {
            res.status(400).json({ success: false, message: 'חיבור WhatsApp לא נמצא' });
        }
    } catch (err) {
        console.error('Error toggling listening status:', err);
        res.status(500).json({ success: false, message: 'שגיאה בשינוי מצב האזנה', error: err.message });
    }
});
app.use('/api/users', require('./routes/users'));
app.use('/api/groceries', require('./routes/groceries'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
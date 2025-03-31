const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    whatsappConfig: {
        connected: {
            type: Boolean,
            default: false
        },
        selectedGroup: {
            type: String,
            default: null
        },
        selectedGroupName: {
            type: String,
            default: null
        },
        listeningEnabled: {
            type: Boolean,
            default: true
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
module.exports = mongoose.model('User', UserSchema);
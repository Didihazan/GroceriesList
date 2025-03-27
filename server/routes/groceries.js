const express = require('express');
const router = express.Router();
const GroceryItem = require('../models/GroceryItem');
const User = require('../models/User');

router.get('/user/:userId', async (req, res) => {
    try {
        const items = await GroceryItem.find({ user: req.params.userId }).sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a grocery item
router.post('/', async (req, res) => {
    const item = new GroceryItem({
        user: req.body.userId,
        text: req.body.text
    });

    try {
        const newItem = await item.save();
        res.status(201).json(newItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Toggle completion status
router.patch('/:id', async (req, res) => {
    try {
        const item = await GroceryItem.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        item.completed = !item.completed;
        const updatedItem = await item.save();
        res.json(updatedItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// מחיקת פריט מכולת
router.delete('/:id', async (req, res) => {
    try {
        console.log(`בקשת מחיקה לפריט: ${req.params.id}`);

        const item = await GroceryItem.findById(req.params.id);
        if (!item) {
            console.log(`פריט עם ID ${req.params.id} לא נמצא`);
            return res.status(404).json({ message: 'פריט לא נמצא' });
        }

        // בגרסאות חדשות של מונגוס, findByIdAndDelete מומלץ יותר מ-remove
        await GroceryItem.findByIdAndDelete(req.params.id);

        console.log(`פריט ${req.params.id} נמחק בהצלחה`);
        res.json({ message: 'פריט נמחק בהצלחה' });
    } catch (err) {
        console.error(`שגיאה במחיקת פריט ${req.params.id}:`, err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
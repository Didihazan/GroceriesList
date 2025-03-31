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

router.delete('/:id', async (req, res) => {
    try {
        const item = await GroceryItem.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'פריט לא נמצא' });
        await GroceryItem.findByIdAndDelete(req.params.id);
        res.json({ message: 'פריט נמחק בהצלחה' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
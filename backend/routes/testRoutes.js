const express = require('express');
const Test = require('../models/Test');

const router = express.Router();

// Create a test entry
router.post('/add', async (req, res) => {
    const { name } = req.body;

    try {
        const newTest = new Test({ name });
        await newTest.save();
        res.status(201).json({ message: 'Test entry added successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add test entry' });
    }
});

module.exports = router;

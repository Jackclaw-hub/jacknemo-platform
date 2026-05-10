const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/messages
// @desc    Send a message
// @access  Private
router.post('/', protect, async (req, res) => {
    const { recipient_id, listing_id, content } = req.body;

    try {
        const message = new Message({
            sender_id: req.user.id,
            recipient_id,
            listing_id,
            content
        });

        await message.save();
        res.status(201).json(message);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/messages/:recipientId
// @desc    Get messages between current user and a specific recipient
// @access  Private
router.get('/:recipientId', protect, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { sender_id: req.user.id, recipient_id: req.params.recipientId },
                { sender_id: req.params.recipientId, recipient_id: req.user.id }
            ]
        }).sort({ timestamp: 1 });

        res.json(messages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT /api/messages/:messageId/read
// @desc    Mark a message as read
// @access  Private
router.put('/:messageId/read', protect, async (req, res) => {
    try {
        let message = await Message.findById(req.params.messageId);

        if (!message) {
            return res.status(404).json({ msg: 'Message not found' });
        }

        // Ensure only the recipient can mark as read
        if (message.recipient_id.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        message.read_at = Date.now();
        await message.save();

        res.json(message);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;

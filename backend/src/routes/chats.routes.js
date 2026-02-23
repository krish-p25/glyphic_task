const express = require('express');
const router = express.Router();
const chatsController = require('../controllers/chats.controller.js');

// POST /api/chat/create
// Creates a new chat session
router.post(
    '/create',
    chatsController.createChat
);

module.exports = router;
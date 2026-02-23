const express = require('express');
const router = express.Router();
const chatsController = require('../controllers/chats.controller.js');

//GET /api/chat/get-chats
// Gets most recent chats, limit 50
router.get(
    '/get-chats',
    chatsController.getChats
)

// POST /api/chat/create
// Creates a new chat session
router.post(
    '/create',
    chatsController.createChat
);

module.exports = router;
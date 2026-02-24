const express = require('express');
const router = express.Router();
const ChatsController = require('../controllers/chats.controller.js');

//GET /api/chat/get-chats
// Gets most recent chats, limit 50
router.get(
    '/get-chats',
    ChatsController.GetChats
)

// POST /api/chat/create
// Creates a new chat session
router.post(
    '/create',
    ChatsController.CreateChat
);

// GET /api/chat/get-messages
// Retrieves all messages within a chat
router.get(
    '/get-messages',
    ChatsController.GetMessages
)

// POST /api/chat/send-message
// Adds a message to an existing chat
router.post(
    '/send-message',
    ChatsController.AddMessageToChat
)

module.exports = router;
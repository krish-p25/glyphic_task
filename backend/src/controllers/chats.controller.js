const { Chat } = require('../models/Chat.js');
const axios = require('axios');

//Get existing chats
async function getChats(req, res) {
    try {
        const allChats = await Chat.findAll({
            limit: 50
        })
        res.status(200).json({chats: allChats})
    }
    catch (error) {
        console.error('❌ Error getting chats:', error);
        res.status(500).json({ error: 'Failed to retrive chats' });
    }
}

// Create a new chat session
async function createChat(req, res) {
    try {
        const { title, description } = req.body;
        const chat = await Chat.create({ title, description });
        res.status(201).json(chat);
    }
    catch (error) {
        console.error('❌ Error creating chat:', error);
        res.status(500).json({ error: 'Failed to create chat' });
    }
}

module.exports = {
    createChat,
    getChats
};
const { Chat } = require('../models/Chat.js');
const { APIRequest } = require('../models/APIRequest.js');

const { anthropic } = require('../models/claude.js');

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
        const { message } = req.body;
        const newChat = await Chat.create({
            title: message,
            timestamp: Date.now()
        });

        const claudeResponse = await anthropic.messages.create({
            model: "claude-haiku-4-5",
            max_tokens: 500,
            system: [
                {
                    type: 'text',
                    text: `You are a data analyst assistant`
                }
            ],
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text:
                            `This is the query from your user: ${message}` + 
                            'Your first step is to build the API request needed to get the relevant information' + 
                            'The parameters in the API request are: ' +
                            'participant_email (string)' + 
                            'start_time_from (UTC ISO 8601 string)' + 
                            'start_time_to (UTC ISO 8601 string)' + 
                            'title_filter (string)' + 
                            'cursor (string)' + 
                            'limit (integer max 100)' +
                            'the base url for this api call is https://api.staging.glyphic.ai/v1/calls?' + 
                            'add the relevant parameters to the end of this URL and respond with just the API request URL' + 
                            'do not include any other text in your response other than just the API URL'
                            
                        }
                    ]
                }
            ]
        })

        const parsedAPIURL = claudeResponse.content[0].text

        const newAPIRequest = await APIRequest.create({
            chat_id: newChat.uuid,
            api_url: parsedAPIURL,
            timestamp: Date.now()
        })

        res.status(201).json(newChat);
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
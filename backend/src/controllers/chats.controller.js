const { Chat } = require('../models/Chat.js');
const { APIRequest } = require('../models/APIRequest.js');
const { Message } = require('../models/Message.js');
const axios = require('axios')
const { anthropic } = require('../models/claude.js');

//Get existing chats
async function GetChats(req, res) {
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
async function CreateChat(req, res) {
    try {
        const { message } = req.body;
        const newChat = await Chat.create({
            title: message,
            timestamp: Date.now(),
        });

        await Message.create({
            content: message,
            timestamp: Date.now(),
            chat_id: newChat.uuid,
            source: 'user'
        });

        // Create initial query to build endpoint with required info
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
                            'add the relevant parameters to the end of this URL and respond with just the API request URL only' + 
                            'do not include any other text in your response other than just the API URL' + 
                            'If no API URL can be generated due to lack of information, prompt the user with a message which finelines what informaiton you need.' + 
                            'If finelining what you need, do not state you are creating an API endpoint or state the exact variable name, state name, email etc.' + 
                            'Try to create an API URL always where possible'
                        }
                    ]
                }
            ]
        })

        try {
            // Check if returned URL is valid, if so, save the created endpoint
            // Saving the endpoint allows easy access to request the same information
            const parsedAPIURL = claudeResponse.content[0].text
            try {
                checkUrl = new URL(parsedAPIURL.trim())
            }
            catch (err) {
                res.status(201).json({
                    uuid: newChat.uuid,
                    message: claudeResponse.content[0].text.trim()
                });

                await Message.create({
                    content: claudeResponse.content[0].text.trim(),
                    timestamp: Date.now(),
                    chat_id: newChat.uuid,
                    source: 'bot'
                })
            }

            return

            const newAPIRequest = await APIRequest.create({
                chat_id: newChat.uuid,
                api_url: parsedAPIURL.trim(),
                timestamp: Date.now()
            })

            const response = await axios.get(
                parsedAPIURL,
                {
                    headers: {
                        "X-API-Key": process.env.GLYPHIC_API_KEY,
                    },
                }
            )
            const CallsData = response.data

            const DataAnalysis = await anthropic.messages.create({
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
                                    'Use the JSON data attached to answer their query.'
                            },
                            {
                                type: 'json',
                                data: CallsData
                            }
                        ]
                    }
                ]
            })
            console.log(DataAnalysis)
        }
        catch (err) {
            console.log('⚠️ Query returned with no API URL', newChat.uuid)
            console.log(err)
            res.status(201).json({
                uuid: newChat.uuid,
                message: claudeResponse.content[0].text.trim()
            });

        }
        

    }
    catch (error) {
        console.error('❌ Error creating chat:', error);
        res.status(500).json({ error: 'Failed to create chat' });
    }
}

// List the messages in a Chat to display on the frontend
async function GetMessages(req, res) {
    try {
        const AllMessages = await Message.findAll({
            where: {
                chat_id: req.query.chat
            }
        })
        res.status(200).json({messages: AllMessages})
    }
    catch (error) {
        console.error('❌ Error getting chats:', error);
        res.status(500).json({ error: 'Failed to retrive chats' });
    }
}

// Load a chat session and retrieve the relevant information
async function RetrieveChat(req, res) {
    try {
        const { chat_id } = req.body
        let CallListArray = []
        let CallItemArray = []

        const APIRequests = await APIRequest.findAll({
            where: {
                chat_id: chat_id
            }
        })

        for (const Request of APIRequests) {
            try {
                const response = await axios.get(
                    `${Request.api_url}`,
                    {
                        headers: {
                            "X-API-Key": process.env.GLYPHIC_API_KEY,
                        },
                    }
                );
                InformationArray = [...InformationArray, ...response.data]
            }
            catch (err) {
                console.log('⚠️ Error retreiving chat information', newChat.uuid)
            }
        }
    }
    catch (error) {
        console.error('❌ Error getting chat:', error);
        res.status(500).json({ error: 'Failed to retrive chat' });
    }
}

module.exports = {
    GetChats,
    CreateChat,
    RetrieveChat,
    GetMessages
};
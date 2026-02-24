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
        res.status(200).json({ chats: allChats })
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

        // Create new Chat object
        const newChat = await Chat.create({
            title: message,
            timestamp: Date.now(),
        });

        // Create new Message object and assign to chat id
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
                            'start_time_to (UTC ISO 8601 string) (current date is 23/02/2026)' + 
                            'title_filter (string)' + 
                            'cursor (string)' + 
                            'limit (integer max 100)' +
                            'the base url for this api call is https://api.staging.glyphic.ai/v1/calls?' + 
                            'add the relevant parameters to the end of this URL and respond with just the API request URL only' + 
                            'Do not include any other text in your response other than just the API URL' + 
                            'Do not prompt the user to provide more information, if there is insufficient informaiton, return just the base URL'
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
                // If no URL is generated, return response to user
                await Message.create({
                    content: claudeResponse.content[0].text.trim(),
                    timestamp: Date.now(),
                    chat_id: newChat.uuid,
                    source: 'bot'
                })

                return res.status(201).json({
                    uuid: newChat.uuid,
                    message: claudeResponse.content[0].text.trim()
                });
            }

            // Make request to Glyphic API with generated API endpoint
            // Store API Request endpoint for future reference if user returns to chat
            await APIRequest.create({
                chat_id: newChat.uuid,
                api_url: parsedAPIURL.trim(),
                timestamp: Date.now(),
                type: 'calls_list'
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

            // Create chat with Claude with user query and call data
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
                                    'Respond with a user friendly text pattern' + 
                                    'Do not refer to variables by name' + 
                                    'Your response should be non-technical user friendly' +
                                    'The JSON sales data has been stringified below' + 
                                    `${JSON.stringify(CallsData)}`
                            }
                        ]
                    }
                ]
            })
            
            const DataAnalysisResponse = DataAnalysis.content[0].text.trim()

            // Create new Message object to store response
            await Message.create({
                content: DataAnalysisResponse,
                timestamp: Date.now(),
                chat_id: newChat.uuid,
                source: 'bot'
            })

            // Return chat uuid so frontend can render message history created
            res.status(201).json({
                uuid: newChat.uuid
            });
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
        res.status(200).json({ messages: AllMessages })
    }
    catch (error) {
        console.error('❌ Error getting chats:', error);
        res.status(500).json({ error: 'Failed to retrive chats' });
    }
}

// Add a message to a chats history
async function AddMessageToChat(req, res) {
    try {
        const { message, chatId } = req.body

        const CalledChat = await Chat.findOne({
            where: {
                uuid: chatId
            }
        })
        if (!CalledChat) res.status(404).json({ error: 'Chat not found' });

        // Store user message
        await Message.create({
            chat_id: chatId,
            timestamp: Date.now(),
            content: message,
            source: 'user'
        })

        // Map chat history to later pass into Claude
        const AllChatHistory = await Message.findAll({
            where: {
                chat_id: chatId
            }
        })

        const MappedChatHistory = AllChatHistory
        .sort((a, b) => parseFloat(a.timestamp) - parseFloat(b.timestamp))
        .map(message => {
            return `${message.source === 'user' ? 'User said: ' : 'You said: '} ${message.content}`
        })

        // Retrieve up-to-date latest information for the chat context
        const AllAPIEndpoints = await APIRequest.findAll({
            where: {
                chat_id: chatId
            }
        })

        // Create store of information from API to pass to Claude
        let StoredInformation = []
        for (const Endpoint of AllAPIEndpoints) {
            const response = await axios.get(
                `${Endpoint.api_url}`,
                {
                    headers: {
                        "X-API-Key": process.env.GLYPHIC_API_KEY,
                    },
                }
            );
            Endpoint.type === 'calls_list' ? StoredInformation.push(response.data.data) : StoredInformation.push([response.data])
        }

        // Prompt Claude to analyse whether new information is needed from Glyphic API
        const DataAnalysis = await anthropic.messages.create({
            model: "claude-haiku-4-5",
            max_tokens: 500,
            system: [
                {
                    type: 'text',
                    text: `You are a data analyst assistant. Do NOT use triple backticks.`
                }
            ],
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text:
                                `On my API there are two options, get a list of calls and get call by id` +
                                `Below is a users chat history with your reponses, and relevant information.` + 
                                `Determine whether you can provide a response based off of the current chat history and information.` + 
                                `If not, let me know if you need more information, by either getting a list of calls or getting a specific call by id.` +
                                `Respond with only one variable from these 3 options:` +
                                `enough_information if no information is needed and provide your response as a data analyst in the second element in the content array` +
                                `calls_list if you need to retrieve information about calls, build the api endpoint which is instructed in the next message and return just this api endpoint alone in the second element in the content array` +
                                `get_call if you need to retrive information about one specific call, send the API endpoint as a second element in the content array (https://api.staging.glyphic.ai/v1/calls/{call_id} where call_id is the call_id of the call you need informaiton about)` +
                                `Chat history: ${JSON.stringify(MappedChatHistory)}` + 
                                `API Information: ${JSON.stringify(StoredInformation)}`
                        },
                        {
                            type: 'text',
                            text:
                                'This is your reference to build the API request needed to get the relevant information' +
                                'The parameters in the API request are: ' +
                                'participant_email (string)' +
                                'start_time_from (UTC ISO 8601 string)' +
                                'start_time_to (UTC ISO 8601 string) (current date is 23/02/2026)' +
                                'title_filter (string)' +
                                'cursor (string)' +
                                'limit (integer max 100)' +
                                'the base url for this api call is https://api.staging.glyphic.ai/v1/calls?' +
                                'add the relevant parameters to the end of this URL and respond with just the API request URL only' +
                                'Do not include any other text in your response other than just the API URL' +
                                'Do not prompt the user to provide more information, if there is insufficient informaiton, return just the base URL'
                        }
                    ]
                }
            ]
        })
        
        //Parse Next Step and process accordingly
        const NextStep = DataAnalysis.content[0].text.split('\n')[0]

        if (NextStep == 'enough_information') {
            const DataAnalysisInformation = DataAnalysis.content[0].text.replace('enough_information', '').trim()
            await Message.create({
                chat_id: chatId,
                content: DataAnalysisInformation,
                source: 'bot',
                timestamp: Date.now()
            })
            return res.status(201).json({
                uuid: chatId,
            });
        }
        else if (NextStep == 'calls_list') {
            const NewEndpointToCall = DataAnalysis.content[0].text.split('\n')[1]
            await APIRequest.create({
                chat_id: chatId,
                api_url: NewEndpointToCall,
                timestamp: Date.now(),
                type: 'calls_list'
            })
            const SuccessfulResponse = await GenerateReponse(chatId)
            if (SuccessfulResponse) {
                return res.status(201).json({
                    uuid: chatId,
                });
            }
            else {
                return res.status(501).json({
                    uuid: chatId,
                    message: 'Unable to generate response to user input'
                });
            }
        }
        else if (NextStep == 'get_call') {
            const NewEndpointToCall = DataAnalysis.content[0].text.split('\n')[1]
            await APIRequest.create({
                chat_id: chatId,
                api_url: NewEndpointToCall,
                timestamp: Date.now(),
                type: 'get_call'
            })
            const SuccessfulResponse = await GenerateReponse(chatId)
            if (SuccessfulResponse) {
                return res.status(201).json({
                    uuid: chatId,
                });
            }
            else {
                return res.status(501).json({
                    uuid: chatId,
                    message: 'Unable to generate response to user input'
                });
            }
        }
        else {
            return res.status(501).json({
                uuid: chatId,
                message: 'Unable to determine next steps from user input'
            });
        }
    }
    catch (error) {
        console.error('❌ Error adding message:', error);
        res.status(500).json({ error: 'Failed to add message' });
    }
}

async function GenerateReponse(chat_id) {
    try {
        const AllChatHistory = await Message.findAll({
            where: {
                chat_id
            }
        })

        const MappedChatHistory = AllChatHistory
            .sort((a, b) => parseFloat(a.timestamp) - parseFloat(b.timestamp))
            .map(message => {
                return `${message.source === 'user' ? 'User said: ' : 'You said: '} ${message.content}`
            })

        // Retrieve up-to-date latest information for the chat context
        const AllAPIEndpoints = await APIRequest.findAll({
            where: {
                chat_id
            }
        })

        let StoredInformation = []
        for (const Endpoint of AllAPIEndpoints) {
            console.log(Endpoint.api_url)
            const response = await axios.get(
                `${Endpoint.api_url}`,
                {
                    headers: {
                        "X-API-Key": process.env.GLYPHIC_API_KEY,
                    },
                }
            );
            Endpoint.type === 'calls_list' ? StoredInformation.push(response.data.data) : StoredInformation.push([response.data])
        }
        console.log(StoredInformation)

        // Prompt Claude to analyse whether new information is needed from Glyphic API
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
                                `Below is a users chat history with your reponses, and relevant information.` + 
                                `Provide the next response based off of the current chat history and informaiton` + 
                                `Do not refer to the user or API, simply provide the data analytics response only, ready to be delivered to the user directly.` + 
                                `Chat history: ${JSON.stringify(MappedChatHistory)}` +
                                `API Information: ${JSON.stringify(StoredInformation)}`
                        }
                    ]
                }
            ]
        })

        const DataAnalysisInformation = DataAnalysis.content[0].text
        await Message.create({
            chat_id,
            content: DataAnalysisInformation,
            source: 'bot',
            timestamp: Date.now()
        })

        return true
    }
    catch (error) {
        console.error('❌ Error generating response from claude:', error);
    }
}

module.exports = {
    GetChats,
    CreateChat,
    GetMessages,
    AddMessageToChat
};
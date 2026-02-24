require('dotenv').config({ quiet: true });
const { Anthropic } = require('@anthropic-ai/sdk')
const axios = require('axios')
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
})

async function test_claude(message) {
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
                            'If there is no relevant information to retrieve, return the base URL.' + 
                            'Return your response in JSON, where the final url with parameters is under the variable api_url:'
                    }
                ]
            }
        ]
    })
    console.log(claudeResponse)
}
// test_claude('Find all calls we’ve had with jordan@freetrade.io')

async function test_glyphic() {
    const response = await axios.get(
        "https://api.staging.glyphic.ai/v1/calls?limit=20",
        {
            headers: {
                "X-API-Key": process.env.GLYPHIC_API_KEY,
            },
        }
    );
    console.log(response.data)
}
test_glyphic()
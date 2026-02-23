const { Anthropic } = require('@anthropic-ai/sdk')
const path = require('path');
require('dotenv').config({
    path: path.resolve(__dirname, '../../../.env'),
    quiet: true
});

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
})

module.exports = { anthropic }
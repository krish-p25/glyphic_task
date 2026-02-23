const express = require('express');
const app = require('./src/app');
require('dotenv').config({ quiet: true });
const GLYPHIC_API_KEY = process.env.GLYPHIC_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const PORT = process.env.PORT || 3001;

//Test the database connection
const { testConnection } = require('./src/models/config.js');
testConnection();

app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});

app.get('/', (req, res) => {
    res.send('Hello World');
});
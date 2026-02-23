const express = require('express');
const app = express();
const cors = require('cors');

//Routes
const chatsRoutes = require('./routes/chats.routes.js');
app.use('/api/chats', chatsRoutes);

//Health check
app.get('/health', (req, res) => {
    res.status(200).json({ message: 'Server is running' });
});

//CORS
app.use(cors());

module.exports = app;
const express = require('express');
const app = express();
const cors = require('cors');

// Parse JSON
app.use(express.json())
app.use(express.urlencoded({extended: true}))

//CORS
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
}));

//Routes
const chatsRoutes = require('./routes/chats.routes.js');
app.use('/api/chats', chatsRoutes);

//Health check
app.get('/health', (req, res) => {
    res.status(200).json({ message: 'Server is running' });
});

module.exports = app;
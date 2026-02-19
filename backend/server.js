const express = require('express');
const app = express();
require('dotenv').config({ quiet: true });
const GLYPHIC_API_KEY = process.env.GLYPHIC_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.get('/', (req, res) => {
    res.send('Hello World');
});
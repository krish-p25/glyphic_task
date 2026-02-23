require('dotenv').config({ quiet: true });

fetch('https://api.staging.glyphic.ai/v1/test/ping', {
    method: 'GET',
    headers: {
        'X-API-Key': `${process.env.GLYPHIC_API_KEY}`
    }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
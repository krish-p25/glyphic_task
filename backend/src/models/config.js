const path = require('path');
require('dotenv').config({
    path: path.resolve(__dirname, '../../../.env'),
    quiet: true
});
const { Sequelize } = require('sequelize');

// Create a new Sequelize instance
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'postgres',
        port: process.env.DB_PORT,
        logging: false
    }
);

//Test the connection
async function testConnection() {
    try {

        // Authenticate database connection
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully.');
        
        // Sync tables
        const { Chat } = require('./Chat.js');
        const { Message } = require('./Message.js');
        const { APIRequest } = require('./APIRequest.js');

        await Chat.sync()
        await Message.sync()
        await APIRequest.sync()
        console.log('✅ Database tables synced successfully.');
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
        throw error;
    }
}

module.exports = {
    sequelize,
    testConnection
};
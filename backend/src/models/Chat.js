const { DataTypes } = require('sequelize');
const { sequelize } = require('./config.js');

const Chat = sequelize.define('Chat', {
    uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    timestamp: {
        type: DataTypes.BIGINT,
        allowNull: false,
    }
}, {
    timestamps: false,
    tableName: 'chats'
});

module.exports = {
    Chat
};
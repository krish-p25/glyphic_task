const { DataTypes } = require('sequelize');
const { sequelize } = require('./config.js');

const Message = sequelize.define('Message', {
    uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true,
        primaryKey: true
    },
    chat_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    timestamp: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    content: {
        type: DataTypes.STRING,
        allowNull: false
    },
    source: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    timestamps: false,
    tableName: 'messages'
});

module.exports = {
    Message
};
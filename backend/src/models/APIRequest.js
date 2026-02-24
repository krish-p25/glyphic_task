const { DataTypes } = require('sequelize');
const { sequelize } = require('./config.js');

const APIRequest = sequelize.define('APIRequest', {
    uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true,
        primaryKey: true
    },
    chat_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    api_url: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    timestamp: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    timestamps: false,
    tableName: 'api_requests'
});

module.exports = {
    APIRequest
};
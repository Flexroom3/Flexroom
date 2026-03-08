require('dotenv').config();

const config = {
    user: process.env.DB_USER,        // The 'sa' username
    password: process.env.DB_PASSWORD, // The password you just set
    server: process.env.DB_SERVER,    // 127.0.0.1
    database: process.env.DB_NAME,    // FlexroomDB
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
        encrypt: false,               // Set to true if using Azure
        trustServerCertificate: true, // Crucial for local development
        instanceName: 'SQLEXPRESS'    // Helps find your specific SQL engine
    }
};

module.exports = config;
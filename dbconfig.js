require('dotenv').config();

const config = {
    server: process.env.DB_SERVER, 
    database: process.env.DB_NAME,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        // This converts the string 'true' from .env into a real boolean
        trustedConnection: process.env.DB_TRUSTED === 'true' 

    },
    port: 1433
};

module.exports = config;
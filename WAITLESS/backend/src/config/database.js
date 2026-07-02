// backend/config/database.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// Check if we're using MySQL or file storage
const useMySQL = process.env.DB_PROVIDER === 'mysql';

if (!useMySQL) {
    console.log('⚠️  Using FILE storage (demo mode). Set DB_PROVIDER=mysql in .env to use MySQL.');
}

// Create connection pool ONLY if using MySQL
let pool = null;

if (useMySQL) {
    pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'waitless_db',
        port: parseInt(process.env.DB_PORT) || 3306,
        waitForConnections: true,
        connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
    });

    // Test connection on startup
    (async () => {
        try {
            const connection = await pool.getConnection();
            console.log('✅ MySQL Database connected successfully!');
            connection.release();
        } catch (error) {
            console.error('❌ MySQL Connection Failed:', error.message);
            console.error('   Please check:');
            console.error('   1. Is XAMPP running? (MySQL service started)');
            console.error('   2. Database name "waitless_db" exists?');
            console.error('   3. .env file has correct credentials?');
        }
    })();
}

module.exports = { pool, useMySQL };

require('dotenv').config();

const express = require("express");
const cors = require("cors");
const { pool, useMySQL } = require('./src/config/database'); // Import database connection

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route: Check if server is running
app.get("/", (req, res) => {
    res.send("WaitLess Backend Running ");
});

// Test route: Check database connection
app.get("/api/test-db", async (req, res) => {
    try {
        if (!useMySQL) {
            return res.json({ 
                success: true, 
                message: 'Using FILE storage (demo mode). Set DB_PROVIDER=mysql in .env' 
            });
        }
        
        // Simple query to test connection
        const [rows] = await pool.query('SELECT 1+1 AS result');
        res.json({ 
            success: true, 
            message: ' Database connected successfully!',
            data: rows 
        });
    } catch (error) {
        console.error('Database test error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(` Server running on http://localhost:${PORT}`);
});
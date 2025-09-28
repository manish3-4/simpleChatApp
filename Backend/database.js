// database.js
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// A temporary User ID for the current session (replace with actual authentication later)
const SESSION_USER_ID = 1; 
const GROUP_ID = 1;

/**
 * Retrieves all messages and joins with user data.
 */
async function getMessages(groupId) {
    const [rows] = await pool.execute(`
        SELECT 
            m.message_id, m.content, m.timestamp, m.sender_id,
            u.username, u.is_anonymous
        FROM Messages m
        JOIN Users u ON m.sender_id = u.user_id
        WHERE m.group_id = ?
        ORDER BY m.timestamp ASC
    `, [groupId]);
    return rows;
}

/**
 * Saves a new message to the database.
 */
async function saveMessage(senderId, content, groupId) {
    const [result] = await pool.execute(
        'INSERT INTO Messages (sender_id, content, group_id) VALUES (?, ?, ?)',
        [senderId, content, groupId]
    );

    // After insertion, fetch the saved message with sender details for broadcasting
    const [rows] = await pool.execute(`
        SELECT 
            m.message_id, m.content, m.timestamp, m.sender_id,
            u.username, u.is_anonymous
        FROM Messages m
        JOIN Users u ON m.sender_id = u.user_id
        WHERE m.message_id = ?
    `, [result.insertId]);

    return rows[0];
}

module.exports = {
    getMessages,
    saveMessage,
    SESSION_USER_ID,
    GROUP_ID
};


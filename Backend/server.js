// chatapp/backend/server.js
require('dotenv').config({ path: './.env/' }); // IMPORTANT: Specify the path to .env
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const path = require('path'); // Use 'path' module for directory manipulation
const db = require('./database'); // Assuming database.js is also in the backend folder

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});
const PORT = process.env.PORT || 3000;

// Middleware Setup
app.use(cors());
app.use(express.json());

// ------------------------------------------------------------------
// 1. SERVE STATIC FRONTEND FILES
// The server must point to the 'frontend' directory relative to the chatapp/backend folder.
// path.join(__dirname, '../frontend') moves up one level (to chatapp/) then into frontend/
// ------------------------------------------------------------------
app.use(express.static(path.join(__dirname, '../Frontend'))); 

// ------------------------------------------------------------------
// 2. REST API Routes (Example: Initial message history)
// ------------------------------------------------------------------

app.get('/api/messages/:group_id', async (req, res) => {
    try {
        const messages = await db.getMessages(req.params.group_id);
        res.json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Route to serve the index.html file for the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend', 'index.html'));
});
// ------------------------------------------------------------------
// 3. SOCKET.IO Real-Time Communication
// ------------------------------------------------------------------

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    socket.join(`group-${db.GROUP_ID}`);

    socket.on('send_message', async (msgData) => {
        try {
            const newMessage = await db.saveMessage(
                db.SESSION_USER_ID, 
                msgData.content,
                db.GROUP_ID
            );
            io.to(`group-${db.GROUP_ID}`).emit('receive_message', newMessage);
        } catch (error) {
            console.error("Error saving/broadcasting message:", error);
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Start the HTTP server
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
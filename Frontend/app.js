// chatapp/frontend/app.js

// IMPORTANT: This ID must match the SESSION_USER_ID set in database.js 
// It determines whether a message is displayed as 'self' or 'other'.
const CURRENT_USER_ID = 1; 
const GROUP_ID = 1; 

const CHAT_API_URL = `http://localhost:3000/api`;
const chatContainer = document.getElementById('chat-container');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');

// ----------------------
// 1. SOCKET.IO SETUP
// ----------------------

// Connect to the Socket.io server running on the backend port 3000
const socket = io('http://localhost:3000'); 

socket.on('connect', () => {
    console.log('Connected to chat server via Socket.io');
    // Once connected, load history
    loadMessageHistory();
});

// Listener for receiving real-time messages broadcasted by the server
socket.on('receive_message', (message) => {
    console.log('New real-time message received:', message);
    renderMessage(message); 
    scrollToBottom();
});

// ----------------------
// 2. DOM MANIPULATION & RENDERING
// ----------------------

/**
 * Creates and appends a new message bubble to the chat container.
 * @param {object} message - The message object with sender details.
 */
function renderMessage(message) {
    const isSelf = message.sender_id === CURRENT_USER_ID;
    
    // Determine the sender name: 'Anonymous', actual username, or null for self-sent messages
    let senderName = message.is_anonymous ? 'Anonymous' : message.username;
    if (isSelf) {
        // As per the image example, self-sent messages don't display a username header.
        senderName = null; 
    }

    const messageWrapper = document.createElement('div');
    messageWrapper.classList.add('message-wrapper', isSelf ? 'message-self' : 'message-other');

    // 1. Sender Name/Header (only rendered for messages from others)
    if (senderName) {
        const senderHeader = document.createElement('div');
        senderHeader.classList.add('message-sender');
        senderHeader.textContent = senderName;
        messageWrapper.appendChild(senderHeader);
    }

    // 2. Message Bubble
    const bubble = document.createElement('div');
    bubble.classList.add('message-bubble');
    bubble.textContent = message.content;
    
    // Optional: Add timestamp
    const time = new Date(message.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    bubble.innerHTML += ` <span class="timestamp">${time}</span>`;
    
    messageWrapper.appendChild(bubble);
    chatContainer.appendChild(messageWrapper);
}

function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ----------------------
// 3. EVENT LISTENERS & API CALLS
// ----------------------

// Fetch initial message history from the REST API
async function loadMessageHistory() {
    try {
        const response = await fetch(`${CHAT_API_URL}/messages/${GROUP_ID}`);
        if (!response.ok) throw new Error('Failed to fetch history');
        
        const messages = await response.json();
        
        // Render history
        chatContainer.innerHTML = '';
        messages.forEach(renderMessage);
        scrollToBottom();
        
    } catch (error) {
        console.error("Error loading message history:", error);
    }
}

// Handle form submission to send a message via Socket.io
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const content = messageInput.value.trim();
    if (content) {
        const messageData = {
            sender_id: CURRENT_USER_ID, 
            content: content,
            group_id: GROUP_ID
        };
        
        // Emit the message to the server for processing and broadcasting
        socket.emit('send_message', messageData); 
        
        messageInput.value = ''; // Clear input
    }
});
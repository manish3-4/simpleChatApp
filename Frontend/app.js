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
    
    // Determine the sender name and avatar source
    let senderName = message.is_anonymous ? 'Anonymous' : message.username;
    let avatarSrc = null;
    
    if (!isSelf) {
        // Simple consistent avatar assignment based on sender_id's parity
        avatarSrc = (senderName == 'Anonymous') ? 'public/user.png' : '/public/avatar2.jpg';
    }

    if (isSelf) {
        // Self-sent messages don't display a username header or avatar
        senderName = null; 
    }

    const messageWrapper = document.createElement('div');
    messageWrapper.classList.add('message-wrapper', isSelf ? 'message-self' : 'message-other');

    // 1. Avatar (rendered for messages from others)
    if (avatarSrc) {
        const avatarDiv = document.createElement('div');
        avatarDiv.classList.add('message-avatar');
        const avatarImg = document.createElement('img');
        avatarImg.src = avatarSrc; // Assumes images are in the frontend directory
        avatarImg.alt = 'Avatar';
        avatarDiv.appendChild(avatarImg);
        messageWrapper.appendChild(avatarDiv);
    }
    
    // 2. Content Area (Username + Bubble)
    const contentArea = document.createElement('div');
    contentArea.classList.add('message-content-area'); 

    // 2a. Sender Name/Header 
    if (senderName) {
        const senderHeader = document.createElement('div');
        senderHeader.classList.add('message-sender');
        senderHeader.textContent = senderName;
        contentArea.appendChild(senderHeader);
    }

    // 2b. Message Bubble
    const bubble = document.createElement('div');
    bubble.classList.add('message-bubble');
    
    // Message Content
    let bubbleContent = message.content;
    
    // Timestamp
    const time = new Date(message.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    // Combine content and timestamp (and checkmark for self)
    bubble.innerHTML = `${bubbleContent} <span class="timestamp">${time}</span>`;
    
    // Add checkmark/tick for self-sent messages
    if (isSelf) {
        // Using a basic checkmark for simplicity, replace with an icon if desired
        bubble.innerHTML += ` <span class="checkmark">✓</span>`; 
    }
    
    contentArea.appendChild(bubble);
    
    // Append the content area to the wrapper
    messageWrapper.appendChild(contentArea);
    chatContainer.appendChild(messageWrapper);
}

function scrollToBottom() {
    // Wait for the next paint cycle to ensure the message is fully rendered before scrolling
    requestAnimationFrame(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    });
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

// Load history when the page loads, in case Socket.io connection is slow
window.addEventListener('load', loadMessageHistory);

// ----------------------
// 4. Anonymous functionality 
// ----------------------

const headerRight = document.querySelector('.header-right');
const anonymousImage = document.querySelector('.header-right img');
const anonymousNote = document.querySelector('.anonymous-note');
let isAnonymous = false;

// Add a click event listener to the header-right div
headerRight.addEventListener('click', () => {
    if (!isAnonymous) {
        // Switch to anonymous mode
        anonymousImage.src = 'public/annoafter.png'; // Replace with the new image path
        anonymousNote.innerHTML = '<i class="fas fa-car"></i> Now you\'re appearing as Anonymous!';
        addAnonymousMessage('You are now appearing as Anonymous!');
    } else {
        // Switch back to original mode
        anonymousImage.src = 'public/annobefore.png'; // Replace with the original image path
        anonymousNote.innerHTML = '<i class="fas fa-lock"></i> You are no longer Anonymous!';
        addAnonymousMessage('You are no longer Anonymous!');
    }
    isAnonymous = !isAnonymous;
});


function addAnonymousMessage(message) {
    const divider = document.createElement('hr'); // Create a horizontal divider
    divider.style.border = '1px solid #ccc'; // Style the divider

    const anonymousMessage = document.createElement('div');
    anonymousMessage.classList.add('anonymous-message');
    anonymousMessage.textContent = message;
    anonymousMessage.style.textAlign = 'center'; // Center the message
    anonymousMessage.style.color = '#888'; // Optional: Style the message text
    anonymousMessage.style.margin = '10px 0'; // Add spacing

    // Append the divider and message to the chat container
    chatContainer.appendChild(divider);
    chatContainer.appendChild(anonymousMessage);

    // Scroll to the bottom to ensure the message is visible
    scrollToBottom();
}


//file input

const fileInput = document.getElementById('file-input');

fileInput.addEventListener('change', (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
        console.log('File selected:', selectedFile.name);
        // Add logic to handle the file (e.g., upload it to the server)
    }
});
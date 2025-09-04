// chat.js
// Example: Connects to a WebSocket server and displays received messages in the messages-box


const messagesBox = document.getElementById('messages-box');
const chatInput = document.querySelector('.chat-input');
const chatSend = document.querySelector('.chat-send');

// Replace with your server URL
const socket = new WebSocket('ws://localhost:8080');

function displayMessage(text, isOwn = false) {
    const msgDiv = document.createElement('div');
    msgDiv.textContent = text;
    if (isOwn) {
        msgDiv.style.color = '#09BC8A';
        msgDiv.style.textAlign = 'right';
    }
    messagesBox.appendChild(msgDiv);
    messagesBox.scrollTop = messagesBox.scrollHeight;
}

function sendMessage() {
    const message = chatInput.value.trim();
    if (message && socket.readyState === WebSocket.OPEN) {
        socket.send(message);

    }
    displayMessage(message, true);
    chatInput.value = '';
}

chatSend.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

socket.addEventListener('message', function (event) {
    displayMessage(event.data);
});

socket.addEventListener('open', function () {
    displayMessage('Connected to chat server.');
});

socket.addEventListener('close', function () {
    displayMessage('Disconnected from chat server.');
});

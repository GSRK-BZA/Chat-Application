let peerConnection;
let dataChannel;
let messagesDiv = document.getElementById('messages');
let localMessages = [];
let username = localStorage.getItem('username') || '';
let connectionStatus = false;
let remoteConnection;

// Function to join the chat
function joinChat() {
    if (!username) {
        username = document.getElementById('user').value;
        if (!username) {
            alert("Please enter a username");
            return;
        }
        localStorage.setItem('username', username); // Store username in localStorage
    }

    // Create WebRTC connection
    const configuration = { 'iceServers': [] };
    peerConnection = new RTCPeerConnection(configuration);
    
    // Create Data Channel
    dataChannel = peerConnection.createDataChannel('chat');
    
    // Add event listeners for the Data Channel
    dataChannel.onmessage = receiveMessage;
    dataChannel.onopen = () => {
        console.log('Data Channel is open');
        connectionStatus = true;
    };
    dataChannel.onclose = () => {
        console.log('Data Channel is closed');
        connectionStatus = false;
    };

    // On ICE Candidate (for connection)
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log('ICE candidate:', event.candidate);
            remoteConnection.addIceCandidate(event.candidate);
        }
    };

    // Create Offer and set as local description
    peerConnection.createOffer()
        .then(offer => peerConnection.setLocalDescription(offer))
        .then(() => {
            console.log('Offer created:', peerConnection.localDescription);
            simulateSignaling(peerConnection.localDescription);
        });
    
    // Store previous messages
    loadMessagesFromLocalStorage();
    alert("You have joined the chat as " + username);
}

// Simulate the signaling exchange
function simulateSignaling(offer) {
    // Remote peer creates connection
    remoteConnection = new RTCPeerConnection({ 'iceServers': [] });
    
    remoteConnection.ondatachannel = (event) => {
        dataChannel = event.channel;
        dataChannel.onmessage = receiveMessage;
        dataChannel.onopen = () => {
            console.log('Remote Data Channel is open');
            connectionStatus = true;
        };
        dataChannel.onclose = () => {
            console.log('Remote Data Channel is closed');
            connectionStatus = false;
        };
    };

    // Add ICE candidates to remote peer
    remoteConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log('Remote ICE candidate:', event.candidate);
            peerConnection.addIceCandidate(event.candidate);
        }
    };

    // Set remote offer as local description for remote connection
    remoteConnection.setRemoteDescription(offer)
        .then(() => remoteConnection.createAnswer())
        .then(answer => remoteConnection.setLocalDescription(answer))
        .then(() => {
            console.log('Answer created:', remoteConnection.localDescription);
            peerConnection.setRemoteDescription(remoteConnection.localDescription);
        });
}

// Function to send a message
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value;

    if (!connectionStatus) {
        alert("The data channel is not open yet.");
        return;
    }

    if (!message) {
        alert("Please enter a message to send.");
        return;
    }

    const chatMessage = `${username}: ${message}`;
    dataChannel.send(chatMessage);
    addMessageToChat(chatMessage, true);
    messageInput.value = '';

    // Store message in localStorage
    localMessages.push(chatMessage);
    localStorage.setItem('messages', JSON.stringify(localMessages));
}

// Function to receive a message
function receiveMessage(event) {
    const chatMessage = event.data;

    // Avoid displaying the same message twice
    if (!localMessages.includes(chatMessage)) {
        addMessageToChat(chatMessage, false);
        localMessages.push(chatMessage);
        localStorage.setItem('messages', JSON.stringify(localMessages));
    }
}

// Function to add a message to the chat UI
function addMessageToChat(message, isLocal) {
    const messageElem = document.createElement('div');
    if (isLocal) {
        messageElem.style.fontWeight = 'bold'; // Style local messages differently
    }
    messageElem.textContent = message;
    messagesDiv.appendChild(messageElem);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Function to load messages from localStorage
function loadMessagesFromLocalStorage() {
    const storedMessages = JSON.parse(localStorage.getItem('messages')) || [];
    localMessages = storedMessages;

    storedMessages.forEach(msg => addMessageToChat(msg, false));
}

// Function to logout and clear stored data
function logout() {
    localStorage.removeItem('username');
    localStorage.removeItem('messages');
    location.reload();
}

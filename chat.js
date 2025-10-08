class QuantumChat {
    constructor() {
        this.chats = new Map();
        this.currentChat = null;
        this.stickers = [];
        this.init();
    }

    init() {
        this.loadChats();
        this.loadStickers();
        this.setupEventListeners();
        this.renderChatsList();
    }

    loadChats() {
        const savedChats = QuantumUtils.loadFromStorage('quantum_chats');
        if (savedChats) {
            this.chats = new Map(savedChats);
        } else {
            // Load initial chats from quantum.json
            this.loadInitialChats();
        }
    }

    async loadInitialChats() {
        try {
            const response = await fetch('data/quantum.json');
            const data = await response.json();
            
            data.chats.forEach(chat => {
                this.chats.set(chat.id, chat);
            });
            
            QuantumUtils.saveToStorage('quantum_chats', Array.from(this.chats.entries()));
            this.renderChatsList();
        } catch (error) {
            console.error('Failed to load initial chats:', error);
        }
    }

    async loadStickers() {
        try {
            const response = await fetch('https://api.telegram.org/bot
                                             sendMessage(text) {
        if (!this.currentChat || !quantumAuth.currentUser) return;

        const message = {
            id: QuantumUtils.generateId(),
            text: text,
            sender: quantumAuth.currentUser.username,
            timestamp: new Date().toISOString(),
            type: 'text'
        };

        // Add message to chat
        if (!this.currentChat.messages) {
            this.currentChat.messages = [];
        }
        this.currentChat.messages.push(message);

        // Update last message
        this.currentChat.lastMessage = message;

        // Save to storage
        QuantumUtils.saveToStorage('quantum_chats', Array.from(this.chats.entries()));

        // Re-render chat
        this.renderChat(this.currentChat);
    }

    renderChat(chat) {
        const messagesContainer = document.getElementById('messagesContainer');
        const chatHeader = document.querySelector('.chat-header');

        if (!messagesContainer || !chatHeader) return;

        // Update chat header
        const otherUser = chat.participants.find(p => p !== quantumAuth.currentUser?.username);
        const user = quantumAuth.getUserByUsername(otherUser);

        if (user) {
            chatHeader.querySelector('.user-avatar').src = user.avatar;
            chatHeader.querySelector('.username').textContent = user.displayName;
            chatHeader.querySelector('.user-status').textContent = user.isOnline ? 'online' : 'last seen ' + QuantumUtils.formatTime(user.lastSeen);
        }

        // Render messages
        if (chat.messages && chat.messages.length > 0) {
            messagesContainer.innerHTML = chat.messages.map(message => `
                <div class="message ${message.sender === quantumAuth.currentUser.username ? 'outgoing' : 'incoming'}">
                    <div class="message-text">${QuantumUtils.escapeHtml(message.text)}</div>
                    <div class="message-time">${QuantumUtils.formatTime(message.timestamp)}</div>
                </div>
            `).join('');
        } else {
            messagesContainer.innerHTML = `
                <div class="empty-state">
                    <i class="ti ti-message-circle"></i>
                    <h3>No messages yet</h3>
                    <p>Send a message to start the conversation!</p>
                </div>
            `;
        }

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Initialize chat system
const quantumChat = new QuantumChat();

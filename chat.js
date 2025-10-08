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

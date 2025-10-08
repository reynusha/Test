class QuantumApp {
    constructor() {
        this.currentTab = 'home-tab';
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupEventListeners();
        this.loadInitialData();
        this.setupTheme();
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        
        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const targetTab = button.getAttribute('data-tab');
                this.switchTab(targetTab, button);
            });
        });
    }

    switchTab(tabId, button) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Remove active class from all nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show target tab and activate button
        const targetTab = document.getElementById(tabId);
        if (targetTab) {
            targetTab.classList.add('active');
            button.classList.add('active');
            this.currentTab = tabId;

            // Load tab-specific content
            this.loadTabContent(tabId);
        }
    }

    loadTabContent(tabId) {
        switch(tabId) {
            case 'home-tab':
                this.loadHomeFeed();
                break;
            case 'chats-tab':
                this.loadChats();
                break;
            case 'profile-tab':
                this.loadProfile();
                break;
            case 'settings-tab':
                // Settings are already loaded from auth
                break;
        }
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Post creation
        document.getElementById('publishPost').addEventListener('click', () => {
            this.createPost();
        });

        // Profile saving
        document.getElementById('saveProfile').addEventListener('click', () => {
            this.saveProfile();
        });

        // Username change modal
        document.getElementById('editUsername').addEventListener('focus', () => {
            this.showNFTModal();
        });

        // Modal close
        document.querySelector('.close-modal').addEventListener('click', () => {
            this.hideNFTModal();
        });

        document.getElementById('confirmUsernameChange').addEventListener('click', () => {
            this.hideNFTModal();
        });

        // Chat search
        document.getElementById('chatSearch').addEventListener('input', 
            QuantumUtils.debounce((e) => this.searchUsers(e.target.value), 300)
        );

        // Message sending
        document.getElementById('sendMessage').addEventListener('click', () => {
            this.sendMessage();
        });

        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Stickers
        document.getElementById('showStickers').addEventListener('click', () => {
            this.toggleStickers();
        });
    }

    async loadInitialData() {
        // Wait for auth to initialize
        setTimeout(() => {
            this.loadHomeFeed();
            this.loadChats();
            this.loadProfile();
        }, 100);
    }

    loadHomeFeed() {
        const postsContainer = document.getElementById('postsContainer');
        if (!postsContainer) return;

        // Get posts from storage or initial data
        const posts = QuantumUtils.loadFromStorage('quantum_posts') || [];
        
        if (posts.length === 0) {
            postsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="ti ti-news"></i>
                    <h3>No posts yet</h3>
                    <p>Be the first to share something!</p>
                </div>
            `;
            return;
        }

        postsContainer.innerHTML = posts.map(post => `
            <div class="post" data-post-id="${post.id}">
                <div class="post-header">
                    <img src="${post.authorAvatar || 'https://via.placeholder.com/150/0088cc/ffffff?text=Q'}" 
                         alt="${post.authorName}" class="user-avatar sm">
                    <div class="post-user-info">
                        <span class="post-username">${post.authorName}</span>
                        <div class="post-time">${QuantumUtils.formatTime(post.timestamp)}</div>
                    </div>
                </div>
                <div class="post-content">
                    ${QuantumUtils.escapeHtml(post.content)}
                </div>
                <div class="post-actions">
                    <div class="post-action ${post.likes.includes(quantumAuth.currentUser?.username) ? 'active' : ''}" 
                         onclick="quantumApp.likePost('${post.id}')">
                        <i class="ti ti-heart"></i>
                        <span>${post.likes.length}</span>
                    </div>
                    <div class="post-action" onclick="quantumApp.toggleComments('${post.id}')">
                        <i class="ti ti-message-circle"></i>
                        <span>${post.comments.length}</span>
                    </div>
                </div>
                <div class="post-comments" id="comments-${post.id}" style="display: none;">
                    ${post.comments.map(comment => `
                        <div class="comment">
                            <strong>${comment.authorName}</strong>
                            <span>${comment.content}</span>
                            <small>${QuantumUtils.formatTime(comment.timestamp)}</small>
                        </div>
                    `).join('')}
                    <div class="comment-input">
                        <input type="text" placeholder="Write a comment..." id="comment-input-${post.id}">
                        <button onclick="quantumApp.addComment('${post.id}')">Post</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    loadChats() {
        const chatsList = document.getElementById('chatsList');
        if (!chatsList) return;

        const chats = Array.from(quantumChat.chats.values());
        
        if (chats.length === 0) {
            chatsList.innerHTML = `
                <div class="empty-state">
                    <i class="ti ti-message-circle"></i>
                    <h3>No chats yet</h3>
                    <p>Start a conversation by searching for users!</p>
                </div>
            `;
            return;
        }

        chatsList.innerHTML = chats.map(chat => {
            const otherUser = chat.participants.find(p => p !== quantumAuth.currentUser?.username);
            const user = quantumAuth.getUserByUsername(otherUser);
            
            return `
                <div class="chat-item" data-chat-id="${chat.id}" onclick="quantumApp.selectChat('${chat.id}')">
                    <img src="${user?.avatar || 'https://via.placeholder.com/150/0088cc/ffffff?text=Q'}" 
                         alt="${user?.displayName}" class="user-avatar sm">
                    <div class="chat-info">
                        <div class="chat-name">${user?.displayName || otherUser}</div>
                        <div class="chat-preview">${chat.lastMessage?.text || 'No messages'}</div>
                    </div>
                    <div class="chat-time">${chat.lastMessage ? QuantumUtils.formatTime(chat.lastMessage.timestamp) : ''}</div>
                </div>
            `;
        }).join('');
    }

    loadProfile() {
        if (!quantumAuth.currentUser) return;

        const userPostsContainer = document.getElementById('userPosts');
        const postsCountElement = document.getElementById('postsCount');

        if (userPostsContainer) {
            const userPosts = QuantumUtils.loadFromStorage('quantum_posts') || [];
            const currentUserPosts = userPosts.filter(post => post.author === quantumAuth.currentUser.username);

            if (postsCountElement) {
                postsCountElement.textContent = currentUserPosts.length;
            }

            if (currentUserPosts.length === 0) {
                userPostsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="ti ti-news"></i>
                        <h3>No posts yet</h3>
                        <p>Share your first post!</p>
                    </div>
                `;
            } else {
                userPostsContainer.innerHTML = currentUserPosts.map(post => `
                    <div class="post">
                        <div class="post-content">${QuantumUtils.escapeHtml(post.content)}</div>
                        <div class="post-actions">
                            <span class="post-time">${QuantumUtils.formatTime(post.timestamp)}</span>
                            <button class="icon-btn" onclick="quantumApp.deletePost('${post.id}')">
                                <i class="ti ti-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        }
    }

    createPost() {
        const textarea = document.getElementById('postTextarea');
        const content = textarea.value.trim();

        if (!content) {
            QuantumUtils.showNotification('Please write something to post', 'error');
            return;
        }

        if (!quantumAuth.currentUser) {
            QuantumUtils.showNotification('Please log in to post', 'error');
            return;
        }

        const newPost = {
            id: QuantumUtils.generateId(),
            author: quantumAuth.currentUser.username,
            authorName: quantumAuth.currentUser.displayName,
            authorAvatar: quantumAuth.currentUser.avatar,
            content: content,
            timestamp: new Date().toISOString(),
            likes: [],
            comments: []
        };

        // Save to storage
        const posts = QuantumUtils.loadFromStorage('quantum_posts') || [];
        posts.unshift(newPost);
        QuantumUtils.saveToStorage('quantum_posts', posts);

        // Clear input and reload feed
        textarea.value = '';
        this.loadHomeFeed();
        this.loadProfile();

        QuantumUtils.showNotification('Post published successfully!', 'success');
    }

    likePost(postId) {
        const posts = QuantumUtils.loadFromStorage('quantum_posts') || [];
        const postIndex = posts.findIndex(p => p.id === postId);
        
        if (postIndex === -1 || !quantumAuth.currentUser) return;

        const post = posts[postIndex];
        const userIndex = post.likes.indexOf(quantumAuth.currentUser.username);

        if (userIndex === -1) {
            post.likes.push(quantumAuth.currentUser.username);
        } else {
            post.likes.splice(userIndex, 1);
        }

        QuantumUtils.saveToStorage('quantum_posts', posts);
        this.loadHomeFeed();
    }

    addComment(postId) {
        const input = document.getElementById(`comment-input-${postId}`);
        const content = input.value.trim();

        if (!content || !quantumAuth.currentUser) return;

        const posts = QuantumUtils.loadFromStorage('quantum_posts') || [];
        const postIndex = posts.findIndex(p => p.id === postId);
        
        if (postIndex === -1) return;

        const newComment = {
            id: QuantumUtils.generateId(),
            author: quantumAuth.currentUser.username,
            authorName: quantumAuth.currentUser.displayName,
            content: content,
            timestamp: new Date().toISOString()
        };

        posts[postIndex].comments.push(newComment);
        QuantumUtils.saveToStorage('quantum_posts', posts);

        input.value = '';
        this.loadHomeFeed();
    }

    deletePost(postId) {
        const posts = QuantumUtils.loadFromStorage('quantum_posts') || [];
        const updatedPosts = posts.filter(p => p.id !== postId);
        
        QuantumUtils.saveToStorage('quantum_posts', updatedPosts);
        this.loadHomeFeed();
        this.loadProfile();
        
        QuantumUtils.showNotification('Post deleted', 'success');
    }

    searchUsers(query) {
        const results = quantumAuth.searchUsers(query);
        // Update chats list with search results
        this.loadChats(); // This would need to be enhanced for actual search results
    }

    selectChat(chatId) {
        const chat = quantumChat.chats.get(chatId);
        if (!chat) return;

        quantumChat.currentChat = chat;
        quantumChat.renderChat(chat);
    }

    sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();

        if (!message || !quantumChat.currentChat) return;

        quantumChat.sendMessage(message);
        input.value = '';
    }

    toggleStickers() {
        const panel = document.getElementById('stickersPanel');
        panel.classList.toggle('active');
    }

    saveProfile() {
        const updatedData = {
            avatar: document.getElementById('editAvatar').value.trim(),
            displayName: document.getElementById('editDisplayName').value.trim(),
            username: document.getElementById('editUsername').value.trim(),
            bio: document.getElementById('editBio').value.trim()
        };

        // Validate required fields
        if (!updatedData.displayName || !updatedData.username) {
            QuantumUtils.showNotification('Display name and username are required', 'error');
            return;
        }

        if (!QuantumUtils.validateUsername(updatedData.username)) {
            QuantumUtils.showNotification('Username must start with @ and contain 3-20 letters, numbers, or underscores', 'error');
            return;
        }

        if (quantumAuth.updateProfile(updatedData)) {
            this.loadProfile();
        }
    }

    showNFTModal() {
        document.getElementById('nftModal').classList.add('active');
    }

    hideNFTModal() {
        document.getElementById('nftModal').classList.remove('active');
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('quantum_theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('quantum_theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const icon = document.querySelector('#themeToggle i');
        if (icon) {
            icon.className = theme === 'light' ? 'ti ti-moon' : 'ti ti-sun';
        }
    }
}

// Initialize the app
const quantumApp = new QuantumApp();

class QuantumAuth {
    constructor() {
        this.currentUser = null;
        this.users = new Map();
        this.init();
    }

    init() {
        this.loadUsers();
        this.setupAuthListeners();
    }

    loadUsers() {
        const savedUsers = QuantumUtils.loadFromStorage('quantum_users');
        if (savedUsers) {
            this.users = new Map(savedUsers);
        } else {
            // Load from quantum.json
            this.loadInitialData();
        }
        
        const currentUserData = QuantumUtils.loadFromStorage('quantum_current_user');
        if (currentUserData) {
            this.currentUser = currentUserData;
            this.updateUI();
        }
    }

    async loadInitialData() {
        try {
            const response = await fetch('data/quantum.json');
            const data = await response.json();
            
            data.users.forEach(user => {
                this.users.set(user.username, user);
            });
            
            QuantumUtils.saveToStorage('quantum_users', Array.from(this.users.entries()));
            
            // Set first user as current for demo
            if (data.users.length > 0 && !this.currentUser) {
                this.currentUser = data.users[0];
                QuantumUtils.saveToStorage('quantum_current_user', this.currentUser);
                this.updateUI();
            }
        } catch (error) {
            console.error('Failed to load initial data:', error);
            QuantumUtils.showNotification('Failed to load initial data', 'error');
        }
    }

    setupAuthListeners() {
        // Telegram Mini Apps integration simulation
        if (window.Telegram && window.Telegram.WebApp) {
            this.initTelegramAuth();
        } else {
            this.initDefaultAuth();
        }
    }

    initTelegramAuth() {
        const webApp = window.Telegram.WebApp;
        const user = webApp.initDataUnsafe.user;
        
        if (user) {
            const telegramUser = {
                id: user.id,
                username: `@${user.username}`,
                displayName: `${user.first_name} ${user.last_name || ''}`.trim(),
                avatar: user.photo_url,
                bio: '',
                isVerified: user.username === 'clanffys',
                role: user.username === 'clanffys' ? 'Project Creator' : 'User'
            };
            
            this.login(telegramUser);
        }
    }

    initDefaultAuth() {
        // For demo purposes, auto-login the first user
        if (!this.currentUser && this.users.size > 0) {
            const firstUser = this.users.values().next().value;
            this.login(firstUser);
        }
    }

    login(userData) {
        this.currentUser = userData;
        QuantumUtils.saveToStorage('quantum_current_user', this.currentUser);
        
        // Add to users map if not exists
        if (!this.users.has(userData.username)) {
            this.users.set(userData.username, userData);
            QuantumUtils.saveToStorage('quantum_users', Array.from(this.users.entries()));
        }
        
        this.updateUI();
        QuantumUtils.showNotification(`Welcome back, ${userData.displayName}!`, 'success');
    }

    updateUI() {
        if (!this.currentUser) return;

        // Update profile elements
        const elements = {
            profileAvatar: this.currentUser.avatar,
            profileDisplayName: this.currentUser.displayName,
            profileUsername: this.currentUser.username,
            profileBio: this.currentUser.bio || 'No bio yet',
            composeAvatar: this.currentUser.avatar,
            verificationBadge: this.currentUser.isVerified
        };

        for (const [id, value] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (!element) continue;

            if (id === 'verificationBadge') {
                if (value) {
                    element.classList.add('verified');
                    if (this.currentUser.role === 'Project Creator') {
                        element.setAttribute('title', 'Project Creator');
                    }
                } else {
                    element.classList.remove('verified');
                }
            } else if (id.includes('Avatar')) {
                element.src = value || 'https://via.placeholder.com/150/0088cc/ffffff?text=Q';
                element.alt = `${this.currentUser.displayName}'s avatar`;
            } else {
                element.textContent = value;
            }
        }

        // Update settings form
        this.populateSettingsForm();
    }

    populateSettingsForm() {
        if (!this.currentUser) return;

        document.getElementById('editAvatar').value = this.currentUser.avatar || '';
        document.getElementById('editDisplayName').value = this.currentUser.displayName;
        document.getElementById('editUsername').value = this.currentUser.username;
        document.getElementById('editBio').value = this.currentUser.bio || '';
    }

    updateProfile(updatedData) {
        if (!this.currentUser) return false;

        const oldUsername = this.currentUser.username;
        
        // Check username uniqueness
        if (updatedData.username !== oldUsername && this.users.has(updatedData.username)) {
            QuantumUtils.showNotification('Username already taken', 'error');
            return false;
        }

        // Update user data
        Object.assign(this.currentUser, updatedData);
        
        // Update users map
        this.users.delete(oldUsername);
        this.users.set(updatedData.username, this.currentUser);
        
        // Save to storage
        QuantumUtils.saveToStorage('quantum_current_user', this.currentUser);
        QuantumUtils.saveToStorage('quantum_users', Array.from(this.users.entries()));
        
        this.updateUI();
        QuantumUtils.showNotification('Profile updated successfully', 'success');
        
        return true;
    }

    getUserByUsername(username) {
        return this.users.get(username);
    }

    getAllUsers() {
        return Array.from(this.users.values());
    }

    searchUsers(query) {
        if (!query) return this.getAllUsers();
        
        return this.getAllUsers().filter(user => 
            user.username.toLowerCase().includes(query.toLowerCase()) ||
            user.displayName.toLowerCase().includes(query.toLowerCase())
        );
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('quantum_current_user');
        QuantumUtils.showNotification('Logged out successfully', 'info');
        // In a real app, you'd redirect to login page
    }
}

// Initialize auth system
const quantumAuth = new QuantumAuth();

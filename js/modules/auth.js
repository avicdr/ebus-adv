// Authentication module
const AuthModule = {
    currentUser: null,
    
    /**
     * Initialize authentication state listener
     */
    init() {
        if (typeof firebase === 'undefined') {
            console.error('Firebase not initialized');
            return;
        }
        
        // For demo purposes, we'll simulate Firebase auth
        this.currentUser = Storage.get('currentUser');
        
        return Promise.resolve(this.currentUser);
    },
    
    /**
     * Register a new user
     */
    async registerUser(userData) {
        try {
            // Validate input
            if (!userData.email || !userData.password || !userData.fullName) {
                throw new Error('Please fill all required fields');
            }
            
            if (!isValidEmail(userData.email)) {
                throw new Error('Please enter a valid email address');
            }
            
            if (userData.password.length < 6) {
                throw new Error('Password must be at least 6 characters long');
            }
            
            // For demo purposes, simulate user creation
            const userId = generateId();
            const user = {
                uid: userId,
                email: userData.email,
                emailVerified: true
            };
            
            // Save user data
            const userProfile = {
                id: userId,
                fullName: userData.fullName,
                email: userData.email,
                phone: userData.phone,
                role: userData.role || 'user',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            };
            
            // Store in localStorage for demo
            const users = Storage.get('users') || {};
            users[userId] = userProfile;
            Storage.set('users', users);
            
            // Set current user
            this.currentUser = user;
            Storage.set('currentUser', user);
            
            // Log activity
            this.logActivity('user_registered', `New user registered: ${userData.fullName}`);
            
            return user;
            
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    },
    
    /**
     * Login user
     */
    async loginUser(email, password) {
        try {
            if (!email || !password) {
                throw new Error('Please enter email and password');
            }
            
            // For demo purposes, simulate login
            const users = Storage.get('users') || {};
            const user = Object.values(users).find(u => u.email === email);
            
            if (!user) {
                throw new Error('User not found');
            }
            
            // Create auth user object
            const authUser = {
                uid: user.id,
                email: user.email,
                emailVerified: true
            };
            
            // Update last login
            user.lastLogin = new Date().toISOString();
            users[user.id] = user;
            Storage.set('users', users);
            
            // Set current user
            this.currentUser = authUser;
            Storage.set('currentUser', authUser);
            
            return authUser;
            
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },
    
    /**
     * Logout user
     */
    logout() {
        this.currentUser = null;
        Storage.remove('currentUser');
        return Promise.resolve();
    },
    
    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser || Storage.get('currentUser');
    },
    
    /**
     * Get user role and data
     */
    async getUserRole(userId) {
        try {
            const users = Storage.get('users') || {};
            return users[userId] || null;
        } catch (error) {
            console.error('Error getting user role:', error);
            return null;
        }
    },
    
    /**
     * Create user profile
     */
    async createUserProfile(userId, profileData) {
        try {
            const users = Storage.get('users') || {};
            users[userId] = {
                id: userId,
                ...profileData,
                createdAt: profileData.createdAt || new Date().toISOString()
            };
            Storage.set('users', users);
            
            return users[userId];
        } catch (error) {
            console.error('Error creating user profile:', error);
            throw error;
        }
    },
    
    /**
     * Update user profile
     */
    async updateUserProfile(userId, updateData) {
        try {
            const users = Storage.get('users') || {};
            if (users[userId]) {
                users[userId] = { ...users[userId], ...updateData };
                Storage.set('users', users);
                return users[userId];
            }
            throw new Error('User not found');
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    },
    
    /**
     * Log activity
     */
    logActivity(type, description) {
        try {
            const activities = Storage.get('activities') || [];
            activities.unshift({
                id: generateId(),
                type,
                description,
                timestamp: new Date().toISOString(),
                userId: this.currentUser?.uid
            });
            
            // Keep only last 50 activities
            Storage.set('activities', activities.slice(0, 50));
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    }
};

// Initialize auth module
document.addEventListener('DOMContentLoaded', function() {
    AuthModule.init();
});

// Make AuthModule available globally
window.AuthModule = AuthModule;
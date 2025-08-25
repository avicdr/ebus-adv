// Admin module for administrative functionality
const AdminModule = {
    
    /**
     * Get overview statistics
     */
    async getOverviewStats() {
        try {
            const users = Storage.get('users') || {};
            const buses = Storage.get('buses') || {};
            const bookings = Storage.get('bookings') || {};
            
            const allUsers = Object.values(users);
            const allBuses = Object.values(buses).filter(bus => bus.isActive);
            
            const stats = {
                totalUsers: allUsers.filter(user => user.role === 'user').length,
                totalDrivers: allUsers.filter(user => user.role === 'driver').length,
                totalBuses: allBuses.length,
                totalBookings: Object.keys(bookings).length,
                totalRevenue: Object.values(bookings).reduce((sum, booking) => {
                    const bus = allBuses.find(b => b.id === booking.busId);
                    return sum + (bus ? bus.fare : 0);
                }, 0)
            };
            
            return stats;
            
        } catch (error) {
            console.error('Error getting overview stats:', error);
            throw error;
        }
    },
    
    /**
     * Get recent activities
     */
    async getRecentActivities(limit = 10) {
        try {
            const activities = Storage.get('activities') || [];
            return activities.slice(0, limit);
        } catch (error) {
            console.error('Error getting recent activities:', error);
            throw error;
        }
    },
    
    /**
     * Get all drivers
     */
    async getAllDrivers() {
        try {
            const users = Storage.get('users') || {};
            const drivers = Object.values(users).filter(user => user.role === 'driver');
            
            return drivers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
        } catch (error) {
            console.error('Error getting all drivers:', error);
            throw error;
        }
    },
    
    /**
     * Get all users
     */
    async getAllUsers() {
        try {
            const users = Storage.get('users') || {};
            const regularUsers = Object.values(users).filter(user => user.role === 'user');
            
            return regularUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
        } catch (error) {
            console.error('Error getting all users:', error);
            throw error;
        }
    },
    
    /**
     * Get all buses
     */
    async getAllBuses() {
        try {
            const buses = Storage.get('buses') || {};
            const activeBuses = Object.values(buses).filter(bus => bus.isActive);
            
            return activeBuses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
        } catch (error) {
            console.error('Error getting all buses:', error);
            throw error;
        }
    },
    
    /**
     * Create driver account
     */
    async createDriver(driverData) {
        try {
            // Validate required fields
            const requiredFields = ['fullName', 'email', 'password', 'phone'];
            for (const field of requiredFields) {
                if (!driverData[field]) {
                    throw new Error(`${field} is required`);
                }
            }
            
            if (!isValidEmail(driverData.email)) {
                throw new Error('Please enter a valid email address');
            }
            
            if (driverData.password.length < 6) {
                throw new Error('Password must be at least 6 characters long');
            }
            
            // Check if email already exists
            const users = Storage.get('users') || {};
            const existingUser = Object.values(users).find(user => user.email === driverData.email);
            if (existingUser) {
                throw new Error('Email already exists');
            }
            
            // Create driver profile
            const driverId = generateId();
            const driver = {
                id: driverId,
                ...driverData,
                role: 'driver',
                isActive: true,
                createdAt: new Date().toISOString(),
                createdBy: AuthModule.getCurrentUser()?.uid
            };
            
            delete driver.password; // Don't store password in profile
            
            users[driverId] = driver;
            Storage.set('users', users);
            
            AuthModule.logActivity('driver_created', `New driver created: ${driverData.fullName}`);
            
            return driver;
            
        } catch (error) {
            console.error('Error creating driver:', error);
            throw error;
        }
    },
    
    /**
     * Update driver information
     */
    async updateDriver(driverId, updateData) {
        try {
            const users = Storage.get('users') || {};
            const driver = users[driverId];
            
            if (!driver || driver.role !== 'driver') {
                throw new Error('Driver not found');
            }
            
            users[driverId] = {
                ...driver,
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            Storage.set('users', users);
            
            AuthModule.logActivity('driver_updated', `Driver updated: ${driver.fullName}`);
            
            return users[driverId];
            
        } catch (error) {
            console.error('Error updating driver:', error);
            throw error;
        }
    },
    
    /**
     * Delete driver account
     */
    async deleteDriver(driverId) {
        try {
            const users = Storage.get('users') || {};
            const driver = users[driverId];
            
            if (!driver || driver.role !== 'driver') {
                throw new Error('Driver not found');
            }
            
            // Soft delete - mark as inactive
            users[driverId] = {
                ...driver,
                isActive: false,
                deletedAt: new Date().toISOString(),
                deletedBy: AuthModule.getCurrentUser()?.uid
            };
            Storage.set('users', users);
            
            // Also deactivate all buses owned by this driver
            const buses = Storage.get('buses') || {};
            Object.keys(buses).forEach(busId => {
                if (buses[busId].driverId === driverId) {
                    buses[busId].isActive = false;
                    buses[busId].deletedAt = new Date().toISOString();
                }
            });
            Storage.set('buses', buses);
            
            AuthModule.logActivity('driver_deleted', `Driver deleted: ${driver.fullName}`);
            
            return true;
            
        } catch (error) {
            console.error('Error deleting driver:', error);
            throw error;
        }
    },
    
    /**
     * Get system analytics
     */
    async getSystemAnalytics() {
        try {
            const users = Storage.get('users') || {};
            const buses = Storage.get('buses') || {};
            const bookings = Storage.get('bookings') || {};
            const activities = Storage.get('activities') || [];
            
            const allUsers = Object.values(users);
            const allBuses = Object.values(buses);
            const allBookings = Object.values(bookings);
            
            // User growth over time
            const userGrowth = this.calculateGrowthData(allUsers);
            
            // Bus types distribution
            const busTypeDistribution = allBuses.reduce((acc, bus) => {
                if (bus.isActive) {
                    acc[bus.busType] = (acc[bus.busType] || 0) + 1;
                }
                return acc;
            }, {});
            
            // Revenue over time
            const revenueData = this.calculateRevenueData(allBookings, allBuses);
            
            // Top routes
            const topRoutes = this.calculateTopRoutes(allBuses);
            
            return {
                userGrowth,
                busTypeDistribution,
                revenueData,
                topRoutes,
                totalRevenue: revenueData.reduce((sum, item) => sum + item.revenue, 0),
                activeUsers: allUsers.filter(user => user.role === 'user' && user.isActive !== false).length,
                activeDrivers: allUsers.filter(user => user.role === 'driver' && user.isActive !== false).length,
                activeBuses: allBuses.filter(bus => bus.isActive).length
            };
            
        } catch (error) {
            console.error('Error getting system analytics:', error);
            throw error;
        }
    },
    
    /**
     * Calculate growth data
     */
    calculateGrowthData(users) {
        const monthlyData = {};
        
        users.forEach(user => {
            if (user.createdAt) {
                const month = new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
                monthlyData[month] = (monthlyData[month] || 0) + 1;
            }
        });
        
        return Object.entries(monthlyData).map(([month, count]) => ({
            month,
            users: count
        }));
    },
    
    /**
     * Calculate revenue data
     */
    calculateRevenueData(bookings, buses) {
        const monthlyRevenue = {};
        
        bookings.forEach(booking => {
            if (booking.bookingDate && booking.status !== 'cancelled') {
                const month = new Date(booking.bookingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
                const bus = buses.find(b => b.id === booking.busId);
                const fare = bus ? bus.fare : 0;
                monthlyRevenue[month] = (monthlyRevenue[month] || 0) + fare;
            }
        });
        
        return Object.entries(monthlyRevenue).map(([month, revenue]) => ({
            month,
            revenue
        }));
    },
    
    /**
     * Calculate top routes
     */
    calculateTopRoutes(buses) {
        const routeCounts = {};
        
        buses.forEach(bus => {
            if (bus.isActive && bus.route) {
                routeCounts[bus.route] = (routeCounts[bus.route] || 0) + 1;
            }
        });
        
        return Object.entries(routeCounts)
            .map(([route, count]) => ({ route, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    },
    
    /**
     * Generate system report
     */
    async generateSystemReport() {
        try {
            const stats = await this.getOverviewStats();
            const analytics = await this.getSystemAnalytics();
            const activities = await this.getRecentActivities(20);
            
            const report = {
                generatedAt: new Date().toISOString(),
                summary: stats,
                analytics: analytics,
                recentActivities: activities
            };
            
            AuthModule.logActivity('report_generated', 'System report generated');
            
            return report;
            
        } catch (error) {
            console.error('Error generating system report:', error);
            throw error;
        }
    }
};

// Make AdminModule available globally
window.AdminModule = AdminModule;
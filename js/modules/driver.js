// Driver module for driver-specific functionality
const DriverModule = {
    
    /**
     * Get driver profile
     */
    async getDriverProfile(driverId) {
        try {
            const users = Storage.get('users') || {};
            const driver = users[driverId];
            
            if (!driver || driver.role !== 'driver') {
                throw new Error('Driver profile not found');
            }
            
            return driver;
        } catch (error) {
            console.error('Error getting driver profile:', error);
            throw error;
        }
    },
    
    /**
     * Update driver profile
     */
    async updateProfile(updateData) {
        try {
            const currentUser = AuthModule.getCurrentUser();
            if (!currentUser) {
                throw new Error('Driver not authenticated');
            }
            
            const users = Storage.get('users') || {};
            if (users[currentUser.uid] && users[currentUser.uid].role === 'driver') {
                users[currentUser.uid] = { ...users[currentUser.uid], ...updateData };
                Storage.set('users', users);
                
                AuthModule.logActivity('driver_profile_updated', 'Driver profile updated');
                return users[currentUser.uid];
            }
            throw new Error('Driver profile not found');
        } catch (error) {
            console.error('Error updating driver profile:', error);
            throw error;
        }
    },
    
    /**
     * Add a new bus
     */
    async addBus(busData) {
        try {
            const currentUser = AuthModule.getCurrentUser();
            if (!currentUser) {
                throw new Error('Driver not authenticated');
            }
            
            // Validate required fields
            const requiredFields = ['busNumber', 'operatorName', 'busType', 'capacity', 'route', 'fare', 'departureTime', 'arrivalTime', 'contactNumber'];
            for (const field of requiredFields) {
                if (!busData[field]) {
                    throw new Error(`${field} is required`);
                }
            }
            
            const busId = generateId();
            const bus = {
                id: busId,
                driverId: currentUser.uid,
                ...busData,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            const buses = Storage.get('buses') || {};
            buses[busId] = bus;
            Storage.set('buses', buses);
            
            AuthModule.logActivity('bus_added', `New bus added: ${busData.busNumber}`);
            
            return bus;
            
        } catch (error) {
            console.error('Error adding bus:', error);
            throw error;
        }
    },
    
    /**
     * Get buses owned by current driver
     */
    async getDriverBuses() {
        try {
            const currentUser = AuthModule.getCurrentUser();
            if (!currentUser) {
                throw new Error('Driver not authenticated');
            }
            
            const allBuses = Storage.get('buses') || {};
            const driverBuses = Object.values(allBuses).filter(
                bus => bus.driverId === currentUser.uid && bus.isActive
            );
            
            return driverBuses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
        } catch (error) {
            console.error('Error getting driver buses:', error);
            throw error;
        }
    },
    
    /**
     * Update bus information
     */
    async updateBus(busId, updateData) {
        try {
            const currentUser = AuthModule.getCurrentUser();
            if (!currentUser) {
                throw new Error('Driver not authenticated');
            }
            
            const buses = Storage.get('buses') || {};
            const bus = buses[busId];
            
            if (!bus || bus.driverId !== currentUser.uid) {
                throw new Error('Bus not found or access denied');
            }
            
            buses[busId] = {
                ...bus,
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            Storage.set('buses', buses);
            
            AuthModule.logActivity('bus_updated', `Bus updated: ${bus.busNumber}`);
            
            return buses[busId];
            
        } catch (error) {
            console.error('Error updating bus:', error);
            throw error;
        }
    },
    
    /**
     * Delete bus
     */
    async deleteBus(busId) {
        try {
            const currentUser = AuthModule.getCurrentUser();
            if (!currentUser) {
                throw new Error('Driver not authenticated');
            }
            
            const buses = Storage.get('buses') || {};
            const bus = buses[busId];
            
            if (!bus || bus.driverId !== currentUser.uid) {
                throw new Error('Bus not found or access denied');
            }
            
            // Soft delete - mark as inactive
            buses[busId] = {
                ...bus,
                isActive: false,
                deletedAt: new Date().toISOString()
            };
            Storage.set('buses', buses);
            
            AuthModule.logActivity('bus_deleted', `Bus deleted: ${bus.busNumber}`);
            
            return true;
            
        } catch (error) {
            console.error('Error deleting bus:', error);
            throw error;
        }
    },
    
    /**
     * Update bus location
     */
    async updateBusLocation(busId, locationData) {
        try {
            const currentUser = AuthModule.getCurrentUser();
            if (!currentUser) {
                throw new Error('Driver not authenticated');
            }
            
            const buses = Storage.get('buses') || {};
            const bus = buses[busId];
            
            if (!bus || bus.driverId !== currentUser.uid) {
                throw new Error('Bus not found or access denied');
            }
            
            // Validate location data
            if (!locationData.latitude || !locationData.longitude) {
                throw new Error('Invalid location coordinates');
            }
            
            const locations = Storage.get('busLocations') || {};
            locations[busId] = {
                ...locationData,
                busId,
                driverId: currentUser.uid,
                lastUpdated: new Date().toISOString(),
                timestamp: Date.now()
            };
            Storage.set('busLocations', locations);
            
            const updateType = locationData.manual ? 'Manual' : 'Auto';
            AuthModule.logActivity('location_updated', `${updateType} location updated for bus: ${bus.busNumber} at ${locationData.address || 'coordinates provided'}`);
            
            return locations[busId];
            
        } catch (error) {
            console.error('Error updating bus location:', error);
            throw error;
        }
    },
    
    /**
     * Get real-time location updates for a bus
     */
    async getBusLocationUpdates(busId, callback) {
        try {
            const currentUser = AuthModule.getCurrentUser();
            if (!currentUser) {
                throw new Error('Driver not authenticated');
            }
            
            const buses = Storage.get('buses') || {};
            const bus = buses[busId];
            
            if (!bus || bus.driverId !== currentUser.uid) {
                throw new Error('Bus not found or access denied');
            }
            
            // Simulate real-time updates by checking storage periodically
            const checkUpdates = () => {
                const locations = Storage.get('busLocations') || {};
                const location = locations[busId];
                if (location && callback) {
                    callback(location);
                }
            };
            
            return setInterval(checkUpdates, 5000); // Check every 5 seconds
            
        } catch (error) {
            console.error('Error setting up location updates:', error);
            throw error;
        }
    },
    
    /**
     * Get bus location history
     */
    async getBusLocationHistory(busId, limit = 10) {
        try {
            const currentUser = AuthModule.getCurrentUser();
            if (!currentUser) {
                throw new Error('Driver not authenticated');
            }
            
            const buses = Storage.get('buses') || {};
            const bus = buses[busId];
            
            if (!bus || bus.driverId !== currentUser.uid) {
                throw new Error('Bus not found or access denied');
            }
            
            // For now, return current location as history
            const locations = Storage.get('busLocations') || {};
            const currentLocation = locations[busId];
            
            if (currentLocation) {
                // Create a simple history with timestamps
                return [{
                    ...currentLocation,
                    timestamp: currentLocation.timestamp || Date.now()
                }];
            }
            
            return [];
            
        } catch (error) {
            console.error('Error getting bus location history:', error);
            throw error;
        }
    },
    
    /**
     * Get driver statistics
     */
    async getDriverStats() {
        try {
            const currentUser = AuthModule.getCurrentUser();
            if (!currentUser) {
                throw new Error('Driver not authenticated');
            }
            
            const buses = await this.getDriverBuses();
            const bookings = Storage.get('bookings') || {};
            
            // Count bookings for driver's buses
            const driverBookings = Object.values(bookings).filter(booking => 
                buses.some(bus => bus.id === booking.busId)
            );
            
            return {
                totalBuses: buses.length,
                totalBookings: driverBookings.length,
                activeRoutes: new Set(buses.map(bus => bus.route)).size,
                totalRevenue: driverBookings.reduce((sum, booking) => {
                    const bus = buses.find(b => b.id === booking.busId);
                    return sum + (bus ? bus.fare : 0);
                }, 0)
            };
            
        } catch (error) {
            console.error('Error getting driver stats:', error);
            throw error;
        }
    }
};

// Make DriverModule available globally
window.DriverModule = DriverModule;
// User module for user-specific functionality
const UserModule = {
    
    /**
     * Get user data
     */
    async getUserData(userId) {
        try {
            const users = Storage.get('users') || {};
            return users[userId] || null;
        } catch (error) {
            console.error('Error getting user data:', error);
            throw error;
        }
    },
    
    /**
     * Update user profile
     */
    async updateProfile(updateData) {
        try {
            const currentUser = AuthModule.getCurrentUser();
            if (!currentUser) {
                throw new Error('User not authenticated');
            }
            
            const users = Storage.get('users') || {};
            if (users[currentUser.uid]) {
                users[currentUser.uid] = { ...users[currentUser.uid], ...updateData };
                Storage.set('users', users);
                
                AuthModule.logActivity('profile_updated', 'User profile updated');
                return users[currentUser.uid];
            }
            throw new Error('User profile not found');
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    },
    
    /**
     * Search buses based on criteria
     */
    async searchBuses(criteria) {
        try {
            const allBuses = Storage.get('buses') || {};
            const busList = Object.values(allBuses);
            
            let filteredBuses = busList.filter(bus => {
                if (!bus.isActive) return false;
                
                // Check route matches
                const routeLower = bus.route.toLowerCase();
                const fromMatch = !criteria.from || routeLower.includes(criteria.from);
                const toMatch = !criteria.to || routeLower.includes(criteria.to);
                
                // Check bus type
                const typeMatch = !criteria.type || bus.busType === criteria.type;
                
                return fromMatch && toMatch && typeMatch;
            });
            
            // Add some demo buses if none found for better UX
            if (filteredBuses.length === 0 && (criteria.from || criteria.to)) {
                filteredBuses = this.generateDemoBuses(criteria);
            }
            
            return filteredBuses;
            
        } catch (error) {
            console.error('Error searching buses:', error);
            throw error;
        }
    },
    
    /**
     * Generate demo buses for better UX
     */
    generateDemoBuses(criteria) {
        const demoRoutes = [
            {
                from: criteria.from || 'Bangalore',
                to: criteria.to || 'Mysore',
                busNumber: 'KA-05-1234',
                operatorName: 'City Express',
                busType: 'AC',
                capacity: 40,
                fare: 150,
                departureTime: '08:00',
                arrivalTime: '11:30',
                contactNumber: '+91 9876543210'
            },
            {
                from: criteria.from || 'Bangalore', 
                to: criteria.to || 'Mysore',
                busNumber: 'KA-03-5678',
                operatorName: 'Metro Travel',
                busType: 'Volvo',
                capacity: 45,
                fare: 200,
                departureTime: '14:00',
                arrivalTime: '17:30',
                contactNumber: '+91 9876543211'
            }
        ];
        
        return demoRoutes.map((route, index) => ({
            id: `demo-${index}`,
            ...route,
            route: `${route.from} - ${route.to}`,
            isActive: true,
            createdAt: new Date().toISOString()
        }));
    },
    
    /**
     * Get bus location
     */
    async getBusLocation(busId) {
        try {
            const locations = Storage.get('busLocations') || {};
            const location = locations[busId];
            
            // Simulate real-time updates for demo buses
            if (busId.startsWith('demo-')) {
                return this.generateDemoLocation(busId);
            }
            
            if (!location) {
                return this.generateDemoLocation(busId);
            }
            
            return location;
            
        } catch (error) {
            console.error('Error getting bus location:', error);
            throw error;
        }
    },
    
    /**
     * Generate demo location with realistic movement
     */
    generateDemoLocation(busId) {
        const baseLocations = [
            { lat: 12.9716, lng: 77.5946, address: 'Silk Board Junction, Bangalore' },
            { lat: 12.9352, lng: 77.6245, address: 'Koramangala, Bangalore' },
            { lat: 12.9698, lng: 77.7500, address: 'Whitefield, Bangalore' },
            { lat: 12.8406, lng: 77.6602, address: 'Electronic City, Bangalore' },
            { lat: 13.0827, lng: 80.2707, address: 'Chennai Central' },
            { lat: 12.2958, lng: 76.6394, address: 'Mysore Palace' }
        ];
        
        const locationIndex = parseInt(busId.slice(-1)) % baseLocations.length;
        const baseLocation = baseLocations[locationIndex];
        
        // Add slight random movement to simulate real movement
        const randomOffset = () => (Math.random() - 0.5) * 0.01;
        
        return {
            latitude: baseLocation.lat + randomOffset(),
            longitude: baseLocation.lng + randomOffset(),
            address: baseLocation.address,
            lastUpdated: new Date().toISOString(),
            busId: busId
        };
    },
    
    /**
     * Get user bookings
     */
    async getUserBookings() {
        try {
            const currentUser = AuthModule.getCurrentUser();
            if (!currentUser) {
                throw new Error('User not authenticated');
            }
            
            // Validate booking data
            if (!bookingData.busNumber || !bookingData.fare) {
                throw new Error('Invalid booking data');
            }
            
            const allBookings = Storage.get('bookings') || {};
            const userBookings = Object.values(allBookings).filter(
                booking => booking.userId === currentUser.uid
            );
            AuthModule.logActivity('bus_booked', `Bus booked: ${bookingData.busNumber} for ${bookingData.from} to ${bookingData.to}`);
            
            return userBookings.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));
            
        } catch (error) {
            console.error('Error getting user bookings:', error);
            throw error;
        }
    },
    
    /**
     * Cancel booking
     */
    async cancelBooking(bookingId) {
        try {
            const currentUser = AuthModule.getCurrentUser();
            if (!currentUser) {
                throw new Error('User not authenticated');
            }
            
            const bookings = Storage.get('bookings') || {};
            const booking = bookings[bookingId];
            
            if (!booking || booking.userId !== currentUser.uid) {
                throw new Error('Booking not found');
            }
            
            if (booking.status === 'cancelled') {
                throw new Error('Booking is already cancelled');
            }
            
            booking.status = 'cancelled';
            booking.cancelledAt = new Date().toISOString();
            bookings[bookingId] = booking;
            Storage.set('bookings', bookings);
            
            AuthModule.logActivity('booking_cancelled', `Booking cancelled: ${booking.busNumber}`);
            
            return booking;
            
        } catch (error) {
            console.error('Error cancelling booking:', error);
            throw error;
        }
    },
    
    /**
     * Get booking details
     */
    async getBookingDetails(bookingId) {
        try {
            const currentUser = AuthModule.getCurrentUser();
            if (!currentUser) {
                throw new Error('User not authenticated');
            }
            
            const bookings = Storage.get('bookings') || {};
            const booking = bookings[bookingId];
            
            if (!booking || booking.userId !== currentUser.uid) {
                throw new Error('Booking not found');
            }
            
            return booking;
            
        } catch (error) {
            console.error('Error getting booking details:', error);
            throw error;
        }
    }
};

// Make UserModule available globally
window.UserModule = UserModule;
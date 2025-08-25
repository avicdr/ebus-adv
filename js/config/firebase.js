// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBr1X_dEzwjc9LzYGxG4h9R8qXXX_XXXX",
    authDomain: "ebus-management.firebaseapp.com",
    databaseURL: "https://ebus-management-default-rtdb.firebaseio.com",
    projectId: "ebus-management",
    storageBucket: "ebus-management.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdefghijklmnop"
};

// Initialize Firebase
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);

// Make Firebase available globally for backward compatibility
window.firebase = {
    app,
    auth: () => auth,
    database: () => database
};

console.log('Firebase initialized successfully');

// For development/demo purposes - you'll need to replace with your actual Firebase config
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    console.warn('Using demo Firebase configuration. Please replace with your actual Firebase config.');
}
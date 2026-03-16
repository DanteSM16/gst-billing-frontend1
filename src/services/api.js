// src/services/api.js
import axios from 'axios';

// 1. Create a base Axios instance like setting a Base URL 
const api = axios.create({
    baseURL: 'https://gst-billing-djel.onrender.com/api', 
    headers: {
        'Content-Type': 'application/json'
    }
});

// 2. The REQUEST Interceptor (Outgoing)
// Before ANY request leaves React, this checks if we have a Token, and glues it to the Header.
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('jwtToken'); 
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// 3. The RESPONSE Interceptor (Incoming) -- THIS IS THE NEW PART!
// This watches for errors coming BACK from the server (or if the server is dead).
api.interceptors.response.use(
    (response) => {
        // If the request succeeded, just pass the data through normally
        return response;
    }, 
    (error) => {
        // SCENARIO A: The Backend is completely dead (Network Error)
        if (!error.response) {
            alert("CRITICAL ERROR: Backend Server is unreachable!");
        } 
        
        // SCENARIO B: The Token is expired or invalid (401 Unauthorized)
        else if (error.response.status === 401) {
            alert("Session Expired. Please login again.");
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('userRole');
            window.location.href = '/login'; // Force redirect to login page
        }
        
        // Pass the error down to the specific component (like Catalog.jsx) so it can handle specific errors too
        return Promise.reject(error);
    }
);

export default api;

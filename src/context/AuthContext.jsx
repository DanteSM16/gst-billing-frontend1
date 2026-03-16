// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// 1. Create the blank context (The empty bucket)
export const AuthContext = createContext();

// 2. Create the Provider (The machine that fills the bucket and shares it)
export const AuthProvider = ({ children }) => {
    // State variables: Do we have a token? What is the user's role?
    const [token, setToken] = useState(localStorage.getItem('jwtToken') || null);
    const [role, setRole] = useState(localStorage.getItem('userRole') || null);
     // NEW LINE:
    const [username, setUsername] = useState(localStorage.getItem('userName') || null);
    
    const navigate = useNavigate();

    // The Login Function (The actual call to Spring Boot)
    const login = async (username, password) => {
        try {
            // Send POST request to Spring Boot
            const response = await api.post('/auth/login', { username, password });
            
            // If successful, Spring returns the raw JWT string
            const jwt = response.data;
            
            // Decode the JWT to find the Role (A quick trick using JavaScript's built-in atob function)
            // JWTs have 3 parts separated by dots. The middle part has the payload (claims).
            const payload = JSON.parse(atob(jwt.split('.')[1])); 
            const userRole = payload.role;
            const userName = payload.sub; // 'sub' (Subject) is standard JWT for username!

            // Save them in browser memory so we don't lose them if they refresh the page
            localStorage.setItem('jwtToken', jwt);
            localStorage.setItem('userRole', userRole);
            localStorage.setItem('userName', userName); // Save it!

            // Update our React State
            setToken(jwt);
            setRole(userRole);
            setUsername(userName); // Set the state!

            // --- THE FIX: Dynamic Routing based on Role ---
            if (userRole === 'OWNER' || userRole === 'DEVELOPER') {
                navigate('/admin');
            } else if (userRole === 'STORE_MGR') {
                navigate('/procurement');
            } else if (userRole === 'BILLING_STAFF') {
                navigate('/pos');
            } else {
                // Default for FINANCE_MGR
                navigate('/dashboard'); 
            }
            // ----------------------------------------------
            return { success: true };;

        } catch (error) {
            console.error("Login Error Object:", error);
            
            // THE FIX: Bulletproof error message extraction
            let errorMsg = "Invalid username or password."; // Default fallback
            
            if (error.response && error.response.data) {
                // Sometimes Spring Boot returns a string sometimes a JSON object. This handles both!
                errorMsg = typeof error.response.data === 'string' 
                            ? error.response.data 
                            : error.response.data.message || errorMsg;
            }
            
            return { success: false, message: errorMsg };
        }
    };

    const logout = () => {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        setToken(null); setRole(null); setUsername(null);
        navigate('/login');
    };

    // Expose 'username' in the value!
    return (
        <AuthContext.Provider value={{ token, role, username, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
// src/components/ProtectedRoute.jsx
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// This component acts like a Bouncer for your routes.
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { token, role } = useContext(AuthContext);

    // If they have no token, kick them to Login
    if (!token) {
        return <Navigate to="/login" />;
    }

    // If this route requires specific roles, and the user's role isn't in the list, kick them out
    if (allowedRoles && !allowedRoles.includes(role)) {
        return <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1 style={{ color: 'red' }}>403 Forbidden</h1>
            <p>You do not have permission to view this page.</p>
        </div>;
    }

    // If they pass both checks, render the actual page (children)
    return children;
};

export default ProtectedRoute;
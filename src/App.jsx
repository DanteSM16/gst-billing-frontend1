// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar'; // <--- IMPORT IT HERE
import PointOfSale from './pages/PointOfSale';
import Purchases from './pages/Purchases';
import OrderHistory from './pages/OrderHistory';

import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import Catalog from './pages/Catalog';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        
        <Navbar /> 
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['OWNER', 'DEVELOPER']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/catalog" element={<ProtectedRoute><Catalog /></ProtectedRoute>} />
          <Route path="/procurement" element={<ProtectedRoute allowedRoles={['STORE_MGR']}><Purchases /></ProtectedRoute>} />
          <Route path="/pos" element={
            <ProtectedRoute allowedRoles={['BILLING_STAFF']}>
                <PointOfSale />
            </ProtectedRoute>
          } />
          <Route path="/history" element={<ProtectedRoute allowedRoles={['OWNER', 'FINANCE_MGR']}><OrderHistory /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['OWNER', 'FINANCE_MGR']}><Dashboard /></ProtectedRoute>} />
          
        </Routes>

      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
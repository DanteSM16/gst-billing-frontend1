// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AdminDashboard = () => {
    const [stores, setStores] = useState([]);
    const [users, setUsers] = useState([]); // State for Employees
    
    const [newStore, setNewStore] = useState({ storeName: '', gstin: '', stateCode: '', address: '' });
    const [newUser, setNewUser] = useState({ username: '', password: '', roleName: 'BILLING_STAFF', storeId: '' });
    
    const [storeMessage, setStoreMessage] = useState('');
    const [userMessage, setUserMessage] = useState('');

    useEffect(() => { 
        fetchStores(); 
        fetchUsers(); 
    }, []);

    const fetchStores = async () => {
        try {
            const response = await api.get('/stores');
            setStores(response.data);
        } catch (error) { console.error("Failed to fetch stores"); }
    };

    const fetchUsers = async () => {
        try { 
            const res = await api.get('/users'); 
            setUsers(res.data); 
        } 
        catch (error) { console.error("Failed to fetch users"); }
    };

    const handleCreateStore = async (e) => {
        e.preventDefault();
        try {
            await api.post('/stores', newStore);
            setStoreMessage("Store created successfully!");
            setNewStore({ storeName: '', gstin: '', stateCode: '', address: '' }); 
            fetchStores(); 
        } catch (error) { setStoreMessage("Error creating store."); }
    };

    const handleRegisterUser = async (e) => {
        e.preventDefault();
        setUserMessage(''); // Clear old messages before trying!
        
        try {
            const payload = { ...newUser, storeId: newUser.storeId ? parseInt(newUser.storeId) : null };
            await api.post('/auth/register', payload);
            
            setUserMessage(`User ${newUser.username} registered successfully!`);
            setNewUser({ username: '', password: '', roleName: 'BILLING_STAFF', storeId: '' });
            fetchUsers(); 
        } catch (error) {
            // THE FIX: Safely extract the error text from the Axios response!
            // If Spring Boot sent a message, use it. If the server is dead, use a fallback.
            const errorMsg = error.response?.data || "Network Error: Could not register user.";
            
            // Set the message so the UI draws it in red text!
            setUserMessage(`❌ Registration Failed`);
        }
    };
    const toggleStoreStatus = async (id) => {
        try {
            await api.put(`/stores/${id}/toggle-status`);
            fetchStores(); 
        } catch (error) { setStoreMessage("Failed to update store status."); }
    };

    const toggleUserStatus = async (username) => {
        try {
            await api.put(`/users/${username}/toggle-status`);
            fetchUsers(); 
        } catch (error) { setUserMessage("Failed to update user status."); }
    };

    return (
        <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '30px', color: '#111827' }}>System Administration</h1>
            
            {/* TOP ROW: The Forms (Side by Side) */}
            <div style={{ display: 'flex', gap: '30px', marginBottom: '40px' }}>
                
                {/* CREATE STORE CARD */}
                <div className="modern-card" style={{ flex: 1 }}>
                    <h3 style={{ marginTop: 0, borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>Create New Branch</h3>
                    {storeMessage && <p style={{ color: 'green', fontSize: '14px' }}>{storeMessage}</p>}
                    
                    <form onSubmit={handleCreateStore}>
                        <label style={{ fontSize: '13px', fontWeight: '600' }}>Store Name</label>
                        <input type="text" className="modern-input" required value={newStore.storeName} onChange={e => setNewStore({...newStore, storeName: e.target.value})} />
                        
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '13px', fontWeight: '600' }}>GSTIN</label>
                                <input type="text" className="modern-input" required value={newStore.gstin} onChange={e => setNewStore({...newStore, gstin: e.target.value})} />
                            </div>
                            <div style={{ width: '100px' }}>
                                <label style={{ fontSize: '13px', fontWeight: '600' }}>State (MH)</label>
                                <input type="text" className="modern-input" required value={newStore.stateCode} onChange={e => setNewStore({...newStore, stateCode: e.target.value})} />
                            </div>
                        </div>

                        <label style={{ fontSize: '13px', fontWeight: '600' }}>Address</label>
                        <input type="text" className="modern-input" required value={newStore.address} onChange={e => setNewStore({...newStore, address: e.target.value})} />
                        
                        <button type="submit" className="modern-button" style={{ marginTop: '15px', backgroundColor: '#4F46E5' }}>Add Store</button>
                    </form>
                </div>

                {/* HIRE EMPLOYEE CARD */}
                <div className="modern-card" style={{ flex: 1 }}>
                    <h3 style={{ marginTop: 0, borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>Hire New Employee</h3>
                    {userMessage && <p style={{ color: 'green', fontSize: '14px' }}>{userMessage}</p>}
                    
                    <form onSubmit={handleRegisterUser}>
                        <label style={{ fontSize: '13px', fontWeight: '600' }}>Username</label>
                        <input type="text" className="modern-input" required value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                        
                        <label style={{ fontSize: '13px', fontWeight: '600' }}>Password</label>
                        <input type="password" className="modern-input" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                        
                        <label style={{ fontSize: '13px', fontWeight: '600' }}>System Role</label>
                        <select className="modern-input" value={newUser.roleName} onChange={e => setNewUser({...newUser, roleName: e.target.value})}>
                            <option value="BILLING_STAFF">Billing Staff (Cashier)</option>
                            <option value="STORE_MGR">Store Manager</option>
                            <option value="FINANCE_MGR">Finance Manager</option>
                            <option value="DEVELOPER">Developer</option>
                        </select>

                        <label style={{ fontSize: '13px', fontWeight: '600' }}>Assign to Branch</label>
                        <select className="modern-input" value={newUser.storeId} onChange={e => setNewUser({...newUser, storeId: e.target.value})}>
                            <option value="">-- System Wide (Finance) --</option>
                            {/* Notice we added .filter(s => s.isActive) so you can't assign staff to closed stores! */}
                            {stores.filter(s => s.isActive).map(store => (
                                <option key={store.id} value={store.id}>{store.storeName} ({store.stateCode})</option>
                            ))}
                        </select>

                        <button type="submit" className="modern-button" style={{ marginTop: '15px', backgroundColor: '#10B981' }}>Register User</button>
                    </form>
                </div>
            </div>

            {/* BOTTOM ROW: The Tables (Side by Side) */}
            <div style={{ display: 'flex', gap: '30px' }}>
                
                {/* STORE TABLE */}
                <div className="modern-card" style={{ flex: 1 }}>
                    <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Active Branches Network</h3>
                    <table className="modern-table">
                        <thead>
                            {/* Added ID Header */}
                            <tr><th>ID</th><th>Name</th><th>GSTIN</th><th>State</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            {stores.map(store => (
                                <tr key={store.id} style={{ color: store.isActive ? '#111827' : '#9CA3AF' }}>
                                    {/* Added ID Data */}
                                    <td style={{ color: '#6B7280' }}>#{store.id}</td>
                                    <td><strong>{store.storeName}</strong></td>
                                    <td style={{ fontFamily: 'monospace' }}>{store.gstin}</td>
                                    <td><span style={{ backgroundColor: store.isActive ? '#E0E7FF' : '#F3F4F6', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', color: store.isActive ? '#3730A3' : '#9CA3AF' }}>{store.stateCode}</span></td>
                                    <td>
                                        <button onClick={() => toggleStoreStatus(store.id)}
                                                style={{ backgroundColor: store.isActive ? '#FEF2F2' : '#ECFDF5', color: store.isActive ? '#DC2626' : '#059669', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                            {store.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {stores.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', color: 'gray' }}>No branches registered yet.</td></tr>}
                        </tbody>
                    </table>
                </div>

                {/* EMPLOYEE TABLE */}
                <div className="modern-card" style={{ flex: 1 }}>
                    <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Employee Roster</h3>
                    <table className="modern-table">
                        <thead>
                            {/* Added ID Header */}
                            <tr><th>ID</th><th>Username</th><th>Role</th><th>Branch</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.username} style={{ color: user.isActive ? '#111827' : '#9CA3AF' }}>
                                    {/* Added ID Data. We use user.username as fallback just in case ID is null */}
                                    <td style={{ color: '#6B7280' }}>#{user.id || 'SYS'}</td>
                                    <td><strong>{user.username}</strong></td>
                                    <td>{user.roleName}</td>
                                    <td>{user.storeName}</td>
                                    <td>
                                        <button onClick={() => toggleUserStatus(user.username)}
                                                style={{ backgroundColor: user.isActive ? '#FEF2F2' : '#ECFDF5', color: user.isActive ? '#DC2626' : '#059669', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                            {user.isActive ? 'Terminate' : 'Rehire'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', color: 'gray' }}>No employees hired yet.</td></tr>}
                        </tbody>
                    </table>
                </div>

            </div>

        </div>
    );
};

export default AdminDashboard;
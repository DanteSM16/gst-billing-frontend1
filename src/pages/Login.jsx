// src/pages/Login.jsx
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const { login, token } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        // If we have a token, we must redirect!
        if (token) {
            // Bypass React state timing issues and grab the role directly from the hard drive
            const currentRole = localStorage.getItem('userRole');
            
            if (currentRole === 'OWNER' || currentRole === 'DEVELOPER') {
                navigate('/admin');
            } else if (currentRole === 'STORE_MGR') {
                navigate('/procurement');
            } else if (currentRole === 'BILLING_STAFF') {
                navigate('/pos');
            } else {
                navigate('/dashboard'); 
            }
        }
    }, [token, navigate]); // We removed 'role' from this array!

    const handleSubmit = async (e) => {
        e.preventDefault(); 
        setError(''); 
        
        const result = await login(username, password);
        
        if (!result.success) {
            // Display the exact message sent from Java!
            setError(result.message); 
        }
    };

    return (
        // Split-screen layout container
        <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: 'white' }}>
            
            {/* LEFT SIDE: The Background Image (from your reference style) */}
            <div style={{ 
                flex: 6, 
                backgroundImage: 'url("https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80")', 
                backgroundSize: 'cover', 
                backgroundPosition: 'center' 
            }}>
                {/* You can leave this side completely blank, the image does the work! */}
            </div>

            {/* RIGHT SIDE: The Login Form */}
            <div style={{ flex: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
                
                <div style={{ width: '100%', maxWidth: '350px' }}>
                    <h1 style={{ fontSize: '32px', marginBottom: '10px', color: '#111827' }}>Sign in</h1>
                    <p style={{ color: '#6B7280', marginBottom: '30px' }}>Enter the details to access your account</p>
                    
                    {error && <div style={{ backgroundColor: '#FEE2E2', color: '#991B1B', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>{error}</div>}
                    
                    <form onSubmit={handleSubmit}>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Username</label>
                        <input 
                            type="text" 
                            placeholder="Enter your username" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="modern-input" /* Using our new CSS class! */
                            required
                        />
                        
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginTop: '15px', display: 'block' }}>Password</label>
                        <input 
                            type="password" 
                            placeholder="••••••••" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="modern-input" /* Using our new CSS class! */
                            required
                        />
                        
                        <div style={{ marginTop: '25px' }}>
                            <button type="submit" className="modern-button">
                                Sign in
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    );
};

export default Login;
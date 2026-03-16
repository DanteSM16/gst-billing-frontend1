// src/components/Navbar.jsx
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
    // We now grab 'username' from the Context!
    const { role, username, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    if (!role) return null;

    // Define a sleek button style we can reuse
    const navBtnStyle = {
        background: 'none',
        border: 'none',
        color: '#D1D5DB',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        padding: '8px 12px',
        borderRadius: '6px',
        transition: 'background-color 0.2s, color 0.2s'
    };

    return (
        <nav style={{ 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
            backgroundColor: '#111827', /* Deep Dark Gray */
            color: 'white', 
            padding: '15px 30px', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            fontFamily: 'Poppins, sans-serif' /* Force the modern font! */
        }}>
            
            {/* LOGO & USER INFO */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <h2 style={{ margin: 0, cursor: 'pointer', letterSpacing: '1px', fontSize: '20px' }}>
                    GST<span style={{ color: '#4F46E5' }}>ERP</span>
                </h2>
                
                <div style={{ backgroundColor: '#1F2937', padding: '4px 12px', borderRadius: '50px', fontSize: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ color: '#ffffff' }}>👤 Logged in as: </span>
                    <span style={{ color: '#9CA3AF' }}>👤 {username}</span>
                    <span style={{ color: '#4F46E5', fontWeight: 'bold' }}>({role})</span>
                </div>
            </div>

            {/* NAVIGATION LINKS */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {['OWNER', 'DEVELOPER'].includes(role) && (
                    <button style={navBtnStyle} onClick={() => navigate('/admin')}
                            onMouseOver={e => { e.target.style.backgroundColor = '#374151'; e.target.style.color = 'white'; }}
                            onMouseOut={e => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#D1D5DB'; }}>
                        Admin Panel
                    </button>
                )}
                
                <button style={navBtnStyle} onClick={() => navigate('/catalog')}
                        onMouseOver={e => { e.target.style.backgroundColor = '#374151'; e.target.style.color = 'white'; }}
                        onMouseOut={e => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#D1D5DB'; }}>
                    Catalog
                </button>
                
                {role === 'STORE_MGR' && (
                    <button style={navBtnStyle} onClick={() => navigate('/procurement')}
                            onMouseOver={e => { e.target.style.backgroundColor = '#374151'; e.target.style.color = 'white'; }}
                            onMouseOut={e => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#D1D5DB'; }}>
                        Procurement
                    </button>
                )}
                
                {role === 'BILLING_STAFF' && (
                    <button style={navBtnStyle} onClick={() => navigate('/pos')}
                            onMouseOver={e => { e.target.style.backgroundColor = '#374151'; e.target.style.color = 'white'; }}
                            onMouseOut={e => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#D1D5DB'; }}>
                        POS Terminal
                    </button>
                )}
                
                {['OWNER', 'FINANCE_MGR'].includes(role) && (
                <button style={navBtnStyle} onClick={() => navigate('/dashboard')}
                        onMouseOver={e => { e.target.style.backgroundColor = '#374151'; e.target.style.color = 'white'; }}
                        onMouseOut={e => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#D1D5DB'; }}>
                    Tax Dashboard
                </button>
                )}

                {['OWNER', 'FINANCE_MGR'].includes(role) && (
                    <button style={navBtnStyle} onClick={() => navigate('/history')}
                            onMouseOver={e => { e.target.style.backgroundColor = '#374151'; e.target.style.color = 'white'; }}
                            onMouseOut={e => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#D1D5DB'; }}>
                        Audit Trail
                    </button>
                )}
                
                <div style={{ width: '1px', height: '24px', backgroundColor: '#374151', margin: '0 10px' }}></div>
                
                {/* LOGOUT BUTTON */}
                <button 
                    onClick={logout} 
                    style={{ backgroundColor: '#DC2626', color: 'white', border: 'none', padding: '8px 16px', cursor: 'pointer', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', transition: 'background-color 0.2s' }}
                    onMouseOver={e => e.target.style.backgroundColor = '#B91C1C'}
                    onMouseOut={e => e.target.style.backgroundColor = '#DC2626'}
                >
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
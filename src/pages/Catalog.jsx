// src/pages/Catalog.jsx
import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Catalog = () => {
    const { role } = useContext(AuthContext); 
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState(''); 
    
    const [newProduct, setNewProduct] = useState({ id: null, name: '', hsnCode: '', basePrice: '', gstRate: '', imageUrl: '' });
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => { fetchProducts(); }, []);

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products');
            setProducts(response.data);
        } catch (error) { console.error("Failed to fetch products"); }
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        try {
            if (isEditMode) {
                await api.put(`/products/${newProduct.id}`, newProduct);
            } else {
                await api.post('/products', newProduct);
            }
            setNewProduct({ id: null, name: '', hsnCode: '', basePrice: '', gstRate: '', imageUrl: '' });
            setIsEditMode(false);
            fetchProducts(); 
        } catch (error) { alert("Error saving product!"); }
    };

    const handleEditClick = (product) => {
        setIsEditMode(true);
        setNewProduct({
            id: product.id, name: product.name, hsnCode: product.hsnCode, 
            basePrice: product.basePrice, gstRate: product.gstRate, imageUrl: product.imageUrl || ''
        });
        window.scrollTo(0, 0); 
    };

    const toggleProductStatus = async (id) => {
        try {
            await api.put(`/products/${id}/toggle-status`);
            fetchProducts();
        } catch (error) { alert("Failed to toggle product status."); }
    };


    const filteredProducts = products.filter(product => product.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ margin: 0, color: '#111827' }}>Master Product Catalog</h1>
                {/* Clean, pill-shaped search bar */}
                <input 
                    type="text" 
                    placeholder="🔍 Search products..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ padding: '12px 20px', width: '300px', borderRadius: '50px', border: '1px solid #ccc', outline: 'none' }}
                />
            </div>

            {/* ONLY show the form if they are a Store Manager */}
            {role === 'STORE_MGR' && (
                <div className="modern-card" style={{ marginBottom: '30px', backgroundColor: isEditMode ? '#FEF3C7' : 'white', transition: 'background-color 0.3s' }}>
                    <h3 style={{ marginTop: 0, color: isEditMode ? '#D97706' : '#111827' }}>
                        {isEditMode ? '✏️ Edit Product Template' : '➕ Add New Product'}
                    </h3>
                    
                    {/* Grid layout for the form to save vertical space */}
                    <form onSubmit={handleSaveProduct} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', alignItems: 'end' }}>
                        <div><label style={{ fontSize: '13px', fontWeight: '600' }}>Product Name</label><input type="text" className="modern-input" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} /></div>
                        <div><label style={{ fontSize: '13px', fontWeight: '600' }}>HSN Code</label><input type="text" className="modern-input" required value={newProduct.hsnCode} onChange={e => setNewProduct({...newProduct, hsnCode: e.target.value})} /></div>
                        <div><label style={{ fontSize: '13px', fontWeight: '600' }}>Base Price (₹)</label><input type="number" className="modern-input" required value={newProduct.basePrice} onChange={e => setNewProduct({...newProduct, basePrice: e.target.value})} /></div>
                        <div><label style={{ fontSize: '13px', fontWeight: '600' }}>GST Rate (%)</label><input type="number" className="modern-input" required value={newProduct.gstRate} onChange={e => setNewProduct({...newProduct, gstRate: e.target.value})} /></div>
                        <div style={{ gridColumn: 'span 2' }}><label style={{ fontSize: '13px', fontWeight: '600' }}>Image URL</label><input type="url" className="modern-input" value={newProduct.imageUrl} onChange={e => setNewProduct({...newProduct, imageUrl: e.target.value})} /></div>
                        
                        <div style={{ display: 'flex', gap: '10px', gridColumn: 'span 3', justifyContent: 'flex-end' }}>
                            {isEditMode && (
                                <button type="button" onClick={() => { setIsEditMode(false); setNewProduct({ id: null, name: '', hsnCode: '', basePrice: '', gstRate: '', imageUrl: '' }); }} 
                                    style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ccc', backgroundColor: 'white', cursor: 'pointer' }}>Cancel</button>
                            )}
                            <button type="submit" className="modern-button" style={{ width: 'auto', backgroundColor: isEditMode ? '#D97706' : '#10B981' }}>
                                {isEditMode ? 'Update Product' : 'Save Template'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="modern-card">
                <table className="modern-table">
                    <thead>
                        <tr>
                            <th style={{ width: '60px', textAlign: 'center' }}>Image</th>
                            <th style={{ width: '80px' }}>ID</th>
                            <th>Product Name</th>
                            <th>HSN Code</th>
                            <th>Base Price</th>
                            <th>GST Rate</th>
                            
                            {/* BUG FIX: Show the Actions column header to Owners, Devs, OR Store Managers! */}
                            {['OWNER', 'DEVELOPER', 'STORE_MGR'].includes(role) && <th style={{ textAlign: 'right' }}>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map(product => (
                        <tr key={product.id} style={{ opacity: product.isActive ? 1 : 0.5 }}> 
                            <td style={{ textAlign: 'center' }}>
                                {product.imageUrl ? <img src={product.imageUrl} alt="img" style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '6px' }} /> : 'N/A'}
                            </td>
                            <td>#{product.id}</td>
                            <td><strong>{product.name}</strong> {product.isActive ? '' : '(Discontinued)'}</td>
                            <td>{product.hsnCode}</td>
                            <td>₹{product.basePrice.toLocaleString('en-IN')}</td>
                            <td>{product.gstRate}%</td>
                            
                            {/* BUG FIX: Show the Actions column data to the right people! */}
                            {['OWNER', 'DEVELOPER', 'STORE_MGR'].includes(role) && (
                                <td style={{ textAlign: 'right', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    
                                    {/* Edit Button ONLY for Store Manager */}
                                    {role === 'STORE_MGR' && (
                                        <button onClick={() => handleEditClick(product)} style={{ backgroundColor: 'white', border: '1px solid #D1D5DB', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>✏️ Edit</button>
                                    )}

                                    {/* Disable/Enable Button ONLY for Owner/Dev */}
                                    {['OWNER', 'DEVELOPER'].includes(role) && (
                                        <button onClick={() => toggleProductStatus(product.id)} style={{ backgroundColor: product.isActive ? '#FEF2F2' : '#ECFDF5', color: product.isActive ? '#DC2626' : '#059669', border: '1px solid transparent', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                            {product.isActive ? 'Disable' : 'Enable'}
                                        </button>
                                    )}

                                </td>
                            )}
                        </tr>
                    ))}
                    </tbody>
                </table>
                {filteredProducts.length === 0 && <p style={{ textAlign: 'center', color: 'gray', padding: '20px' }}>No products found.</p>}
            </div>
        </div>
    );
};

export default Catalog;
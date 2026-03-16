// src/pages/Purchases.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Purchases = () => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]); 
    const [message, setMessage] = useState({ text: '', type: '' });

    const [invoiceHeader, setInvoiceHeader] = useState({ supplierName: '', supplierGstin: '', billingAddress: '', contactNumber: '', stateCode: '' });
    const [currentItem, setCurrentItem] = useState({ productId: '', quantity: 1, purchasePrice: '', serialNumbersText: '' });

    useEffect(() => {
        const fetchProducts = async () => {
            try { 
                const response = await api.get('/products');
                
                // Sort the array alphabetically by 'name' before saving it to state so easier to find in scroll bar
                const sortedProducts = response.data.sort((a, b) => a.name.localeCompare(b.name));
                
                setProducts(sortedProducts); 
            } 
            catch (error) { console.error("Failed to load products"); }
        };
        fetchProducts();
    }, []);

    const handleAddToCart = () => {
        setMessage({ text: '', type: '' });
        if (!currentItem.productId) return setMessage({ text: "Select a product.", type: "error" });
        if (currentItem.quantity <= 0 || currentItem.purchasePrice < 0) return setMessage({ text: "Invalid Qty/Price.", type: "error" });

        const serialArray = currentItem.serialNumbersText.split(',').map(s => s.trim()).filter(s => s.length > 0);
        if (serialArray.length !== parseInt(currentItem.quantity)) {
            return setMessage({ text: `Mismatch! Qty is ${currentItem.quantity}, but you provided ${serialArray.length} serial numbers.`, type: "error" });
        }

        const selectedProduct = products.find(p => p.id === parseInt(currentItem.productId));
        const cartItem = {
            productId: parseInt(currentItem.productId),
            productName: selectedProduct.name, 
            imageUrl: selectedProduct.imageUrl, // Capture image for the dark cart!
            quantity: parseInt(currentItem.quantity),
            purchasePrice: parseFloat(currentItem.purchasePrice),
            serialNumbers: serialArray
        };

        setCart([...cart, cartItem]);
        setCurrentItem({ productId: '', quantity: 1, purchasePrice: '', serialNumbersText: '' });
    };

    const handleRemoveFromCart = (indexToRemove) => setCart(cart.filter((_, index) => index !== indexToRemove));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });
        if (cart.length === 0) return setMessage({ text: "Cart is empty.", type: "error" });
        if (!invoiceHeader.stateCode || invoiceHeader.stateCode.length !== 2) return setMessage({ text: "Invalid State Code.", type: "error" });

        const storeIdPrompt = prompt("Enter your Store ID to confirm this purchase (Security Lock):");
        if (!storeIdPrompt) return;

        const payload = {
            ...invoiceHeader, storeId: parseInt(storeIdPrompt),
            items: cart.map(item => ({ productId: item.productId, quantity: item.quantity, purchasePrice: item.purchasePrice, serialNumbers: item.serialNumbers }))
        };

        try {
            const response = await api.post('/purchases', payload);
            setMessage({ text: `Purchase Successful! Invoice ID: ${response.data.invoiceId}`, type: "success" });
            setCart([]); setInvoiceHeader({ supplierName: '', supplierGstin: '', billingAddress: '', contactNumber: '', stateCode: '' });
            downloadPdf(response.data.invoiceId);
        } catch (error) { setMessage({ text: error.response?.data?.message || "Server Error", type: "error" }); }
    };

    const downloadPdf = async (invoiceId) => {
        try {
            const pdfResponse = await api.get(`/reports/download-purchase/${invoiceId}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([pdfResponse.data]));
            const link = document.createElement('a');
            link.href = url; link.setAttribute('download', `GoodsReceipt_${invoiceId}.pdf`);
            document.body.appendChild(link); link.click(); link.remove();
        } catch (err) { console.error("PDF Download failed."); }
    };

    // Calculate total for the UI
    const cartTotal = cart.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0);

    return (
        <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '30px' }}>
            
            {/* LEFT SIDE: Inputs */}
            <div style={{ flex: 6 }}>
                <h1 style={{ marginBottom: '20px', color: '#111827' }}>Inward Procurement</h1>
                
                {message.text && <div style={{ padding: '15px', borderRadius: '8px', marginBottom: '20px', backgroundColor: message.type === 'error' ? '#FEE2E2' : '#D1FAE5', color: message.type === 'error' ? '#991B1B' : '#065F46', fontWeight: '500' }}>{message.text}</div>}

                <div className="modern-card" style={{ marginBottom: '20px' }}>
                    <h3 style={{ marginTop: 0, color: '#4B5563', borderBottom: '1px solid #E5E7EB', paddingBottom: '10px' }}>1. Supplier Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div><label style={{ fontSize: '12px', fontWeight: 'bold' }}>Supplier Name</label><input type="text" className="modern-input" required value={invoiceHeader.supplierName} onChange={e => setInvoiceHeader({...invoiceHeader, supplierName: e.target.value})} /></div>
                        <div><label style={{ fontSize: '12px', fontWeight: 'bold' }}>Supplier GSTIN</label><input type="text" className="modern-input" required value={invoiceHeader.supplierGstin} onChange={e => setInvoiceHeader({...invoiceHeader, supplierGstin: e.target.value})} /></div>
                        <div><label style={{ fontSize: '12px', fontWeight: 'bold' }}>State Code (e.g. MH)</label><input type="text" className="modern-input" required value={invoiceHeader.stateCode} onChange={e => setInvoiceHeader({...invoiceHeader, stateCode: e.target.value})} /></div>
                        <div><label style={{ fontSize: '12px', fontWeight: 'bold' }}>Contact Number</label><input type="text" className="modern-input" value={invoiceHeader.contactNumber} onChange={e => setInvoiceHeader({...invoiceHeader, contactNumber: e.target.value})} /></div>
                    </div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginTop: '10px' }}>Billing Address</label>
                    <input type="text" className="modern-input" value={invoiceHeader.billingAddress} onChange={e => setInvoiceHeader({...invoiceHeader, billingAddress: e.target.value})} />
                </div>

                <div className="modern-card">
                    <h3 style={{ marginTop: 0, color: '#4B5563', borderBottom: '1px solid #E5E7EB', paddingBottom: '10px' }}>2. Add Items to GRN</h3>
                    
                    <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Select Product Catalog</label>
                    <select className="modern-input" value={currentItem.productId} onChange={e => setCurrentItem({...currentItem, productId: e.target.value})}>
                        <option value="">-- Choose Product --</option>
                        {products.filter(p => p.isActive).map(p => (
        <option key={p.id} value={p.id}>{p.name} (HSN: {p.hsnCode})</option>
    ))}

                    </select>

                    <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                        <div style={{ width: '120px' }}><label style={{ fontSize: '12px', fontWeight: 'bold' }}>Quantity</label><input type="number" className="modern-input" min="1" value={currentItem.quantity} onChange={e => setCurrentItem({...currentItem, quantity: e.target.value})} /></div>
                        <div style={{ flex: 1 }}><label style={{ fontSize: '12px', fontWeight: 'bold' }}>Negotiated Unit Price (₹)</label><input type="number" className="modern-input" value={currentItem.purchasePrice} onChange={e => setCurrentItem({...currentItem, purchasePrice: e.target.value})} /></div>
                    </div>

                    <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginTop: '10px' }}>Scan Serial Numbers (Comma Separated)</label>
                    <textarea className="modern-input" rows="3" placeholder="MAC-01, MAC-02..." value={currentItem.serialNumbersText} onChange={e => setCurrentItem({...currentItem, serialNumbersText: e.target.value})} />

                    <button type="button" onClick={handleAddToCart} className="modern-button" style={{ backgroundColor: '#2563EB', marginTop: '15px' }}>➕ Add to GRN Cart</button>
                </div>
            </div>

            {/* RIGHT SIDE: The Dark Mode Cart */}
            <div style={{ flex: 4, backgroundColor: '#1E293B', borderRadius: '12px', padding: '25px', color: 'white', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', position: 'sticky', top: '20px' }}>
                <h2 style={{ marginTop: 0, borderBottom: '1px solid #334155', paddingBottom: '15px' }}>Purchase Cart ({cart.length})</h2>
                
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
                    {cart.length === 0 ? <p style={{ color: '#9CA3AF', textAlign: 'center', marginTop: '50px' }}>No items added yet.</p> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {cart.map((item, index) => (
                                <div key={index} style={{ backgroundColor: '#334155', padding: '15px', borderRadius: '8px', display: 'flex', gap: '15px' }}>
                                    {item.imageUrl ? <img src={item.imageUrl} alt="img" style={{ width: '60px', height: '60px', borderRadius: '6px', objectFit: 'cover' }} /> : <div style={{ width: '60px', height: '60px', backgroundColor: '#475569', borderRadius: '6px' }}></div>}
                                    
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <strong style={{ fontSize: '16px' }}>{item.productName}</strong>
                                            <button onClick={() => handleRemoveFromCart(index)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '18px' }}>✖</button>
                                        </div>
                                        <div style={{ color: '#CBD5E1', fontSize: '13px', marginTop: '5px' }}>Qty: {item.quantity} × ₹{item.purchasePrice}</div>
                                        <div style={{ color: '#9CA3AF', fontSize: '11px', marginTop: '8px', fontStyle: 'italic' }}>SN: {item.serialNumbers.join(', ')}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ borderTop: '2px solid #334155', paddingTop: '20px', marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#9CA3AF', marginBottom: '10px' }}><span>Subtotal:</span><span>₹{cartTotal.toLocaleString('en-IN')}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '22px', fontWeight: 'bold', marginBottom: '20px' }}><span>Total (excl. Tax):</span><span style={{ color: '#10B981' }}>₹{cartTotal.toLocaleString('en-IN')}</span></div>
                    
                    <button onClick={handleSubmit} disabled={cart.length === 0} className="modern-button" style={{ backgroundColor: cart.length === 0 ? '#475569' : '#10B981', padding: '18px', fontSize: '16px' }}>
                        ✅ Finalize & Print GRN
                    </button>
                </div>
            </div>

        </div>
    );
};

export default Purchases;
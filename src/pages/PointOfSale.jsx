// src/pages/PointOfSale.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';

const PointOfSale = () => {
    const [products, setProducts] = useState([]);
    const [availableStock, setAvailableStock] = useState([]); 
    const [cart, setCart] = useState([]); 
    const [message, setMessage] = useState({ text: '', type: '' });

    const [customerInfo, setCustomerInfo] = useState({ customerName: '', customerContact: '', billingAddress: '', stateCode: '', customerGstin: '' });
    const [selectedProductId, setSelectedProductId] = useState('');
    const [manualBarcode, setManualBarcode] = useState('');

    const cartTotal = cart.reduce((sum, item) => sum + parseFloat(item.sellingPrice || 0), 0);

    useEffect(() => {
        const fetchProducts = async () => {
            try { 
                const res = await api.get('/products'); 
                
                // Sort A-Z
                const sortedProducts = res.data.sort((a, b) => a.name.localeCompare(b.name));
                
                setProducts(sortedProducts); 
            } 
            catch (err) { console.error("Failed to load catalog"); }
        };
        fetchProducts();
    }, []);

    useEffect(() => {
        if (!selectedProductId) { setAvailableStock([]); return; }
        const fetchStock = async () => {
            try {
                const res = await api.get(`/products/stock/available?productId=${selectedProductId}`);
                setAvailableStock(res.data);
            } catch (err) { console.error("Failed to load stock"); }
        };
        fetchStock();
    }, [selectedProductId]);

    const handleAddCheckboxItem = (stockItem) => {
        if (cart.find(c => c.serialNo === stockItem.serialNo)) return setMessage({ text: "Item already in cart!", type: "error" });
        const product = products.find(p => parseInt(p.id) === parseInt(stockItem.productId));
        setCart([...cart, { serialNo: stockItem.serialNo, productName: product.name, imageUrl: product.imageUrl, sellingPrice: product.basePrice }]);
        setMessage({ text: '', type: '' });
    };

    const handleUpdateCartPrice = (index, newPrice) => {
        const updatedCart = [...cart]; updatedCart[index].sellingPrice = newPrice; setCart(updatedCart);
    };

    const handleRemoveFromCart = (index) => setCart(cart.filter((_, i) => i !== index));

    // --- THE NEW FINTECH CHECKOUT FLOW ---
    const handleCheckout = async () => {
        if (cart.length === 0) return;
        if (!window.confirm(`Initiate Secure Payment for ₹${cartTotal.toLocaleString('en-IN')}?`)) return;

        setMessage({ text: 'Initializing Payment Gateway...', type: '' });

        try {
            // STEP 1: Handshake with Java to get a Razorpay Order ID
            const orderRes = await api.post('/payments/create-order', { amount: cartTotal });
            const { orderId, amount, currency, keyId } = orderRes.data;

            // STEP 2: Configure the Razorpay Popup Window
            const options = {
                key: keyId, // Your Public Key from Java!
                amount: amount, // Amount in paise
                currency: currency,
                name: "GST ERP Pvt Ltd",
                description: "POS Retail Purchase",
                order_id: orderId, // The secure Order ID from Java!
                
                // STEP 3: The "Success Callback" Function
                // This function ONLY runs if the customer successfully types a credit card and pays!
                handler: async function (response) {
                    setMessage({ text: 'Payment Successful! Verifying signature...', type: 'success' });
                    
                    // We grab the 3 pieces of proof Razorpay just handed us
                    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = response;

                    // We build the final payload to save the actual sale in Postgres!
                    const payload = {
                        ...customerInfo,
                        items: cart.map(item => ({ serialNo: item.serialNo, sellingPrice: item.sellingPrice })),
                        
                        // --- THE NEW PAYMENT FIELDS ---
                        paymentMethod: "RAZORPAY_ONLINE",
                        razorpayPaymentId: razorpay_payment_id,
                        razorpayOrderId: razorpay_order_id,
                        razorpaySignature: razorpay_signature
                    };
                    

                    try {
                        // Send the payload to Java. Java will verify the signature mathematically!
                        const finalRes = await api.post('/sales', payload);
                        
                        setMessage({ text: `Sale Saved! Invoice ID: ${finalRes.data.invoiceId}`, type: "success" });
                        setCart([]); 
                        setCustomerInfo({ customerName: '', customerContact: '', billingAddress: '', stateCode: 'MH', customerGstin: '' });
                        
                        // Download the PDF Receipt
                        downloadPdf(finalRes.data.invoiceId);
                        
                    } catch (error) {
                        setMessage({ text: error.response?.data?.message || "Verification Failed! Transaction Cancelled.", type: "error" });
                    }
                },
                
                // Pre-fill the customer's details in the Razorpay popup if we have them!
                prefill: {
                    name: customerInfo.customerName || "Walk-in Customer",
                    contact: customerInfo.customerContact || "9999999999"
                },
                theme: { color: "#2563EB" } // Match our app's blue button color!
            };

            // STEP 4: Physically open the Razorpay window on the screen!
            const rzp = new window.Razorpay(options);
            
            // If the user clicks the "X" to close the popup without paying
            rzp.on('payment.failed', function (response) {
                setMessage({ text: "Payment Failed or Cancelled by User.", type: "error" });
            });
            
            rzp.open();

        } catch (error) {
            setMessage({ text: error.response?.data?.message || "Failed to initialize payment gateway.", type: "error" });
        }
    };

    const handleCashCheckout = async () => {
        if (cart.length === 0) return;
        if (!window.confirm(`Finalize CASH sale for ₹${cartTotal.toLocaleString('en-IN')}?`)) return;

        setMessage({ text: 'Processing Cash Payment...', type: '' });

        const payload = {
            ...customerInfo,
            items: cart.map(item => ({ serialNo: item.serialNo, sellingPrice: item.sellingPrice })),
            paymentMethod: "CASH", // Explicitly tag this as Cash!
            razorpayPaymentId: null,
            razorpayOrderId: null,
            razorpaySignature: null
        };

        try {
            const finalRes = await api.post('/sales', payload);
            setMessage({ text: `Sale Saved! Invoice ID: ${finalRes.data.invoiceId}`, type: "success" });
            
            // Clear the Cart & Customer Info
            setCart([]); 
            setCustomerInfo({ customerName: '', customerContact: '', billingAddress: '', stateCode: 'MH', customerGstin: '' });
            
            // Print the Receipt
            downloadPdf(finalRes.data.invoiceId);
        } catch (error) {
            setMessage({ text: error.response?.data?.message || "Cash Checkout Failed.", type: "error" });
        }
    };

    const downloadPdf = async (invoiceId) => {
        try {
            const res = await api.get(`/reports/download-invoice/${invoiceId}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url; link.setAttribute('download', `SALES_Invoice_${invoiceId}.pdf`);
            document.body.appendChild(link); link.click(); link.remove();
        } catch (err) { console.error("PDF Download failed."); }
    };

    return (
        <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '30px' }}>
            
            {/* LEFT SIDE: Inputs */}
            <div style={{ flex: 6 }}>
                <h1 style={{ marginBottom: '20px', color: '#111827' }}>POS Terminal</h1>
                
                {message.text && <div style={{ padding: '15px', borderRadius: '8px', marginBottom: '20px', backgroundColor: message.type === 'error' ? '#FEE2E2' : '#D1FAE5', color: message.type === 'error' ? '#991B1B' : '#065F46', fontWeight: '500' }}>{message.text}</div>}

                <div className="modern-card" style={{ marginBottom: '20px' }}>
                    <h3 style={{ marginTop: 0, color: '#4B5563', borderBottom: '1px solid #E5E7EB', paddingBottom: '10px' }}>Customer Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <input type="text" className="modern-input" placeholder="Customer Name" value={customerInfo.customerName} onChange={e => setCustomerInfo({...customerInfo, customerName: e.target.value})} />
                        <input type="text" className="modern-input" placeholder="Contact Number" value={customerInfo.customerContact} onChange={e => setCustomerInfo({...customerInfo, customerContact: e.target.value})} />
                        <input type="text" className="modern-input" placeholder="State Code (e.g. MH)" value={customerInfo.stateCode} onChange={e => setCustomerInfo({...customerInfo, stateCode: e.target.value})} />
                        <input type="text" className="modern-input" placeholder="Customer GSTIN (Only for B2B)" value={customerInfo.customerGstin} onChange={e => setCustomerInfo({...customerInfo, customerGstin: e.target.value})} />
                    </div>
                    <input type="text" className="modern-input" placeholder="Billing Address" style={{ width: '100%', marginTop: '10px' }} value={customerInfo.billingAddress} onChange={e => setCustomerInfo({...customerInfo, billingAddress: e.target.value})} />
                </div>

                <div className="modern-card">
                    <h3 style={{ marginTop: 0, color: '#4B5563', borderBottom: '1px solid #E5E7EB', paddingBottom: '10px' }}>Scan or Find Items</h3>
                    
                    <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Quick Scan Barcode</label>
                    <input type="text" className="modern-input" placeholder="Scan or type Serial No and hit Enter..." value={manualBarcode} onChange={e => setManualBarcode(e.target.value)}
                        onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                if (!manualBarcode.trim()) return; 
                                setMessage({ text: '', type: '' });
                                try {
                                    const res = await api.get(`/products/stock/${manualBarcode.trim()}`);
                                    const stockItem = res.data;
                                    if (cart.find(c => c.serialNo === stockItem.serialNo)) return setMessage({ text: "Item is already in cart!", type: "error" });
                                    const product = products.find(p => parseInt(p.id) === parseInt(stockItem.productId));
                                    if (!product) return setMessage({ text: "Error: Product not in catalog.", type: "error" });
                                    setCart([...cart, { serialNo: stockItem.serialNo, productName: product.name, imageUrl: product.imageUrl, sellingPrice: product.basePrice }]);
                                    setManualBarcode('');
                                } catch (error) { setMessage({ text: "Invalid or Sold Serial Number!", type: "error" }); }
                            }
                        }}
                        style={{ border: '2px solid #4F46E5', marginBottom: '20px' }} 
                    />

                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#6B7280' }}>Or Search Master Catalog</label>
                    <select className="modern-input" value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)}>
                        <option value="">-- Browse Products --</option>
                        {products.filter(p => p.isActive).map(p => (
        <option key={p.id} value={p.id}>{p.name} (HSN: {p.hsnCode})</option>
    ))}

                    </select>

                    {availableStock.length > 0 && (
                        <div style={{ marginTop: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', maxHeight: '150px', overflowY: 'auto' }}>
                            {availableStock.map(stock => (
                                <div key={stock.serialNo} style={{ backgroundColor: '#F3F4F6', padding: '10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '13px', fontFamily: 'monospace' }}>{stock.serialNo}</span>
                                    <button type="button" onClick={() => handleAddCheckboxItem(stock)} style={{ backgroundColor: 'white', border: '1px solid #D1D5DB', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>➕ Add</button>
                                </div>
                            ))}
                        </div>
                    )}
                    {selectedProductId && availableStock.length === 0 && <p style={{ color: '#DC2626', fontSize: '13px' }}>Out of Stock!</p>}
                </div>
            </div>

            {/* RIGHT SIDE: The Dark Mode POS Cart */}
            <div style={{ flex: 4, backgroundColor: '#111827', borderRadius: '12px', padding: '25px', color: 'white', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', position: 'sticky', top: '20px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
                <h2 style={{ marginTop: 0, borderBottom: '1px solid #374151', paddingBottom: '15px', color: '#F9FAFB' }}>POS Cart ({cart.length})</h2>
                
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
                    {cart.length === 0 ? <p style={{ color: '#6B7280', textAlign: 'center', marginTop: '50px' }}>Awaiting scans...</p> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {cart.map((item, index) => (
                                <div key={index} style={{ backgroundColor: '#1F2937', padding: '15px', borderRadius: '8px', display: 'flex', gap: '15px', border: '1px solid #374151' }}>
                                    {item.imageUrl ? <img src={item.imageUrl} alt="img" style={{ width: '50px', height: '50px', borderRadius: '6px', objectFit: 'cover' }} /> : <div style={{ width: '50px', height: '50px', backgroundColor: '#374151', borderRadius: '6px' }}></div>}
                                    
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                            <strong style={{ fontSize: '15px', color: '#F3F4F6' }}>{item.productName}</strong>
                                            <button onClick={() => handleRemoveFromCart(index)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '16px' }}>✖</button>
                                        </div>
                                        <div style={{ color: '#9CA3AF', fontSize: '11px', marginTop: '4px', marginBottom: '8px', fontFamily: 'monospace' }}>SN: {item.serialNo}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span style={{ color: '#9CA3AF', fontSize: '14px' }}>₹</span>
                                            <input type="number" value={item.sellingPrice} onChange={(e) => handleUpdateCartPrice(index, e.target.value)}
                                                style={{ width: '80px', padding: '4px 8px', backgroundColor: '#374151', border: '1px solid #4B5563', color: 'white', borderRadius: '4px', outline: 'none' }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ borderTop: '2px dashed #374151', paddingTop: '20px', marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: '#9CA3AF', marginBottom: '10px' }}><span>Taxable Subtotal:</span><span>₹{cartTotal.toLocaleString('en-IN')}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: '#9CA3AF', marginBottom: '15px' }}><span>Total Tax (Auto-Calc):</span><span>At Checkout</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '26px', fontWeight: 'bold', marginBottom: '25px', color: '#10B981' }}><span>TOTAL:</span><span>₹{cartTotal.toLocaleString('en-IN')}</span></div>
                    
                    <div style={{ display: 'flex', gap: '15px', flexDirection: 'column' }}>
                        <button 
                            onClick={handleCashCheckout} 
                            disabled={cart.length === 0} 
                            className="modern-button" 
                            style={{ backgroundColor: cart.length === 0 ? '#374151' : '#10B981', padding: '15px', fontSize: '16px', borderRadius: '8px' }}>
                            💵 PAY WITH CASH AND PRINT INVOICE
                        </button>

                        <button 
                            onClick={handleCheckout} // Your original Razorpay function!
                            disabled={cart.length === 0} 
                            className="modern-button" 
                            style={{ backgroundColor: cart.length === 0 ? '#374151' : '#2563EB', padding: '15px', fontSize: '16px', borderRadius: '8px' }}>
                            💳 PAY ONLINE (CARD) AND PRINT INVOICE
                        </button>
                    </div>
                </div>
                </div>
            </div>

        
    );
};

export default PointOfSale;

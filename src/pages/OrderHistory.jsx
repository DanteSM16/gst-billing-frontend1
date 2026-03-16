// src/pages/OrderHistory.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';

const OrderHistory = () => {
    const [viewType, setViewType] = useState('SALES'); 
    const [invoices, setInvoices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => { fetchHistory(); }, [viewType]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            let endpoint = viewType === 'SALES' ? '/history/sales' : viewType === 'PURCHASES' ? '/history/purchases' : '/history/settlements'; 
            const response = await api.get(endpoint);
            setInvoices(response.data);
        } catch (error) { console.error("Failed to fetch history"); } 
        finally { setLoading(false); }
    };

    const downloadPdf = async (invoiceId) => {
        try {
            const endpoint = viewType === 'SALES' ? `/reports/download-invoice/${invoiceId}` : `/reports/download-purchase/${invoiceId}`;
            const res = await api.get(endpoint, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url; link.setAttribute('download', `${viewType}_Invoice_${invoiceId}.pdf`);
            document.body.appendChild(link); link.click(); link.remove();
        } catch (err) { alert("PDF Download failed."); }
    };

    const filteredInvoices = invoices.filter(inv => {
        const search = searchTerm.toLowerCase();
        if (viewType === 'SETTLEMENTS') {
            return inv.transactionType?.toLowerCase().includes(search) || inv.id?.toString().includes(search);
        }
        return inv.id?.toString().includes(search) || (viewType === 'SALES' ? inv.customerName?.toLowerCase().includes(search) : inv.supplierName?.toLowerCase().includes(search));
    });

    return (
        <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ margin: 0, color: '#111827' }}>Audit Trail</h1>
                
                {/* SLEEK TOGGLE BUTTONS */}
                <div style={{ display: 'flex', backgroundColor: '#e5e7eb', padding: '4px', borderRadius: '8px' }}>
                    <button onClick={() => setViewType('SALES')}
                        style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                                 backgroundColor: viewType === 'SALES' ? 'white' : 'transparent', 
                                 boxShadow: viewType === 'SALES' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                        Sales
                    </button>
                    <button onClick={() => setViewType('PURCHASES')}
                        style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                                 backgroundColor: viewType === 'PURCHASES' ? 'white' : 'transparent', 
                                 boxShadow: viewType === 'PURCHASES' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                        Purchases
                    </button>
                    <button onClick={() => setViewType('SETTLEMENTS')}
                        style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                                 backgroundColor: viewType === 'SETTLEMENTS' ? 'white' : 'transparent', 
                                 boxShadow: viewType === 'SETTLEMENTS' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                        Settlements
                    </button>
                </div>
            </div>

            <div className="modern-card">
                <input 
                    type="text" 
                    placeholder={viewType === 'SETTLEMENTS' ? `🔍 Search by ID or Type...` : `🔍 Search by ID or Name...`} 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="modern-input"
                    style={{ width: '400px', marginBottom: '20px' }}
                />

                {loading ? <p style={{ textAlign: 'center', padding: '20px' }}>Loading data...</p> : (
                    <>
                        {viewType === 'SETTLEMENTS' ? (
                            <table className="modern-table">
                                <thead>
                                    <tr><th>ID</th><th>Date</th><th>Transaction Type</th><th>Component</th><th>Amount (₹)</th><th>Processed By</th></tr>
                                </thead>
                                <tbody>
                                    {filteredInvoices.map(entry => (
                                        <tr key={entry.id}>
                                            <td>#{entry.id}</td>
                                            <td>{new Date(entry.createdAt).toLocaleDateString('en-IN')}</td>
                                            <td><span style={{ backgroundColor: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{entry.transactionType} ({entry.type})</span></td>
                                            <td><strong>{entry.component}</strong></td>
                                            <td style={{ color: entry.amount < 0 ? '#DC2626' : '#059669', fontWeight: 'bold' }}>{entry.amount}</td>
                                            <td style={{ color: '#4B5563', fontStyle: 'italic' }}>{entry.createdBy || 'System'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Date</th>
                                        <th>{viewType === 'SALES' ? 'Customer Name' : 'Supplier Name'}</th>
                                        <th>GSTIN</th>
                                        <th>State</th>
                                        <th>Taxable Value</th>
                                        <th>Total Tax</th>
                                        <th>Processed By</th>
                                        <th style={{ textAlign: 'right' }}>Receipt</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredInvoices.map(inv => (
                                        <tr key={inv.id}>
                                            <td>#{inv.id}</td>
                                            <td style={{ color: '#6B7280', fontSize: '13px' }}>{new Date(inv.createdAt).toLocaleDateString('en-IN')}</td>
                                            <td><strong>{viewType === 'SALES' ? inv.customerName : inv.supplierName}</strong></td>
                                            <td style={{ fontFamily: 'monospace' }}>{viewType === 'SALES' ? (inv.customerGstin || 'B2C (Retail)') : inv.supplierGstin}</td>
                                            <td>{inv.stateCode}</td>
                                            <td>₹{inv.totalTaxable}</td>
                                            <td>₹{(inv.cgstTotal + inv.sgstTotal + inv.igstTotal).toFixed(2)}</td>
                                            <td style={{ color: '#4B5563', fontSize: '13px' }}>👤 {inv.createdBy || 'Unknown'}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button onClick={() => downloadPdf(inv.id)}
                                                    style={{ backgroundColor: '#2563EB', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                                                    Download PDF
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </>
                )}
                {filteredInvoices.length === 0 && !loading && <p style={{ textAlign: 'center', color: 'gray', padding: '20px' }}>No records found in this view.</p>}
            </div>
        </div>
    );
};

export default OrderHistory;
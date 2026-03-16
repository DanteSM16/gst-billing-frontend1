// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Dashboard = () => {
    const [gstData, setGstData] = useState(null); 
    const [stateCode, setStateCode] = useState('MH'); 
    const [settleYear, setSettleYear] = useState(new Date().getFullYear());
    const [settleMonth, setSettleMonth] = useState(new Date().getMonth() + 1); 
    const [message, setMessage] = useState({ text: '', type: '' });

    const fetchGstData = async () => {
        setMessage({ text: '', type: '' });
        try {
            const response = await api.get(`/gst/calculate?stateCode=${stateCode}`);
            setGstData(response.data);
        } catch (error) {
            setMessage({ text: "Failed to fetch GST data. Ensure State Code is valid.", type: "error" });
            setGstData(null);
        }
    };

    useEffect(() => { if (stateCode.length === 2) fetchGstData(); }, [stateCode]);

    const handleSettleMonth = async () => {
        if (!window.confirm(`Settle Month ${settleMonth}/${settleYear} for State ${stateCode}?`)) return;
        try {
            const response = await api.post(`/reports/settle?stateCode=${stateCode}&year=${settleYear}&month=${settleMonth}`);
            setMessage({ text: response.data, type: "success" });
            fetchGstData();
        } catch (error) { setMessage({ text: "Failed to settle the month.", type: "error" }); }
    };

    const downloadJsonReport = async (reportType) => {
        try {
            const response = await api.get(`/reports/${reportType}?stateCode=${stateCode}&year=${settleYear}&month=${settleMonth}`);
            const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: "application/json" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url; link.setAttribute('download', `${reportType}_${stateCode}_${settleMonth}_${settleYear}.json`);
            document.body.appendChild(link); link.click(); link.remove();
        } catch (error) { alert("Failed to download report."); }
    };

    return (
        <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ margin: 0, color: '#111827' }}>Tax & Financial Overview</h1>
                
                {/* State Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'white', padding: '10px 20px', borderRadius: '50px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <span style={{ fontWeight: '600', color: '#4B5563' }}>State Region:</span>
                    <input type="text" maxLength="2" value={stateCode} onChange={(e) => setStateCode(e.target.value.toUpperCase())} 
                           style={{ width: '40px', border: 'none', borderBottom: '2px solid #4F46E5', fontSize: '16px', fontWeight: 'bold', textAlign: 'center', outline: 'none' }} />
                    <button onClick={fetchGstData} style={{ background: 'none', border: 'none', color: '#4F46E5', cursor: 'pointer', fontWeight: 'bold' }}>↻</button>
                </div>
            </div>

            {message.text && <div style={{ padding: '15px', borderRadius: '8px', marginBottom: '20px', backgroundColor: message.type === 'error' ? '#FEE2E2' : '#D1FAE5', color: message.type === 'error' ? '#991B1B' : '#065F46', fontWeight: '500' }}>{message.text}</div>}

            {/* --- THE DARK ANALYTICS CARDS (From your PDF Reference!) --- */}
            {gstData ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '25px', marginBottom: '40px' }}>
                    
                    {/* CARD 1: INPUT CREDIT */}
                    <div style={{ backgroundColor: '#1E293B', color: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                            <div style={{ backgroundColor: '#059669', padding: '10px', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📉</div>
                            <h3 style={{ margin: 0, color: '#9CA3AF', fontWeight: '500' }}>Input Tax Credit (ITC)</h3>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '10px', marginBottom: '10px' }}><span>IGST:</span><strong>₹{gstData.totalInputIgst}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '10px', marginBottom: '10px' }}><span>CGST:</span><strong>₹{gstData.totalInputCgst}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>SGST:</span><strong>₹{gstData.totalInputSgst}</strong></div>
                    </div>

                    {/* CARD 2: OUTPUT LIABILITY */}
                    <div style={{ backgroundColor: '#1E293B', color: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                            <div style={{ backgroundColor: '#DC2626', padding: '10px', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📈</div>
                            <h3 style={{ margin: 0, color: '#9CA3AF', fontWeight: '500' }}>Output Liability</h3>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '10px', marginBottom: '10px' }}><span>IGST:</span><strong>₹{gstData.totalOutputIgst}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '10px', marginBottom: '10px' }}><span>CGST:</span><strong>₹{gstData.totalOutputCgst}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>SGST:</span><strong>₹{gstData.totalOutputSgst}</strong></div>
                    </div>

                    {/* CARD 3: NET PAYABLE */}
                    <div style={{ backgroundColor: '#1E293B', color: 'white', padding: '25px', borderRadius: '12px', border: '2px solid #F59E0B', boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                            <div style={{ backgroundColor: '#F59E0B', padding: '10px', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: 'black' }}>₹</div>
                            <h3 style={{ margin: 0, color: '#FCD34D', fontWeight: '600' }}>Final Net Payable</h3>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dotted #475569', paddingBottom: '10px', marginBottom: '10px' }}><span>IGST:</span><strong style={{ fontSize: '18px' }}>₹{gstData.netPayableIgst}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dotted #475569', paddingBottom: '10px', marginBottom: '10px' }}><span>CGST:</span><strong style={{ fontSize: '18px' }}>₹{gstData.netPayableCgst}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>SGST:</span><strong style={{ fontSize: '18px' }}>₹{gstData.netPayableSgst}</strong></div>
                    </div>

                </div>
            ) : <p>Loading Dashboard...</p>}

            {/* --- MONTHLY SETTLEMENT STRIP --- */}
            <div className="modern-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB' }}>
                <div>
                    <h3 style={{ margin: '0 0 5px 0' }}>GSTR-3B Period Settlement</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#6B7280' }}>Select a month to download JSON reports or lock the double-entry ledger.</p>
                </div>
                
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <select className="modern-input" style={{ width: '130px', margin: 0 }} value={settleMonth} onChange={(e) => setSettleMonth(parseInt(e.target.value))}>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>)}
                    </select>
                    <input type="number" className="modern-input" style={{ width: '80px', margin: 0 }} value={settleYear} onChange={(e) => setSettleYear(parseInt(e.target.value))} />
                    
                    <div style={{ height: '40px', width: '1px', backgroundColor: '#D1D5DB', margin: '0 10px' }}></div>
                    
                    <button onClick={() => downloadJsonReport('hsn-summary')} style={{ backgroundColor: 'white', border: '1px solid #D1D5DB', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>📥 HSN JSON</button>
                    <button onClick={() => downloadJsonReport('b2b-b2c')} style={{ backgroundColor: 'white', border: '1px solid #D1D5DB', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>📥 B2B JSON</button>
                    <button onClick={handleSettleMonth} style={{ backgroundColor: '#111827', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>🔒 SETTLE LEDGER</button>
                </div>
            </div>

        </div>
    );
};

export default Dashboard;
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { format } from "date-fns";
import { useCookies } from "react-cookie";
import { Toaster, toast } from "react-hot-toast";
import { 
  IndianRupee, TrendingUp, TrendingDown, Wallet, Plus, 
  Trash2, Filter, Download, ArrowRight, PieChart, ListOrdered 
} from "lucide-react";
import url from "../url";

const FinancialLedger = () => {
  const [cookies] = useCookies(["token"]);
  const [userId, setUserId] = useState(null);
  
  // State
  const [activeTab, setActiveTab] = useState("dashboard");
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, netProfit: 0 });
  const [loading, setLoading] = useState(true);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    transactionType: "expense",
    category: "seeds",
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    description: "",
    relatedCrop: ""
  });

  const expenseCategories = ["seeds", "fertilizer", "labor", "equipment", "pesticides", "other"];
  const incomeCategories = ["crop_sale", "subsidy", "other"];

  useEffect(() => {
    // Auth Check
    const verifyUser = async () => {
      if (!cookies.token) return;
      try {
        const { data } = await axios.post(`${url}/`, { tok: cookies.token }, { withCredentials: true });
        if (data.status) {
          setUserId(data.id);
          fetchData(data.id);
        }
      } catch (err) {
        console.error("Auth error", err);
      }
    };
    verifyUser();
  }, [cookies]);

  const fetchData = async (uId) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${url}/api/ledger?userId=${uId}`);
      if (data.success) {
        setTransactions(data.transactions);
        setSummary(data.summary);
      }
    } catch (err) {
      toast.error("Failed to load financial data");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      // Reset category if type changes
      if (name === "transactionType") {
        newData.category = value === "expense" ? "seeds" : "crop_sale";
      }
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || formData.amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    try {
      const { data } = await axios.post(`${url}/api/ledger`, {
        userId,
        ...formData
      });
      if (data.success) {
        toast.success("Transaction added successfully!");
        setShowForm(false);
        setFormData({ ...formData, amount: "", description: "", relatedCrop: "" });
        fetchData(userId);
      }
    } catch (err) {
      toast.error("Failed to add transaction");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;
    try {
      const { data } = await axios.delete(`${url}/api/ledger/${id}`);
      if (data.success) {
        toast.success("Transaction deleted");
        fetchData(userId);
      }
    } catch (err) {
      toast.error("Failed to delete transaction");
    }
  };

  // Group by category for visual charts
  const categoryData = useMemo(() => {
    const expenses = {};
    const incomes = {};
    let maxExp = 0, maxInc = 0;

    transactions.forEach(t => {
      if (t.transactionType === "expense") {
        expenses[t.category] = (expenses[t.category] || 0) + t.amount;
        if (expenses[t.category] > maxExp) maxExp = expenses[t.category];
      } else {
        incomes[t.category] = (incomes[t.category] || 0) + t.amount;
        if (incomes[t.category] > maxInc) maxInc = incomes[t.category];
      }
    });

    return { expenses, incomes, maxExp, maxInc };
  }, [transactions]);

  // Group by crop for visual charts
  const cropData = useMemo(() => {
    const crops = {};
    let maxProfit = 0;

    transactions.forEach(t => {
      if (!t.relatedCrop || t.relatedCrop.trim() === "") return; // Only process named crops
      const cropName = t.relatedCrop.trim();
      if (!crops[cropName]) {
        crops[cropName] = { income: 0, expense: 0, netProfit: 0 };
      }
      
      if (t.transactionType === "income") {
        crops[cropName].income += t.amount;
        crops[cropName].netProfit += t.amount;
      } else {
        crops[cropName].expense += t.amount;
        crops[cropName].netProfit -= t.amount;
      }

      if (crops[cropName].netProfit > maxProfit) maxProfit = crops[cropName].netProfit;
    });

    return { crops, maxProfit };
  }, [transactions]);

  // Styling Helpers
  const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amt);
  const getCatColor = (cat) => {
    const colors = { seeds: '#34d399', fertilizer: '#60a5fa', labor: '#fb923c', equipment: '#94a3b8', pesticides: '#f87171', crop_sale: '#10b981', subsidy: '#38bdf8', other: '#a78bfa' };
    return colors[cat] || '#cbd5e1';
  };
  const getCatLabel = (cat) => cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

  if (!userId) {
    return (
      <div className="dash-wrap" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading user credentials...</p>
      </div>
    );
  }

  return (
    <div className="dash-wrap">
      <Toaster position="top-center" />
      
      {/* SIDEBAR */}
      <div className="dash-sidebar">
        <div className="dash-sidebar-title">Ledger</div>
        <div 
          className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <PieChart size={18} /> <span style={{ marginLeft: '10px' }}>Dashboard</span>
        </div>
        <div 
          className={`sidebar-item ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <ListOrdered size={18} /> <span style={{ marginLeft: '10px' }}>All Transactions</span>
        </div>

        <div className="dash-sidebar-title" style={{ marginTop: '2rem' }}>Quick Actions</div>
        <button 
          className="btn-primary" 
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
          onClick={() => setShowForm(true)}
        >
          <Plus size={18} /> Log Transaction
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="dash-main">
        <div className="dash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center' }}>
              <Wallet className="sidebar-icon" style={{color: "var(--leaf)", marginRight: "10px"}} /> 
              Farm Profit Ledger
            </h2>
            <p>Track your ROI, crop sales, and daily farming expenses.</p>
          </div>
        </div>

        {loading ? (
          <p>Loading financial data...</p>
        ) : (
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

            {/* FINANCIAL SUMMARY CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              {/* Income Card */}
              <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', borderTop: '4px solid #10b981' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b' }}>
                  <span style={{ fontWeight: 600 }}>Total Income</span>
                  <TrendingUp color="#10b981" />
                </div>
                <h3 style={{ fontSize: '2rem', color: '#0f172a', margin: '10px 0 0 0' }}>{formatCurrency(summary.totalIncome)}</h3>
              </div>

              {/* Expense Card */}
              <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', borderTop: '4px solid #ef4444' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b' }}>
                  <span style={{ fontWeight: 600 }}>Total Expenses</span>
                  <TrendingDown color="#ef4444" />
                </div>
                <h3 style={{ fontSize: '2rem', color: '#0f172a', margin: '10px 0 0 0' }}>{formatCurrency(summary.totalExpense)}</h3>
              </div>

              {/* Net Profit Card */}
              <div style={{ backgroundColor: summary.netProfit >= 0 ? '#f0fdf4' : '#fef2f2', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: `1px solid ${summary.netProfit >= 0 ? '#bbf7d0' : '#fecaca'}`, borderTop: `4px solid ${summary.netProfit >= 0 ? '#22c55e' : '#f87171'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: summary.netProfit >= 0 ? '#166534' : '#991b1b' }}>
                  <span style={{ fontWeight: 600 }}>Net Profit</span>
                  <IndianRupee color={summary.netProfit >= 0 ? '#22c55e' : '#f87171'} />
                </div>
                <h3 style={{ fontSize: '2rem', color: summary.netProfit >= 0 ? '#15803d' : '#b91c1c', margin: '10px 0 0 0' }}>{formatCurrency(summary.netProfit)}</h3>
              </div>
            </div>

            {activeTab === 'dashboard' && (
              <div className="dash-grid2">
                {/* Expense Breakdown */}
                <div className="dash-card">
                  <div className="dash-card-title">Expense Breakdown</div>
                  {Object.keys(categoryData.expenses).length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No expense data available.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {Object.entries(categoryData.expenses).sort((a,b)=>b[1]-a[1]).map(([cat, val]) => (
                        <div key={cat}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.85rem' }}>
                            <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{getCatLabel(cat)}</span>
                            <span style={{ fontWeight: 600 }}>{formatCurrency(val)}</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${(val / categoryData.maxExp) * 100}%`, backgroundColor: getCatColor(cat), borderRadius: '4px' }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Income Breakdown */}
                <div className="dash-card">
                  <div className="dash-card-title">Income Sources</div>
                  {Object.keys(categoryData.incomes).length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No income data available.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {Object.entries(categoryData.incomes).sort((a,b)=>b[1]-a[1]).map(([cat, val]) => (
                        <div key={cat}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.85rem' }}>
                            <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{getCatLabel(cat)}</span>
                            <span style={{ fontWeight: 600 }}>{formatCurrency(val)}</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${(val / categoryData.maxInc) * 100}%`, backgroundColor: getCatColor(cat), borderRadius: '4px' }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'dashboard' && (
              <div className="dash-card" style={{ marginTop: '1.2rem' }}>
                <div className="dash-card-title">Crop Wise Profit Performance</div>
                {Object.keys(cropData.crops).length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No crop-specific data available. Be sure to fill out the 'Related Crop' field when adding transactions!</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
                    {Object.entries(cropData.crops).sort((a,b)=>b[1].netProfit-a[1].netProfit).map(([crop, data]) => (
                      <div key={crop} style={{ border: `1px solid ${data.netProfit >= 0 ? '#bbf7d0' : '#fecaca'}`, borderRadius: '10px', padding: '15px', backgroundColor: data.netProfit >= 0 ? '#f0fdf4' : '#fef2f2' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#0f172a', display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem' }}>
                          <span style={{ fontWeight: 600 }}>{crop}</span>
                          <span style={{ color: data.netProfit >= 0 ? '#15803d' : '#b91c1c' }}>{formatCurrency(data.netProfit)}</span>
                        </h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
                          <span>Income: <span style={{ color: '#10b981', fontWeight: 600 }}>{formatCurrency(data.income)}</span></span>
                          <span>Expense: <span style={{ color: '#ef4444', fontWeight: 600 }}>{formatCurrency(data.expense)}</span></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="dash-card">
                <div className="dash-card-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Transaction History</span>
                </div>
                
                <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                  {transactions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px dashed #d1d5db' }}>
                      <p style={{ color: 'var(--text-muted)', margin: 0 }}>No transactions logged yet.</p>
                      <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowForm(true)}>Log your first entry</button>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', color: '#64748b' }}>
                          <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', borderTopLeftRadius: '8px', borderBottom: '1px solid #e2e8f0' }}>Date</th>
                          <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', borderBottom: '1px solid #e2e8f0' }}>Description & Crop</th>
                          <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', borderBottom: '1px solid #e2e8f0' }}>Category</th>
                          <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Amount</th>
                          <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', borderTopRightRadius: '8px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map(t => (
                          <tr key={t._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s', ':hover': { backgroundColor: '#f8fafc' } }}>
                            <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.85rem' }}>
                              {format(new Date(t.date), "MMM dd, yyyy")}
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ fontWeight: 500, color: '#1e293b', fontSize: '0.9rem' }}>{t.description || "No description"}</div>
                              {t.relatedCrop && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>Crop: {t.relatedCrop}</div>}
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: `${getCatColor(t.category)}20`, color: getCatColor(t.category) }}>
                                {getCatLabel(t.category)}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600, color: t.transactionType === 'income' ? '#10b981' : '#ef4444' }}>
                              {t.transactionType === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                            </td>
                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              <button
                                onClick={() => handleDelete(t._id)}
                                style={{ backgroundColor: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px' }}
                                title="Delete Record"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* TRANSACTION MODAL */}
            {showForm && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '90%', maxWidth: '500px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, color: 'var(--forest)', fontFamily: 'var(--ff-head)' }}>Log Transaction</h3>
                    <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                      <div 
                        onClick={() => handleInputChange({target: {name: 'transactionType', value: 'expense'}})}
                        style={{ padding: '12px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', border: `2px solid ${formData.transactionType === 'expense' ? '#ef4444' : '#e2e8f0'}`, backgroundColor: formData.transactionType === 'expense' ? '#fef2f2' : '#fff' }}
                      >
                        <TrendingDown color={formData.transactionType === 'expense' ? '#ef4444' : '#94a3b8'} style={{ marginBottom: '5px' }} />
                        <div style={{ fontWeight: 600, color: formData.transactionType === 'expense' ? '#b91c1c' : '#64748b' }}>Expense</div>
                      </div>
                      <div 
                        onClick={() => handleInputChange({target: {name: 'transactionType', value: 'income'}})}
                        style={{ padding: '12px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', border: `2px solid ${formData.transactionType === 'income' ? '#10b981' : '#e2e8f0'}`, backgroundColor: formData.transactionType === 'income' ? '#f0fdf4' : '#fff' }}
                      >
                        <TrendingUp color={formData.transactionType === 'income' ? '#10b981' : '#94a3b8'} style={{ marginBottom: '5px' }} />
                        <div style={{ fontWeight: 600, color: formData.transactionType === 'income' ? '#15803d' : '#64748b' }}>Income</div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Amount (₹)</label>
                      <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem' }} placeholder="e.g. 5000" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Category</label>
                        <select name="category" value={formData.category} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', backgroundColor: '#fff' }}>
                          {(formData.transactionType === 'expense' ? expenseCategories : incomeCategories).map(c => (
                            <option key={c} value={c}>{getCatLabel(c)}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Date</label>
                        <input type="date" name="date" value={formData.date} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                      </div>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Related Crop (Optional)</label>
                      <input type="text" name="relatedCrop" value={formData.relatedCrop} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} placeholder="e.g. Wheat Kharif 2026" />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Short Description</label>
                      <input type="text" name="description" value={formData.description} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} placeholder="e.g. Purchased 2 bags of Urea" />
                    </div>

                    <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: '1rem' }}>
                      Save {formData.transactionType === 'expense' ? 'Expense' : 'Income'}
                    </button>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialLedger;

import React, { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import { Toaster, toast } from "react-hot-toast";
import { 
  BarChart3, IndianRupee, MapPin, 
  TrendingUp, TrendingDown, RefreshCcw, Search, Minus, Newspaper
} from "lucide-react";
import url from "../url";

const MarketPrices = () => {
  const [activeTab, setActiveTab] = useState("prices");
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  
  // Market filters
  const [marketsDict, setMarketsDict] = useState({});
  const [statesList, setStatesList] = useState([]);
  
  const [selectedState, setSelectedState] = useState("");
  const [selectedMarket, setSelectedMarket] = useState("");
  
  // API Data
  const [pricingData, setPricingData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState("");
  
  // UI preferences
  const [isKg, setIsKg] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Trends Data
  const [trends, setTrends] = useState([]);

  // 1. Fetch available markets on mount
  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const { data } = await axios.get(`${url}/api/market/states`);
        if (data.success) {
          setMarketsDict(data.markets);
          const states = Object.keys(data.markets);
          setStatesList(states);
          
          if (states.length > 0) {
            setSelectedState(states[0]);
            setSelectedMarket(data.markets[states[0]][0]);
          }
        }
      } catch (err) {
        toast.error("Failed to load market regions.");
      } finally {
        setLoading(false);
      }
    };
    
    const fetchTrends = async () => {
      try {
        const { data } = await axios.get(`${url}/api/admin/trends/all`);
        // We fallback to /trends/all since some old code uses it, but we use consistent admin URL if possible, wait, let's use the Home.jsx url
      } catch (e) {} // Let's use the exact URL from Home.jsx below
    };
    
    const initialize = async () => {
      await fetchMarkets();
      try {
        const { data } = await axios.get(`${url}/trends/all`);
        if (data.success) setTrends(data.trends);
      } catch (err) {}
    };
    
    initialize();
  }, []);

  // 2. Fetch prices when state/market changes
  useEffect(() => {
    if (!selectedState || !selectedMarket) return;
    
    const fetchPrices = async () => {
      setDataLoading(true);
      try {
        const { data } = await axios.get(`${url}/api/market/prices`, {
          params: { state: selectedState, market: selectedMarket }
        });
        
        if (data.success) {
          setPricingData(data.data);
          setLastUpdated(data.date);
        }
      } catch (err) {
        toast.error("Failed to fetch live prices.");
      } finally {
        setDataLoading(false);
      }
    };
    
    fetchPrices();
  }, [selectedState, selectedMarket]);

  // Handle unit conversion
  const formatPrice = (priceQuintal) => {
    const value = isKg ? priceQuintal / 100 : priceQuintal;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  };

  const currentUnit = isKg ? "/ Kg" : "/ Qtl";

  const getTrendIcon = (trend) => {
    if (trend === "up") return <TrendingUp color="#10b981" size={16} />;
    if (trend === "down") return <TrendingDown color="#ef4444" size={16} />;
    return <Minus color="#94a3b8" size={16} />;
  };

  const getCategoryClass = (category) => {
    switch(category?.toLowerCase()) {
      case 'risk': return 'pill-red';
      case 'opportunity': return 'pill-green';
      case 'neutral': return 'pill-blue';
      default: return 'pill-amber';
    }
  };

  const getFilteredData = () => {
    return pricingData
      .filter(item => item.commodity.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => b.modal_price - a.modal_price); // Highest price first
  };

  if (loading) {
    return (
      <div className="dash-wrap" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Initializing Market Feeds...</p>
      </div>
    );
  }

  return (
    <div className="dash-wrap">
      <Toaster position="top-center" />
      
      {/* LEFT SIDEBAR (Controls) */}
      <div className="dash-sidebar" style={{ width: '280px', padding: '1.5rem', backgroundColor: '#fff', borderRight: '1px solid rgba(74,222,128,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, var(--leaf), var(--forest))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <BarChart3 size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--forest)', fontFamily: 'var(--ff-head)' }}>Market Hub</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Prices & Intelligence</span>
          </div>
        </div>

        <div 
          className="sidebar-item" 
          style={{ background: activeTab === 'prices' ? '#f0fdf4' : 'transparent', color: activeTab === 'prices' ? 'var(--forest)' : 'var(--text-muted)', fontWeight: activeTab === 'prices' ? '600' : '500', borderLeft: activeTab === 'prices' ? '3px solid var(--leaf)' : '3px solid transparent' }}
          onClick={() => setActiveTab('prices')}
        >
          <BarChart3 size={18} /> Live Prices
        </div>
        <div 
          className="sidebar-item" 
          style={{ background: activeTab === 'trends' ? '#f0fdf4' : 'transparent', color: activeTab === 'trends' ? 'var(--forest)' : 'var(--text-muted)', fontWeight: activeTab === 'trends' ? '600' : '500', borderLeft: activeTab === 'trends' ? '3px solid var(--leaf)' : '3px solid transparent', marginBottom: '2rem' }}
          onClick={() => setActiveTab('trends')}
        >
          <Newspaper size={18} /> Market News
        </div>

        {activeTab === 'prices' && (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                State
              </label>
          <select 
            value={selectedState} 
            onChange={(e) => {
              const st = e.target.value;
              setSelectedState(st);
              setSelectedMarket(marketsDict[st][0]);
            }}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', backgroundColor: '#f8fafc' }}
          >
            {statesList.map(st => <option key={st} value={st}>{st}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
            APMC / Mandi
          </label>
          <select 
            value={selectedMarket} 
            onChange={(e) => setSelectedMarket(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', backgroundColor: '#f8fafc' }}
          >
            {(marketsDict[selectedState] || []).map(mk => <option key={mk} value={mk}>{mk} Market</option>)}
          </select>
        </div>

        <div style={{ padding: '15px', backgroundColor: 'var(--mint-light)', borderRadius: '12px', border: '1px solid rgba(74,222,128,0.2)' }}>
          <h4 style={{ fontSize: '0.8rem', color: 'var(--forest)', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Unit Toggle</h4>
          <div style={{ display: 'flex', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <button 
              onClick={() => setIsKg(false)}
              style={{ flex: 1, padding: '8px', border: 'none', background: !isKg ? 'var(--forest)' : '#fff', color: !isKg ? '#fff' : '#64748b', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: '0.2s' }}
            >
              Quintal (Qtl)
            </button>
            <button 
              onClick={() => setIsKg(true)}
              style={{ flex: 1, padding: '8px', border: 'none', background: isKg ? 'var(--forest)' : '#fff', color: isKg ? '#fff' : '#64748b', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: '0.2s' }}
            >
              Kilogram (Kg)
            </button>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '10px 0 0 0', lineHeight: 1.4 }}>1 Quintal = 100 Kilograms.</p>
        </div>
          </>
        )}
      </div>

      {/* MAIN CONTENT */}
      <div className="dash-main" style={{ padding: '2rem' }}>
        {activeTab === 'prices' ? (
          <>
            <div className="dash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.8rem', margin: 0, color: 'var(--forest)', fontFamily: 'var(--ff-head)' }}>
                  Market Prices: {selectedMarket}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={14} /> {selectedState}, India
              </span>
              <span style={{ fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>
                Live Feed • {lastUpdated}
              </span>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '12px' }} />
            <input 
              type="text" 
              placeholder="Search commodity (e.g. Wheat)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '10px 10px 10px 38px', borderRadius: '20px', border: '1px solid #cbd5e1', width: '250px', outline: 'none', fontSize: '0.9rem' }}
            />
          </div>
        </div>

        {dataLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '15px' }}>
            <RefreshCcw size={32} color="var(--leaf)" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Syncing live Mandi rates...</p>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <div style={{ animation: 'fadeInUp 0.4s' }}>
            {/* Top Trending Commodities Highlights */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px', marginBottom: '2rem' }}>
              {getFilteredData().slice(0, 3).map((item, idx) => (
                <div key={idx} style={{ backgroundColor: '#fff', padding: '1.2rem', borderRadius: '14px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid var(--card-border)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: item.trend === 'up' ? '#10b981' : item.trend === 'down' ? '#ef4444' : '#94a3b8' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: 'var(--text-main)', fontSize: '1rem', fontWeight: 700 }}>{item.commodity}</h4>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Modal Price</div>
                    </div>
                    <div style={{ padding: '4px', backgroundColor: item.trend === 'up' ? '#dcfce7' : item.trend === 'down' ? '#fee2e2' : '#f1f5f9', borderRadius: '6px' }}>
                      {getTrendIcon(item.trend)}
                    </div>
                  </div>
                  <div style={{ marginTop: '15px', display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                    <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--forest)' }}>{formatPrice(item.modal_price)}</span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>{currentUnit}</span>
                  </div>
                  {item.trend !== 'stable' && (
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: item.trend === 'up' ? '#10b981' : '#ef4444', marginTop: '5px' }}>
                      {item.trend === 'up' ? '▲' : '▼'} {formatPrice(item.change)} {currentUnit} since yesterday
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Comprehensive Data Table */}
            <div className="dash-card">
              <div className="dash-card-title">Complete Market Report</div>
              {getFilteredData().length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No commodities found matching your search.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Commodity</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Min Price</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Max Price</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Modal (Avg) Price</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'center' }}>Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredData().map((item, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', transition: '0.2s' }}>
                          <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1e293b' }}>
                            {item.commodity}
                          </td>
                          <td style={{ padding: '14px 16px', color: '#64748b' }}>
                            {formatPrice(item.min_price)} <span style={{fontSize: '0.7rem'}}>{currentUnit}</span>
                          </td>
                          <td style={{ padding: '14px 16px', color: '#64748b' }}>
                            {formatPrice(item.max_price)} <span style={{fontSize: '0.7rem'}}>{currentUnit}</span>
                          </td>
                          <td style={{ padding: '14px 16px', color: 'var(--leaf)', fontWeight: 700 }}>
                            {formatPrice(item.modal_price)} <span style={{fontSize: '0.7rem'}}>{currentUnit}</span>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <span style={{ 
                              display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                              backgroundColor: item.trend === 'up' ? '#dcfce7' : item.trend === 'down' ? '#fee2e2' : '#f1f5f9',
                              color: item.trend === 'up' ? '#166534' : item.trend === 'down' ? '#991b1b' : '#334155'
                            }}>
                              {getTrendIcon(item.trend)} 
                              {item.trend === 'up' ? 'Rising' : item.trend === 'down' ? 'Falling' : 'Stable'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
                  * Data provided is a robust mathematical simulation of real wholesale APMC Mandi trends for educational and tracking purposes.
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ animation: 'fadeInUp 0.4s' }}>
            <div className="dash-header">
              <h2 style={{ fontSize: '1.8rem', margin: 0, color: 'var(--forest)', fontFamily: 'var(--ff-head)', marginBottom: '5px' }}>
                Latest Market Trends & Intelligence
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>Stay updated with breaking commodity news, policy drops, and market risk analysis.</p>
            </div>

            {trends.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No recent trends available.</p>
            ) : (
              <div style={{ marginTop: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  {trends.map(trend => (
                    <div key={trend._id} className="dash-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                      <div style={{ height: '180px', overflow: 'hidden' }}>
                        <img 
                          src={trend.image} 
                          alt={trend.title} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100%' height='100%' fill='#f1f5f9'/></svg>" }}
                        />
                      </div>
                      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <span className={`pill ${getCategoryClass(trend.category)}`}>{trend.category}</span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{new Date(trend.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: 'var(--forest)', fontFamily: 'var(--ff-head)', lineHeight: 1.3 }}>
                          {trend.title}
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, flex: 1 }}>
                          {trend.description.length > 150 ? trend.description.substring(0, 150) + "..." : trend.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketPrices;

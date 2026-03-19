import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Sprout, Wheat, Droplets, ArrowLeft, Trash2 } from "lucide-react";
import url from "../url";

const ParticularUserData = () => {
  const userId = Cookies.get("id");
  const userName = Cookies.get("username") || "Farmer";
  const navigate = useNavigate();

  const [soilData, setSoilData] = useState([]);
  const [yieldData, setYieldData] = useState([]);
  const [fertilizerData, setFertilizerData] = useState([]);
  const [loading, setLoading] = useState(true);

  const colors = {
    primaryGreen: "#6A8E23",
    deepGreen: "#4A6317",
    creamBg: "#F9F8F3",
    textDark: "#2C3322",
    white: "#ffffff",
    lightGreen: "#F0F4E8"
  };

  useEffect(() => {
    const fetchAllData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const [soilRes, yieldRes, fertRes] = await Promise.all([
          axios.get(`${url}/get-form/${userId}`).catch(() => ({ data: [] })),
          axios.get(`${url}/api/yield/${userId}`).catch(() => ({ data: [] })),
          axios.get(`${url}/api/fertilizer/${userId}`).catch(() => ({ data: [] }))
        ]);

        const formatData = (res) => {
          const data = Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []);
          return data.sort((a, b) => new Date(b.createdAt || b.Timestamp) - new Date(a.createdAt || a.Timestamp));
        };

        setSoilData(formatData(soilRes));
        setYieldData(formatData(yieldRes));
        setFertilizerData(formatData(fertRes));

      } catch (error) {
        console.error("Critical error in fetchAllData:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [userId]);

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  // Helper to safely render prediction (handles String vs Object)
  const getPredVal = (val) => {
    if (!val) return "N/A";
    if (typeof val === 'object') {
      return val.recommended_crop || val.recommended_fertilizer || "N/A";
    }
    return val;
  };

  const deleteRecord = async (id, type) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    try {
      if (type === 'crop') {
        await axios.delete(`${url}/delete-form/${id}`);
        setSoilData(prev => prev.filter(item => item._id !== id));
      } else if (type === 'yield') {
        await axios.delete(`${url}/api/yield/${id}`);
        setYieldData(prev => prev.filter(item => item._id !== id));
      } else if (type === 'fertilizer') {
        await axios.delete(`${url}/api/fertilizer/${id}`);
        setFertilizerData(prev => prev.filter(item => item._id !== id));
      }
      // Optional: Add a toast notification here
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete record. Please try again.");
    }
  };

  const [activeTab, setActiveTab] = useState('crop');

  if (loading) return (
    <div className="dash-wrap" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
        <div className="spinner-border text-success" role="status" style={{ width: '3rem', height: '3rem' }}></div>
        <h4 style={{ color: 'var(--forest)', fontFamily: 'var(--ff-head)' }}>Loading your insights...</h4>
      </div>
    </div>
  );

  const getTableData = () => {
    switch (activeTab) {
      case 'crop': return soilData;
      case 'yield': return yieldData;
      case 'fertilizer': return fertilizerData;
      default: return [];
    }
  };

  const activeData = getTableData();

  return (
    <div className="dash-wrap">
      {/* DASHBOARD SIDEBAR */}
      <div className="dash-sidebar">
        <div className="dash-sidebar-title">Insight Hub</div>
        
        <div 
          className={`sidebar-item ${activeTab === 'crop' ? 'active' : ''}`}
          onClick={() => setActiveTab('crop')}
        >
          <span style={{ marginRight: '10px' }}>🌱</span> Crop History
        </div>
        
        <div 
          className={`sidebar-item ${activeTab === 'yield' ? 'active' : ''}`}
          onClick={() => setActiveTab('yield')}
        >
          <span style={{ marginRight: '10px' }}>🌾</span> Yield History
        </div>
        
        <div 
          className={`sidebar-item ${activeTab === 'fertilizer' ? 'active' : ''}`}
          onClick={() => setActiveTab('fertilizer')}
        >
          <span style={{ marginRight: '10px' }}>💧</span> Fertilizer History
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
          <button 
            onClick={() => navigate("/Landing")}
            className="btn-secondary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
          >
            <ArrowLeft size={18} /> Back to Dashboard
          </button>
        </div>
      </div>

      {/* DASHBOARD MAIN */}
      <div className="dash-main">
        {/* Header */}
        <div className="dash-header">
          <h2 style={{ display: 'flex', alignItems: 'center' }}>
            <LayoutDashboard className="sidebar-icon" style={{color: "var(--leaf)", marginRight: "10px"}} /> 
            {userName}'s Data Insights
          </h2>
          <p>Reviewing your historical data helps in making better decisions for the future.</p>
        </div>

        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div className="dash-card">
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
               <h3 style={{ fontFamily: 'var(--ff-head)', color: 'var(--forest)', fontSize: '1.4rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {activeTab === 'crop' && <><Sprout color="var(--leaf)" /> Crop Recommendations</>}
                  {activeTab === 'yield' && <><Wheat color="#0D6EFD" /> Yield Predictions</>}
                  {activeTab === 'fertilizer' && <><Droplets color="#FFC107" /> Fertilizer Recommendations</>}
               </h3>
               {activeData.length > 0 && (
                 <span style={{ backgroundColor: 'var(--mint)', color: 'var(--forest)', padding: '6px 14px', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(74,222,128,0.3)' }}>
                    {activeTab === 'crop' ? `Latest: ${getPredVal(activeData[0].Prediction)}` : 
                     activeTab === 'yield' ? `Latest: ${activeData[0].PredictedYield}` : 
                     `Latest: ${getPredVal(activeData[0].RecommendedFertilizer)}`}
                 </span>
               )}
             </div>

             {/* Latest Result Highlight Block */}
             {activeData.length > 0 && (
               <div style={{ backgroundColor: 'var(--mint-light)', padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid var(--leaf)', marginBottom: '2rem' }}>
                 <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: 600 }}>Most Recent Result ({formatDateTime(activeData[0].createdAt || activeData[0].Timestamp)})</p>
                 <h4 style={{ fontFamily: 'var(--ff-head)', fontSize: '1.8rem', color: 'var(--forest)', fontWeight: 700, margin: 0 }}>
                    {activeTab === 'crop' ? getPredVal(activeData[0].Prediction) : 
                     activeTab === 'yield' ? <>{activeData[0].PredictedYield} <span style={{fontSize: '1rem', color: 'var(--text-muted)'}}>for {activeData[0].Crop}</span></> : 
                     getPredVal(activeData[0].RecommendedFertilizer)}
                 </h4>
                 {activeTab === 'crop' && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      <strong>Inputs:</strong> N: {activeData[0].Nitrogen} | P: {activeData[0].Phosphorus} | K: {activeData[0].Potassium} | pH: {activeData[0].pH}
                    </div>
                 )}
                 {activeTab === 'fertilizer' && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      Optimized for: <strong>{activeData[0].Crop}</strong> in {activeData[0].SoilType} soil.
                    </div>
                 )}
               </div>
             )}

             {/* History Table */}
             <div style={{ overflowX: 'auto' }}>
               {activeData.length > 1 ? (
                 <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                   <thead>
                     <tr style={{ backgroundColor: 'var(--forest)', color: 'white' }}>
                       <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.9rem', borderTopLeftRadius: '8px' }}>
                         {activeTab === 'crop' ? 'Crop' : activeTab === 'yield' ? 'Crop' : 'Fertilizer'}
                       </th>
                       <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.9rem' }}>
                         {activeTab === 'crop' ? 'N-P-K' : activeTab === 'yield' ? 'Yield' : 'Crop'}
                       </th>
                       <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.9rem' }}>Date</th>
                       <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.9rem', borderTopRightRadius: '8px', textAlign: 'center' }}>Action</th>
                     </tr>
                   </thead>
                   <tbody>
                     {activeData.slice(1).map((item, index) => (
                       <tr key={item._id || index} style={{ borderBottom: '1px solid rgba(74,222,128,0.2)', transition: 'background-color 0.2s', ':hover': { backgroundColor: 'var(--mint-faint)' } }}>
                         <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--leaf)', borderLeft: '1px solid rgba(74,222,128,0.2)' }}>
                            {activeTab === 'crop' ? getPredVal(item.Prediction) : 
                             activeTab === 'yield' ? item.Crop : 
                             getPredVal(item.RecommendedFertilizer)}
                         </td>
                         <td style={{ padding: '14px 16px', color: 'var(--text-main)' }}>
                            {activeTab === 'crop' ? `${item.Nitrogen}-${item.Phosphorus}-${item.Potassium}` : 
                             activeTab === 'yield' ? <strong style={{color: '#0D6EFD'}}>{item.PredictedYield}</strong> : 
                             item.Crop}
                         </td>
                         <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                           {formatDateTime(item.createdAt || item.Timestamp)}
                         </td>
                         <td style={{ padding: '14px 16px', textAlign: 'center', borderRight: '1px solid rgba(74,222,128,0.2)' }}>
                           <button
                             onClick={() => deleteRecord(item._id, activeTab)}
                             style={{ backgroundColor: 'transparent', border: 'none', color: '#e53935', cursor: 'pointer', padding: '6px' }}
                             title="Delete Record"
                           >
                             <Trash2 size={18} />
                           </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               ) : (
                 <div style={{ textAlign: 'center', padding: '3rem 1rem', backgroundColor: 'var(--mint-faint)', borderRadius: '8px', border: '1px dashed var(--leaf)' }}>
                   <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.1rem' }}>No historical records available yet.</p>
                 </div>
               )}
             </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticularUserData;
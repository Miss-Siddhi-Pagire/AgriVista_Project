import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Sprout, Wheat, Droplets, ArrowLeft, Trash2, CalendarDays, MessageSquare, ThumbsUp, Layers } from "lucide-react";
import url from "../url";

const ParticularUserData = () => {
  const userId = Cookies.get("id");
  const userName = Cookies.get("username") || "Farmer";
  const navigate = useNavigate();

  // Prediction Data
  const [soilData, setSoilData] = useState([]);
  const [yieldData, setYieldData] = useState([]);
  const [fertilizerData, setFertilizerData] = useState([]);
  
  // App Data
  const [seasonPlannerData, setSeasonPlannerData] = useState([]);
  
  // Community Data
  const [postsData, setPostsData] = useState([]);
  const [commentsData, setCommentsData] = useState([]);
  const [likesData, setLikesData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchAllData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const [soilRes, yieldRes, fertRes, interactRes] = await Promise.all([
          axios.get(`${url}/get-form/${userId}`).catch(() => ({ data: [] })),
          axios.get(`${url}/api/yield/${userId}`).catch(() => ({ data: [] })),
          axios.get(`${url}/api/fertilizer/${userId}`).catch(() => ({ data: [] })),
          axios.get(`${url}/user-interactions/${userId}`).catch(() => ({ data: { posts: [], comments: [], likedPosts: [] } }))
        ]);

        const formatData = (res) => {
          const data = Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []);
          return data.sort((a, b) => new Date(b.createdAt || b.Timestamp || b.timestamp) - new Date(a.createdAt || a.Timestamp || a.timestamp));
        };

        setSoilData(formatData(soilRes));
        setYieldData(formatData(yieldRes));
        setFertilizerData(formatData(fertRes));

        if (interactRes.data && interactRes.data.success) {
          setPostsData(interactRes.data.posts || []);
          setCommentsData(interactRes.data.comments || []);
          setLikesData(interactRes.data.likedPosts || []);
        }

        // Fetch LocalStorage Season Plans
        const localPlans = JSON.parse(localStorage.getItem('seasonPlans') || '[]');
        setSeasonPlannerData(localPlans.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)));

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
      } else if (type === 'planner') {
        const filtered = seasonPlannerData.filter(p => p.id !== id);
        localStorage.setItem('seasonPlans', JSON.stringify(filtered));
        setSeasonPlannerData(filtered);
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete record. Please try again.");
    }
  };

  if (loading) return (
    <div className="dash-wrap" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
        <div className="spinner-border text-success" role="status" style={{ width: '3rem', height: '3rem' }}></div>
        <h4 style={{ color: 'var(--forest)', fontFamily: 'var(--ff-head)' }}>Loading your insights...</h4>
      </div>
    </div>
  );

  const getActiveTabInfo = () => {
    switch (activeTab) {
      case 'overview': return { data: [], title: 'Dashboard Overview', icon: <LayoutDashboard color="var(--forest)" /> };
      case 'crop': return { data: soilData, title: 'Crop Predictions', icon: <Sprout color="var(--leaf)" /> };
      case 'yield': return { data: yieldData, title: 'Yield Predictions', icon: <Wheat color="#0D6EFD" /> };
      case 'fertilizer': return { data: fertilizerData, title: 'Fertilizer Advice', icon: <Droplets color="#FFC107" /> };
      case 'planner': return { data: seasonPlannerData, title: 'Season Plans', icon: <CalendarDays color="var(--forest)" /> };
      case 'posts': return { data: postsData, title: 'My Forum Posts', icon: <MessageSquare color="var(--leaf)" /> };
      case 'comments': return { data: commentsData, title: 'My Comments', icon: <Layers color="var(--mint-dark)" /> };
      case 'likes': return { data: likesData, title: 'Liked Posts', icon: <ThumbsUp color="#0D6EFD" /> };
      default: return { data: [], title: '', icon: null };
    }
  };

  const { data: activeData, title, icon } = getActiveTabInfo();

  return (
    <div className="dash-wrap">
      {/* SIDEBAR */}
      <div className="dash-sidebar">
        <div className="dash-sidebar-title">Main</div>
        <div className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          <LayoutDashboard size={18} /> <span style={{ marginLeft: '10px' }}>Overview</span>
        </div>

        <div className="dash-sidebar-title" style={{ marginTop: '1.5rem' }}>Predictions</div>
        <div className={`sidebar-item ${activeTab === 'crop' ? 'active' : ''}`} onClick={() => setActiveTab('crop')}>
          <Sprout size={18} /> <span style={{ marginLeft: '10px' }}>Crop History</span>
        </div>
        <div className={`sidebar-item ${activeTab === 'yield' ? 'active' : ''}`} onClick={() => setActiveTab('yield')}>
          <Wheat size={18} /> <span style={{ marginLeft: '10px' }}>Yield History</span>
        </div>
        <div className={`sidebar-item ${activeTab === 'fertilizer' ? 'active' : ''}`} onClick={() => setActiveTab('fertilizer')}>
          <Droplets size={18} /> <span style={{ marginLeft: '10px' }}>Fertilizer History</span>
        </div>

        <div className="dash-sidebar-title" style={{ marginTop: '1.5rem' }}>Planning</div>
        <div className={`sidebar-item ${activeTab === 'planner' ? 'active' : ''}`} onClick={() => setActiveTab('planner')}>
          <CalendarDays size={18} /> <span style={{ marginLeft: '10px' }}>Season Planner</span>
        </div>

        <div className="dash-sidebar-title" style={{ marginTop: '1.5rem' }}>Community</div>
        <div className={`sidebar-item ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
          <MessageSquare size={18} /> <span style={{ marginLeft: '10px' }}>My Posts ({postsData.length})</span>
        </div>
        <div className={`sidebar-item ${activeTab === 'comments' ? 'active' : ''}`} onClick={() => setActiveTab('comments')}>
          <Layers size={18} /> <span style={{ marginLeft: '10px' }}>My Comments ({commentsData.length})</span>
        </div>
        <div className={`sidebar-item ${activeTab === 'likes' ? 'active' : ''}`} onClick={() => setActiveTab('likes')}>
          <ThumbsUp size={18} /> <span style={{ marginLeft: '10px' }}>Liked Posts ({likesData.length})</span>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
          <button onClick={() => navigate("/Landing")} className="btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}>
            <ArrowLeft size={18} /> Dashboard
          </button>
        </div>
      </div>

      {/* MAIN VIEW */}
      <div className="dash-main">
        <div className="dash-header">
          <h2 style={{ display: 'flex', alignItems: 'center' }}>
            <LayoutDashboard className="sidebar-icon" style={{color: "var(--leaf)", marginRight: "10px"}} /> 
            {userName}'s Data Insights
          </h2>
          <p>Reviewing all your historical platform data seamlessly integrated in one place.</p>
        </div>

        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div className="dash-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'var(--ff-head)', color: 'var(--forest)', fontSize: '1.4rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                {icon} {title}
              </h3>
            </div>

            {/* Content Rendering based on Type */}
            {activeTab === 'overview' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '2rem' }}>
                  <div style={{ backgroundColor: 'var(--mint-light)', borderLeft: '4px solid var(--leaf)', padding: '20px', borderRadius: '12px' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Predictions</p>
                    <h2 style={{ margin: '5px 0 0 0', fontSize: '2rem', color: 'var(--forest)' }}>{soilData.length + yieldData.length + fertilizerData.length}</h2>
                  </div>
                  <div style={{ backgroundColor: 'var(--mint-light)', borderLeft: '4px solid var(--forest)', padding: '20px', borderRadius: '12px' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Season Plans Created</p>
                    <h2 style={{ margin: '5px 0 0 0', fontSize: '2rem', color: 'var(--forest)' }}>{seasonPlannerData.length}</h2>
                  </div>
                  <div style={{ backgroundColor: '#e3f2fd', borderLeft: '4px solid #1976d2', padding: '20px', borderRadius: '12px' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Forum Interactions</p>
                    <h2 style={{ margin: '5px 0 0 0', fontSize: '2rem', color: '#1976d2' }}>{postsData.length + commentsData.length + likesData.length}</h2>
                  </div>
                </div>

                <h4 style={{ color: 'var(--forest)', fontSize: '1.2rem', marginBottom: '1rem' }}>Recent Platform Activity</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Combine all data and sort by latest */}
                  {[
                    ...soilData.map(d => ({ ...d, label: 'Crop Prediction', icon: '🌱' })),
                    ...yieldData.map(d => ({ ...d, label: 'Yield Prediction', icon: '🌾' })),
                    ...fertilizerData.map(d => ({ ...d, label: 'Fertilizer Advice', icon: '💧' })),
                    ...seasonPlannerData.map(d => ({ ...d, createdAt: d.timestamp, label: 'Season Plan', icon: '📅' })),
                    ...postsData.map(d => ({ ...d, label: 'New Forum Post', icon: '💬' }))
                  ]
                  .sort((a, b) => new Date(b.createdAt || b.Timestamp) - new Date(a.createdAt || a.Timestamp))
                  .slice(0, 5)
                  .map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', border: '1px solid #eee', padding: '12px 15px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '1.5rem', marginRight: '15px' }}>{item.icon}</span>
                      <div style={{ flex: 1 }}>
                        <h5 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)' }}>
                          {item.label}: {' '}
                          <span style={{ fontWeight: 'normal', color: 'var(--text-muted)' }}>
                            {item.label === 'New Forum Post' ? item.heading : 
                             item.label === 'Season Plan' ? item.selectedCrop : 
                             item.label === 'Yield Prediction' ? item.Crop : 
                             getPredVal(item.Prediction || item.RecommendedFertilizer)}
                          </span>
                        </h5>
                        <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {formatDateTime(item.createdAt || item.Timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {soilData.length === 0 && yieldData.length === 0 && postsData.length === 0 && seasonPlannerData.length === 0 && (
                     <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>No recent activity to display.</p>
                  )}
                </div>
              </div>
            )}

            {['crop', 'yield', 'fertilizer'].includes(activeTab) && (
              <div style={{ overflowX: 'auto' }}>
                {activeData.length > 0 ? (
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
                      {activeData.map((item, index) => (
                        <tr key={item._id || index} style={{ borderBottom: '1px solid rgba(74,222,128,0.2)', transition: 'background-color 0.2s', ':hover': { backgroundColor: 'var(--mint-faint)' } }}>
                          <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--leaf)', borderLeft: '1px solid rgba(74,222,128,0.2)' }}>
                            {activeTab === 'crop' ? getPredVal(item.Prediction) : activeTab === 'yield' ? item.Crop : getPredVal(item.RecommendedFertilizer)}
                          </td>
                          <td style={{ padding: '14px 16px', color: 'var(--text-main)' }}>
                            {activeTab === 'crop' ? `${item.Nitrogen}-${item.Phosphorus}-${item.Potassium}` : activeTab === 'yield' ? <strong style={{color: '#0D6EFD'}}>{item.PredictedYield}</strong> : item.Crop}
                          </td>
                          <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            {formatDateTime(item.createdAt || item.Timestamp)}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center', borderRight: '1px solid rgba(74,222,128,0.2)' }}>
                            <button onClick={() => deleteRecord(item._id, activeTab)} style={{ backgroundColor: 'transparent', border: 'none', color: '#e53935', cursor: 'pointer', padding: '6px' }} title="Delete Record">
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No historical records found for {title}.</p>
                )}
              </div>
            )}

            {activeTab === 'planner' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                {activeData.length > 0 ? activeData.map((plan) => (
                  <div key={plan.id} style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--mint-light)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '12px', padding: '15px' }}>
                     <h4 style={{ color: 'var(--forest)', fontSize: '1.1rem', margin: '0 0 5px 0' }}>{plan.selectedCrop}</h4>
                     <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{plan.district}, {plan.state} ({plan.season})</p>
                     <p style={{ margin: 'auto 0 0 0', fontSize: '0.75rem', color: 'var(--text-light)' }}>Saved: {formatDateTime(plan.timestamp)}</p>
                     <button onClick={() => deleteRecord(plan.id, 'planner')} style={{ marginTop: '10px', backgroundColor: '#fee2e2', border: 'none', color: '#e53935', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                       <Trash2 size={14} /> Remove Plan
                     </button>
                  </div>
                )) : (
                  <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>You have not saved any Season Plans.</p>
                )}
              </div>
            )}

            {['posts', 'likes'].includes(activeTab) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {activeData.length > 0 ? activeData.map((post) => (
                  <div key={post._id} style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div>
                       <h4 style={{ color: 'var(--forest)', fontSize: '1.1rem', margin: '0 0 8px 0', fontWeight: 600 }}>{post.heading}</h4>
                       <p style={{ margin: '0', fontSize: '0.9rem', color: 'var(--text-main)', maxWidth: '600px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.content}</p>
                       <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDateTime(post.createdAt)} • {post.likes?.length || 0} Likes</p>
                     </div>
                     <button onClick={() => navigate(`/forum/${post._id}`)} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>View Post</button>
                  </div>
                )) : (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No posts found.</p>
                )}
              </div>
            )}

            {activeTab === 'comments' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {activeData.length > 0 ? activeData.map((comment) => (
                  <div key={comment._id} style={{ backgroundColor: 'var(--mint-faint)', borderLeft: '4px solid var(--leaf)', borderRadius: '8px', padding: '15px' }}>
                     <p style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: 'var(--text-main)', fontStyle: 'italic' }}>"{comment.content}"</p>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <p style={{ margin: '0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Commented on {formatDateTime(comment.createdAt)}</p>
                       <button onClick={() => navigate(`/forum/${comment.postId}`)} style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--forest)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}>View Thread</button>
                     </div>
                  </div>
                )) : (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>You have not commented on any posts.</p>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticularUserData;
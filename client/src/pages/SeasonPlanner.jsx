import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { Spinner } from 'react-bootstrap';
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import {
    FaSeedling, FaWater, FaBug, FaTractor, FaChartLine, FaCheckCircle,
    FaExclamationTriangle, FaBoxOpen, FaCalendarAlt, FaSyncAlt, FaStar,
    FaHistory, FaSearch, FaChevronLeft, FaChevronRight, FaBell, FaTrash,
    FaEye, FaTimes, FaCity
} from 'react-icons/fa';
import { GiFertilizerBag, GiSickle } from 'react-icons/gi';
import './SeasonPlanner.css';
import html2pdf from "html2pdf.js";
import url from "../url";

/* ─── helpers ─── */
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const getStoredPlans = () => {
  try { return JSON.parse(localStorage.getItem('agrivista_saved_plans') || '[]'); } catch { return []; }
};
const storePlans = (plans) => localStorage.setItem('agrivista_saved_plans', JSON.stringify(plans));

const getHistory = () => {
  try { return JSON.parse(localStorage.getItem('agrivista_plan_history') || '[]'); } catch { return []; }
};
const storeHistory = (h) => localStorage.setItem('agrivista_plan_history', JSON.stringify(h));

const SeasonPlanner = () => {
    const [activeTab, setActiveTab] = useState('find');
    const [formData, setFormData] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('agrivista_planner_form')) || { crop: '', season: '', state: '', district: '', city: '' };
        } catch { return { crop: '', season: '', state: '', district: '', city: '' }; }
    });
    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState(null);
    const [cropImage, setCropImage] = useState(null);
    const [cookies] = useCookies(["token"]);
    const [userId, setUserId] = useState(null);
    const navigate = useNavigate();

    /* Calendar state */
    const now = new Date();
    const [calMonth, setCalMonth] = useState(now.getMonth());
    const [calYear, setCalYear] = useState(now.getFullYear());
    const [calActivities, setCalActivities] = useState(() => {
        try { return JSON.parse(localStorage.getItem('agrivista_cal_activities')) || []; }
        catch { return []; }
    });
    const [calLoading, setCalLoading] = useState(false);
    const [notifiedDates, setNotifiedDates] = useState(() => {
      try { return JSON.parse(localStorage.getItem('agrivista_notified') || '{}'); } catch { return {}; }
    });

    /* Rotation state */
    const [rotPlan, setRotPlan] = useState(null);
    const [rotLoading, setRotLoading] = useState(false);

    /* Saved & History */
    const [savedPlans, setSavedPlans] = useState(getStoredPlans);
    const [history, setHistory] = useState(getHistory);
    const [viewingPlan, setViewingPlan] = useState(null);

    /* ─── Notification check on mount & when calendar loads ─── */
    useEffect(() => {
      if (!('Notification' in window)) return;
      Notification.requestPermission();
    }, []);

    useEffect(() => {
      const verifyUser = async () => {
        if (!cookies.token) return;
        try {
          const { data } = await axios.post(
            url,
            { tok: cookies.token },
            { withCredentials: true }
          );
          if (data.status) setUserId(data.id);
        } catch (err) { console.error(err); }
      };
      verifyUser();
    }, [cookies]);

    useEffect(() => {
      if (calActivities.length === 0) return;
      const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
      calActivities.forEach(a => {
        if (a.date === todayStr && !notifiedDates[todayStr + a.activity]) {
          if (Notification.permission === 'granted') {
            new Notification('🌱 AgriVista Crop Calendar', { body: `Today: ${a.activity}`, icon: '/favicon.ico' });
          }
          toast.success(`📅 Today's Activity: ${a.activity}`, { duration: 6000 });
          const updated = { ...notifiedDates, [todayStr + a.activity]: true };
          setNotifiedDates(updated);
          localStorage.setItem('agrivista_notified', JSON.stringify(updated));
        }
      });
    }, [calActivities]);

    /* ─── Find Best Crops ─── */
    const fetchCropImage = async (cropName) => {
        try {
            const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cropName)}`;
            const response = await axios.get(wikiUrl);
            setCropImage(response.data.thumbnail?.source || null);
        } catch { setCropImage(null); }
    };

    const handleChange = (e) => {
        const updated = { ...formData, [e.target.name]: e.target.value };
        setFormData(updated);
        localStorage.setItem('agrivista_planner_form', JSON.stringify(updated));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setPlan(null); setCropImage(null);
        try {
            const response = await axios.post(`${url}/api/season-planner`, formData);
            if (response.data.success) {
                setPlan(response.data.plan);
                fetchCropImage(response.data.plan.crop_name_english || formData.crop);
                toast.success('Smart Plan Generated!');
                // Add to history
                const entry = { id: Date.now(), crop: formData.crop, season: formData.season, state: formData.state, district: formData.district, city: formData.city, date: new Date().toLocaleDateString(), plan: response.data.plan };
                const newH = [entry, ...history].slice(0, 50);
                setHistory(newH); storeHistory(newH);
            }
        } catch { toast.error('Failed to generate plan. Please try again.'); }
        finally { setLoading(false); }
    };

    const savePlan = () => {
      if (!plan) return;
      const entry = { id: Date.now(), crop: formData.crop, season: formData.season, state: formData.state, district: formData.district, city: formData.city, date: new Date().toLocaleDateString(), plan };
      const newP = [entry, ...savedPlans];
      setSavedPlans(newP); storePlans(newP);
      toast.success('Plan saved!');
    };

    const handlePrint = () => {
        const element = document.getElementById("season-plan-pdf");
        html2pdf().set({ margin: 0.5, filename: `${formData.crop || 'Crop'}_Season_Plan.pdf`, image: { type: "jpeg", quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: "in", format: "a4", orientation: "portrait" } }).from(element).save();
        toast.success("Season Plan downloaded!");
    };

    /* ─── Crop Calendar ─── */
    const generateCalendar = async () => {
      if (!formData.crop || !formData.season || !formData.state) { toast.error('Please find a crop first'); return; }
      setCalLoading(true); setCalActivities([]);
      try {
        const res = await axios.post(`${url}/api/season-planner/calendar`, { crop: formData.crop, season: formData.season, state: formData.state, month: calMonth + 1, year: calYear });
        if (res.data.success) { 
            const newActivities = res.data.activities || [];
            setCalActivities(newActivities);
            localStorage.setItem('agrivista_cal_activities', JSON.stringify(newActivities));
            toast.success('Calendar generated!'); 
        }
      } catch { toast.error('Failed to generate calendar'); }
      finally { setCalLoading(false); }
    };

    const getDaysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
    const getFirstDayOfMonth = (m, y) => new Date(y, m, 1).getDay();

    const prevMonth = () => {
      const mn = new Date(); // don't go before current month
      if (calYear === mn.getFullYear() && calMonth <= mn.getMonth()) return;
      if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
      else setCalMonth(calMonth - 1);
    };
    const nextMonth = () => {
      if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
      else setCalMonth(calMonth + 1);
    };

    const pushToTodo = async () => {
      if (!userId) { toast.error("Please log in to save to your Todo Calendar"); return; }
      if (calActivities.length === 0) { toast.error("Generate a calendar first"); return; }
      try {
        const tasks = calActivities.map(a => ({
          title: a.activity,
          description: a.details,
          dueDate: new Date(a.date)
        }));
        await axios.post(`${url}/api/tasks/bulk`, { userId, planId: `${formData.crop}-${Date.now()}`, tasks });
        toast.success("Tasks added to your Calendar!");
        navigate("/calendar");
      } catch (err) { toast.error("Failed to push tasks"); }
    };

    /* ─── Rotation Plan ─── */
    const generateRotation = async () => {
      if (!formData.crop || !formData.state) { toast.error('Please find a crop first'); return; }
      setRotLoading(true); setRotPlan(null);
      try {
        const res = await axios.post(`${url}/api/season-planner/rotation`, { crop: formData.crop, state: formData.state, district: formData.district });
        if (res.data.success) { setRotPlan(res.data.rotation); toast.success('Rotation plan generated!'); }
      } catch { toast.error('Failed to generate rotation plan'); }
      finally { setRotLoading(false); }
    };

    /* ─── View plan inline ─── */
    const openPlanInline = (entry) => {
      setViewingPlan(entry);
    };

    const removeSaved = (id) => {
      const updated = savedPlans.filter(p => p.id !== id);
      setSavedPlans(updated); storePlans(updated);
      toast.success('Plan removed');
    };

    const removeHistory = (id) => {
      const updated = history.filter(p => p.id !== id);
      setHistory(updated); storeHistory(updated);
      toast.success('Removed from history');
    };

    /* ─── Sidebar ─── */
    const tabs = [
      { key: 'find', icon: <FaSearch />, label: 'Find Best Crops' },
      { key: 'calendar', icon: <FaCalendarAlt />, label: 'Crop Calendar' },
      { key: 'rotation', icon: <FaSyncAlt />, label: 'Rotation Plan' },
    ];
    const savedTabs = [
      { key: 'saved', icon: <FaStar />, label: 'Saved Plans' },
      { key: 'history', icon: <FaHistory />, label: 'History' },
    ];

  return (
    <div className="dash-wrap">
      <Toaster position="top-center" />

      {/* SIDEBAR */}
      <div className="dash-sidebar">
        <div className="dash-sidebar-title">Planner</div>
        {tabs.map(t => (
          <div key={t.key} className={`sidebar-item ${activeTab === t.key ? 'active' : ''}`} onClick={() => { setActiveTab(t.key); setViewingPlan(null); }}>
            <span className="sidebar-icon">{t.icon}</span>{t.label}
          </div>
        ))}
        <div className="dash-sidebar-title">Saved</div>
        {savedTabs.map(t => (
          <div key={t.key} className={`sidebar-item ${activeTab === t.key ? 'active' : ''}`} onClick={() => { setActiveTab(t.key); setViewingPlan(null); }}>
            <span className="sidebar-icon">{t.icon}</span>{t.label}
          </div>
        ))}
      </div>

      <div className="dash-main">

        {/* ═══════════ FIND BEST CROPS ═══════════ */}
        {activeTab === 'find' && (
          <>
            <div className="dash-header">
              <h2>Season Planner</h2>
              <p>Tell us about your farm and get personalised crop recommendations.</p>
            </div>
            <div className="dash-grid2">
              <div className="dash-card">
                <div className="dash-card-title">Farm Profile</div>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="form-lbl">Target Crop</label>
                    <input type="text" className="form-input" name="crop" value={formData.crop} onChange={handleChange} placeholder="e.g. Wheat, Cotton" required />
                  </div>
                  <div className="form-group">
                    <label className="form-lbl">Season</label>
                    <select className="form-input" name="season" value={formData.season} onChange={handleChange} required>
                      <option value="">Select Season</option>
                      <option value="Kharif">Kharif (June–Oct)</option>
                      <option value="Rabi">Rabi (Oct–March)</option>
                      <option value="Summer">Summer / Zaid (March–June)</option>
                      <option value="Whole Year">Whole Year</option>
                    </select>
                  </div>
                  <div className="form-row2" style={{ marginBottom: '.6rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-lbl">State</label>
                      <input type="text" className="form-input" name="state" value={formData.state} onChange={handleChange} placeholder="e.g. Punjab" required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-lbl">District</label>
                      <input type="text" className="form-input" name="district" value={formData.district} onChange={handleChange} placeholder="e.g. Ludhiana" required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-lbl"><FaCity style={{ marginRight: 4 }} />City / Town</label>
                    <input type="text" className="form-input" name="city" value={formData.city} onChange={handleChange} placeholder="e.g. Ludhiana City" />
                  </div>
                  <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '.3rem' }} disabled={loading}>
                    {loading ? (<span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Spinner animation="border" size="sm" /> Analysing Soil & Climate...</span>) : <span>Analyse & Recommend →</span>}
                  </button>
                </form>
              </div>

              <div className="dash-card">
                <div className="dash-card-title">Seasonal Overview</div>
                <div className="mini-bar-wrap" style={{ height: '80px' }}>
                  <div className="mbar-col"><div className="mbar" style={{ height: '55px' }}></div><div className="mbar-lbl">Jun</div></div>
                  <div className="mbar-col"><div className="mbar" style={{ height: '70px' }}></div><div className="mbar-lbl">Jul</div></div>
                  <div className="mbar-col"><div className="mbar" style={{ height: '60px' }}></div><div className="mbar-lbl">Aug</div></div>
                  <div className="mbar-col"><div className="mbar" style={{ height: '40px', background: 'linear-gradient(180deg,#bbf7d0,#86efac)' }}></div><div className="mbar-lbl">Sep</div></div>
                  <div className="mbar-col"><div className="mbar" style={{ height: '75px' }}></div><div className="mbar-lbl">Oct</div></div>
                  <div className="mbar-col"><div className="mbar" style={{ height: '80px' }}></div><div className="mbar-lbl">Nov</div></div>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <div className="detail-row"><span className="detail-key">Current Season</span><span className="detail-val">Rabi 2025–26</span></div>
                  <div className="detail-row"><span className="detail-key">Avg Rainfall</span><span className="detail-val">612 mm / year</span></div>
                  <div className="detail-row"><span className="detail-key">Soil Health</span><span className="detail-val"><span className="pill pill-green">Good — 8.4/10</span></span></div>
                  <div className="detail-row"><span className="detail-key">Last Crop</span><span className="detail-val">Soybean (Kharif 25)</span></div>
                </div>
              </div>
            </div>

            {!plan && (
              <div className="dash-card">
                <div className="dash-card-title">Top Recommended Crops <button className="dash-card-action">View Full List →</button></div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="dash-table">
                    <thead><tr><th>Crop</th><th>Match</th><th>Season</th><th>Water Need</th><th>Est. Yield</th><th>Market ₹</th><th>Fit</th></tr></thead>
                    <tbody>
                      <tr><td><b>Wheat</b></td><td>96%</td><td>Rabi</td><td>450mm</td><td>2,840 kg/ac</td><td>₹2,200/q</td><td><span className="pill pill-green">Excellent</span></td></tr>
                      <tr><td>Soybean</td><td>88%</td><td>Kharif</td><td>380mm</td><td>1,120 kg/ac</td><td>₹4,800/q</td><td><span className="pill pill-green">Good</span></td></tr>
                      <tr><td>Cotton</td><td>82%</td><td>Kharif</td><td>700mm</td><td>520 kg/ac</td><td>₹6,500/q</td><td><span className="pill pill-blue">Fair</span></td></tr>
                      <tr><td>Chickpea</td><td>79%</td><td>Rabi</td><td>280mm</td><td>980 kg/ac</td><td>₹5,200/q</td><td><span className="pill pill-blue">Fair</span></td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PLAN RESULTS (same as before) */}
            {plan && <PlanResult plan={plan} formData={formData} cropImage={cropImage} handlePrint={handlePrint} savePlan={savePlan} />}
          </>
        )}

        {/* ═══════════ CROP CALENDAR ═══════════ */}
        {activeTab === 'calendar' && (
          <>
            <div className="dash-header">
              <h2><FaCalendarAlt style={{ marginRight: 8 }} />Crop Calendar</h2>
              <p>Plan your farming activities month by month with day-wise scheduling.</p>
            </div>

            {!formData.crop ? (
              <div className="dash-card" style={{ textAlign: 'center', padding: '3rem' }}>
                <FaCalendarAlt size={40} color="rgba(74,222,128,0.3)" />
                <p style={{ color: 'var(--text-muted)', marginTop: '1rem', marginBottom: '1rem' }}>Please go to <strong>Find Best Crops</strong> first and fill in your crop details.</p>
                <button className="btn-primary" onClick={() => setActiveTab('find')}>← Go to Find Best Crops</button>
              </div>
            ) : (
              <>
                {/* Crop Info Banner */}
                <div className="dash-card" style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: 'linear-gradient(135deg, var(--leaf), var(--forest))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18 }}><FaSeedling /></div>
                    <div>
                      <h4 style={{ fontFamily: 'var(--ff-head)', fontSize: '1rem', fontWeight: 700, color: 'var(--forest)', margin: 0 }}>{formData.crop}</h4>
                      <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{formData.season} • {formData.district}, {formData.state}{formData.city ? ` • ${formData.city}` : ''}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', zIndex: 10 }}>
                    <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '.82rem' }} disabled={calLoading} onClick={generateCalendar}>
                      {calLoading ? <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Spinner animation="border" size="sm" /> Generating...</span> : <span>📅 Generate Calendar</span>}
                    </button>
                    {calActivities.length > 0 && (
                      <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '.82rem', background: '#3b82f6' }} onClick={pushToTodo}>
                        📋 Push to Tracker
                      </button>
                    )}
                  </div>
                </div>

                <div className="dash-grid2">
                  {/* Month Nav */}
                  <div className="dash-card">
                    <div className="cal-month-nav">
                      <button className="cal-nav-btn" onClick={prevMonth}><FaChevronLeft /></button>
                      <span className="cal-month-label">{MONTH_NAMES[calMonth]} {calYear}</span>
                      <button className="cal-nav-btn" onClick={nextMonth}><FaChevronRight /></button>
                    </div>
                    <div className="cal-grid">
                      {DAY_NAMES.map(d => <div key={d} className="cal-head">{d}</div>)}
                      {Array.from({ length: getFirstDayOfMonth(calMonth, calYear) }).map((_, i) => <div key={`e${i}`} className="cal-cell"></div>)}
                      {Array.from({ length: getDaysInMonth(calMonth, calYear) }).map((_, i) => {
                        const day = i + 1;
                        const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                        const dayActivities = calActivities.filter(a => a.date === dateStr);
                        const isToday = day === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear();
                        return (
                          <div key={day} className={`cal-cell ${dayActivities.length ? 'marked' : ''} ${isToday ? 'active' : ''}`} title={dayActivities.map(a => a.activity).join('\n')}>
                            {day}
                            {dayActivities.length > 0 && <span className="cal-dot"></span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quick Info */}
                  <div className="dash-card">
                    <div className="dash-card-title">Calendar Info</div>
                    <div className="detail-row"><span className="detail-key">Crop</span><span className="detail-val">{formData.crop}</span></div>
                    <div className="detail-row"><span className="detail-key">Season</span><span className="detail-val">{formData.season}</span></div>
                    <div className="detail-row"><span className="detail-key">State</span><span className="detail-val">{formData.state}</span></div>
                    <div className="detail-row"><span className="detail-key">District</span><span className="detail-val">{formData.district}</span></div>
                    {formData.city && <div className="detail-row"><span className="detail-key">City</span><span className="detail-val">{formData.city}</span></div>}
                    <div style={{ marginTop: '1rem', padding: '10px', background: 'var(--mint-light)', borderRadius: 8, fontSize: '.75rem', color: 'var(--forest)' }}>
                      💡 Activities for today will trigger a browser notification to remind you.
                    </div>
                  </div>
                </div>

                {/* Activities list */}
                {calActivities.length > 0 && (
                  <div className="dash-card" style={{ marginTop: '1.2rem' }}>
                    <div className="dash-card-title"><FaBell style={{ marginRight: 6, color: '#f59e0b' }} /> Scheduled Activities</div>
                    <div className="cal-activity-list">
                      {calActivities.map((a, i) => {
                        const actDate = new Date(a.date);
                        const dayName = DAY_NAMES[actDate.getDay()];
                        return (
                          <div key={i} className="cal-activity-item">
                            <div className="cal-act-date">
                              <span className="cal-act-day">{actDate.getDate()}</span>
                              <span className="cal-act-dayname">{dayName}</span>
                              <span className="cal-act-monthyr">{MONTH_NAMES[actDate.getMonth()].slice(0,3)} {actDate.getFullYear()}</span>
                            </div>
                            <div className="cal-act-info">
                              <h4>{a.activity}</h4>
                              {a.details && <p>{a.details}</p>}
                            </div>
                            <div className="cal-act-badge">
                              {a.date === `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}` ? <span className="pill pill-green">Today</span> : new Date(a.date) < now ? <span className="pill pill-amber">Past</span> : <span className="pill pill-blue">Upcoming</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ═══════════ ROTATION PLAN ═══════════ */}
        {activeTab === 'rotation' && (
          <>
            <div className="dash-header">
              <h2><FaSyncAlt style={{ marginRight: 8 }} />Crop Rotation Plan</h2>
              <p>Get an optimized multi-season crop rotation strategy for your farm.</p>
            </div>

            {!formData.crop ? (
              <div className="dash-card" style={{ textAlign: 'center', padding: '3rem' }}>
                <FaSyncAlt size={40} color="rgba(74,222,128,0.3)" />
                <p style={{ color: 'var(--text-muted)', marginTop: '1rem', marginBottom: '1rem' }}>Please go to <strong>Find Best Crops</strong> first and fill in your crop details.</p>
                <button className="btn-primary" onClick={() => setActiveTab('find')}>← Go to Find Best Crops</button>
              </div>
            ) : (
              <>
                {/* Crop Info Banner */}
                <div className="dash-card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: 'linear-gradient(135deg, var(--leaf), var(--forest))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18 }}><FaSeedling /></div>
                    <div>
                      <h4 style={{ fontFamily: 'var(--ff-head)', fontSize: '1rem', fontWeight: 700, color: 'var(--forest)', margin: 0 }}>Rotation for {formData.crop}</h4>
                      <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{formData.season} • {formData.district}, {formData.state}{formData.city ? ` • ${formData.city}` : ''}</span>
                    </div>
                  </div>
                  <button className="btn-primary" style={{ padding: '8px 20px', fontSize: '.82rem' }} disabled={rotLoading} onClick={generateRotation}>
                    {rotLoading ? <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Spinner animation="border" size="sm" /> Generating...</span> : <span>🔄 Generate Rotation Plan</span>}
                  </button>
                </div>

            {rotPlan && (
              <div className="dash-card" style={{ animation: 'fadeInUp 0.5s' }}>
                <div className="dash-card-title">🔄 Recommended Rotation Cycle</div>
                <div className="rotation-timeline">
                  {rotPlan.seasons?.map((s, i) => (
                    <div key={i} className="rot-season-card">
                      <div className="rot-season-header">
                        <span className="rot-season-num">Season {i + 1}</span>
                        <span className="rot-season-name">{s.season}</span>
                      </div>
                      <h4 className="rot-crop-name">{s.crop}</h4>
                      <p className="rot-reason">{s.reason}</p>
                      {s.benefits && <div className="rot-benefits">{s.benefits.map((b, j) => <span key={j} className="pill pill-green" style={{ marginRight: 4, marginBottom: 4 }}>{b}</span>)}</div>}
                    </div>
                  ))}
                </div>
                {rotPlan.tips && (
                  <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--mint-light)', borderRadius: 12, border: '1px solid rgba(74,222,128,0.3)' }}>
                    <strong style={{ color: 'var(--forest)' }}>💡 Rotation Tips:</strong>
                    <ul style={{ margin: '8px 0 0 16px', fontSize: '.82rem', color: 'var(--text-muted)' }}>
                      {rotPlan.tips.map((t, i) => <li key={i} style={{ marginBottom: 4 }}>{t}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
              </>
            )}
          </>
        )}

        {/* ═══════════ SAVED PLANS ═══════════ */}
        {activeTab === 'saved' && !viewingPlan && (
          <>
            <div className="dash-header">
              <h2><FaStar style={{ marginRight: 8, color: '#f59e0b' }} />Saved Plans</h2>
              <p>Your bookmarked crop plans for quick reference.</p>
            </div>
            {savedPlans.length === 0 ? (
              <div className="dash-card" style={{ textAlign: 'center', padding: '3rem' }}>
                <FaStar size={40} color="rgba(74,222,128,0.3)" />
                <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>No saved plans yet. Generate a plan and save it!</p>
              </div>
            ) : (
              <div className="plans-grid">
                {savedPlans.map(p => (
                  <div key={p.id} className="plan-card">
                    <div className="plan-card-header">
                      <FaSeedling className="plan-card-icon" />
                      <div>
                        <h4>{p.crop}</h4>
                        <span className="plan-card-meta">{p.season} • {p.district}, {p.state}{p.city ? ` • ${p.city}` : ''}</span>
                      </div>
                    </div>
                    <span className="plan-card-date">{p.date}</span>
                    <div className="plan-card-actions">
                      <button className="plan-action-btn view" onClick={() => openPlanInline(p)}><FaEye /> View</button>
                      <button className="plan-action-btn delete" onClick={() => removeSaved(p.id)}><FaTrash /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ═══════════ HISTORY ═══════════ */}
        {activeTab === 'history' && !viewingPlan && (
          <>
            <div className="dash-header">
              <h2><FaHistory style={{ marginRight: 8 }} />Plan History</h2>
              <p>Previously generated crop plans.</p>
            </div>
            {history.length === 0 ? (
              <div className="dash-card" style={{ textAlign: 'center', padding: '3rem' }}>
                <FaHistory size={40} color="rgba(74,222,128,0.3)" />
                <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>No history yet. Generate your first crop plan!</p>
              </div>
            ) : (
              <div className="plans-grid">
                {history.map(p => (
                  <div key={p.id} className="plan-card">
                    <div className="plan-card-header">
                      <FaSeedling className="plan-card-icon" />
                      <div>
                        <h4>{p.crop}</h4>
                        <span className="plan-card-meta">{p.season} • {p.district}, {p.state}{p.city ? ` • ${p.city}` : ''}</span>
                      </div>
                    </div>
                    <span className="plan-card-date">{p.date}</span>
                    <div className="plan-card-actions">
                      <button className="plan-action-btn view" onClick={() => openPlanInline(p)}><FaEye /> View</button>
                      <button className="plan-action-btn delete" onClick={() => removeHistory(p.id)}><FaTrash /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ═══════════ INLINE PLAN VIEW (for Saved/History) ═══════════ */}
        {viewingPlan && (activeTab === 'saved' || activeTab === 'history') && (
          <div style={{ animation: 'fadeInUp 0.4s' }}>
            <button className="btn-back" onClick={() => setViewingPlan(null)}>
              <FaChevronLeft /> Back to {activeTab === 'saved' ? 'Saved Plans' : 'History'}
            </button>
            <PlanResult plan={viewingPlan.plan} formData={viewingPlan} cropImage={null} handlePrint={null} savePlan={null} />
          </div>
        )}
      </div>

      {/* HIDDEN PDF TEMPLATE */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <div id="season-plan-pdf" style={{ padding: "40px", fontFamily: 'Arial, sans-serif', color: '#1a1a1a', width: '700px', backgroundColor: 'white', boxSizing: 'border-box' }}>
          <div style={{ borderBottom: "3px solid #6A8E23", paddingBottom: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ color: "#4A6317", margin: 0, fontSize: '24px', fontWeight: 'bold' }}>AgriVista Season Guide</h1>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>Comprehensive Farming Strategy</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '12px' }}><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px' }}><strong>Crop:</strong> {formData.crop}</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px' }}><strong>Region:</strong> {formData.district}, {formData.state}{formData.city ? `, ${formData.city}` : ''}</p>
            </div>
          </div>
          {plan && <PdfContent plan={plan} economics={plan.economics} />}
        </div>
      </div>
    </div>
  );
};

/* ═══════════ PLAN RESULT COMPONENT ═══════════ */
const PlanResult = ({ plan, formData, cropImage, handlePrint, savePlan }) => (
  <div style={{ animation: "fadeInUp 0.5s" }}>
    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
      {cropImage && <img src={cropImage} alt={formData.crop} style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '50%', border: '4px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '1rem' }} />}
      <h2 style={{ color: 'var(--forest)', fontFamily: 'var(--ff-head)', fontWeight: 700, fontSize: '1.8rem' }}>Your {formData.season} Plan for {formData.crop}</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Based on data for {formData.district}, {formData.state}{formData.city ? `, ${formData.city}` : ''}</p>
    </div>

    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: '1.5rem' }}>
      {handlePrint && <button onClick={handlePrint} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '.8rem', padding: '8px 16px' }}><FaChartLine /> Download PDF</button>}
      {savePlan && <button onClick={savePlan} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '.8rem', padding: '8px 16px', background: '#f59e0b' }}><FaStar /> Save Plan</button>}
    </div>

    {/* Suitability */}
    <div className="dash-card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '15px' }}>
      {plan.suitability?.is_suitable ? <FaCheckCircle size={36} color="var(--leaf-bright)" /> : <FaExclamationTriangle size={36} color="#fbbf24" />}
      <div>
        <h4 style={{ fontFamily: 'var(--ff-head)', fontSize: '1.1rem', color: 'var(--forest)', marginBottom: '4px' }}>Suitability Verdict</h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 0 }}>{plan.suitability?.analysis} <strong style={{ color: 'var(--forest)' }}>{plan.suitability?.recommendation}</strong></p>
      </div>
    </div>

    {/* Land Prep */}
    <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
      <div className="dash-card-title"><FaTractor className="sidebar-icon" style={{ color: '#fbbf24', marginRight: '8px' }} /> Land Preparation</div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        {plan.soil_preparation?.steps?.map((step, i) => (<li key={i} style={{ padding: '8px 0', borderBottom: '1px solid rgba(74,222,128,0.15)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}><span style={{ color: 'var(--leaf)', fontWeight: 'bold', marginTop: '2px' }}>✓</span> {step}</li>))}
      </ul>
      {plan.soil_preparation?.key_tip && (<div style={{ backgroundColor: 'var(--mint-light)', border: '1px solid rgba(74,222,128,0.3)', padding: '12px', borderRadius: '8px', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--forest)' }}><strong>💡 Expert Tip:</strong> {plan.soil_preparation.key_tip}</div>)}
    </div>

    {/* Required Inputs */}
    {plan.inputs_required && (
      <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
        <div className="dash-card-title"><FaBoxOpen className="sidebar-icon" style={{ color: '#9ca3af', marginRight: '8px' }} /> Required Farm Inputs</div>
        <div className="dash-grid3" style={{ marginBottom: 0 }}>
          <div className="rec-card" style={{ borderTop: '4px solid var(--leaf-bright)' }}><h4>🌱 Seeds</h4><ul style={{ paddingLeft: '15px', marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{plan.inputs_required.seeds?.map((item, i) => <li key={i}>{item}</li>)}</ul></div>
          <div className="rec-card" style={{ borderTop: '4px solid #3b82f6' }}><h4>🧪 Fertilizers</h4><ul style={{ paddingLeft: '15px', marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{plan.inputs_required.fertilizers?.map((item, i) => <li key={i}>{item}</li>)}</ul></div>
          <div className="rec-card" style={{ borderTop: '4px solid #ef4444' }}><h4>🛡 Pesticides</h4><ul style={{ paddingLeft: '15px', marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{plan.inputs_required.pesticides?.map((item, i) => <li key={i}>{item}</li>)}</ul></div>
        </div>
      </div>
    )}

    {/* Sowing */}
    <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
      <div className="dash-card-title"><FaSeedling className="sidebar-icon" style={{ color: 'var(--leaf-bright)', marginRight: '8px' }} /> Seed Selection & Sowing</div>
      <div className="form-lbl" style={{ margin: '1rem 0 0.5rem' }}>Recommended Varieties & Prices</div>
      <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
        <table className="dash-table"><thead><tr><th>Variety</th><th>Details</th><th>Approx. Price</th></tr></thead><tbody>
          {plan.sowing?.varieties?.map((v, i) => (<tr key={i}><td style={{ fontWeight: 600 }}>{v.name}</td><td style={{ color: 'var(--text-muted)' }}>{v.details}</td><td><span className="pill pill-green">{v.approx_price}</span></td></tr>))}
        </tbody></table>
      </div>
      <div className="form-row2">
        <div className="rec-card"><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}><strong>Seed Rate:</strong> {plan.sowing?.seed_rate}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}><strong>Spacing:</strong> {plan.sowing?.spacing}</div></div>
        <div className="rec-card"><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}><strong>Method:</strong> {plan.sowing?.method}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}><strong>Treatment:</strong> {plan.sowing?.treatment}</div></div>
      </div>
    </div>

    {/* Fertilizers */}
    <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
      <div className="dash-card-title"><GiFertilizerBag className="sidebar-icon" style={{ color: '#0ea5e9', marginRight: '8px' }} /> Nutrient Management</div>
      <div style={{ overflowX: 'auto' }}>
        <table className="dash-table"><thead><tr><th>Stage</th><th>Fertilizer</th><th>Dose</th><th>Est. Cost</th></tr></thead><tbody>
          {plan.fertilizer?.schedule?.map((item, i) => (<tr key={i}><td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{item.stage}</td><td style={{ fontWeight: 600 }}>{item.fertilizer}</td><td>{item.dose}</td><td><span className="pill pill-green">{item.approx_price}</span></td></tr>))}
        </tbody></table>
      </div>
    </div>

    {/* Irrigation */}
    <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
      <div className="dash-card-title"><FaWater className="sidebar-icon" style={{ color: '#3b82f6', marginRight: '8px' }} /> Water Management</div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '1rem', lineHeight: 1.6 }}>{plan.irrigation?.schedule}</p>
      <div className="form-lbl" style={{ marginBottom: '0.5rem' }}>Critical Irrigation Stages</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>{plan.irrigation?.critical_stages?.map((stage, i) => (<span key={i} className="pill pill-blue">{stage}</span>))}</div>
    </div>

    {/* Protection */}
    <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
      <div className="dash-card-title"><FaBug className="sidebar-icon" style={{ color: '#ef4444', marginRight: '8px' }} /> Plant Protection</div>
      <div className="dash-grid2">
        <div><div className="form-lbl" style={{ color: '#ef4444', marginBottom: '0.8rem' }}>⚠ Major Pests</div><div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{plan.protection?.pests?.map((pest, i) => (<div key={i} className="rec-card" style={{ borderLeft: '3px solid #ef4444', padding: '10px' }}><span style={{ fontSize: '0.8rem', fontWeight: 600 }}>🦗 {pest}</span></div>))}</div></div>
        <div><div className="form-lbl" style={{ color: '#f59e0b', marginBottom: '0.8rem' }}>⚠ Major Diseases</div><div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{plan.protection?.diseases?.map((d, i) => (<div key={i} className="rec-card" style={{ borderLeft: '3px solid #f59e0b', padding: '10px' }}><span style={{ fontSize: '0.8rem', fontWeight: 600 }}>🦠 {d}</span></div>))}</div></div>
      </div>
    </div>

    {/* Harvest & Economics */}
    <div className="dash-card">
      <div className="dash-card-title"><GiSickle className="sidebar-icon" style={{ color: 'var(--leaf)', marginRight: '8px' }} /> Harvest & Economics</div>
      <div className="dash-grid2">
        <div>
          <div className="form-lbl" style={{ marginBottom: '0.5rem' }}>Signs of Maturity</div>
          <ul style={{ paddingLeft: '15px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>{plan.harvest?.signs_of_maturity?.map((s, i) => <li key={i} style={{ marginBottom: '4px' }}>{s}</li>)}</ul>
          <div className="rec-card"><span className="form-lbl" style={{ fontSize: '0.65rem' }}>Storage</span><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{plan.harvest?.storage}</span></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--mint-faint)', border: '1px solid rgba(74,222,128,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Est. Cultivation Cost</span><strong style={{ fontSize: '1.2rem', color: 'var(--forest)' }}>{plan.economics?.estimated_cost}</strong></div>
          <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#eff6ff', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '0.8rem', color: '#1e3a8a', fontWeight: 600 }}>Est. Yield / Acre</span><strong style={{ fontSize: '1.2rem', color: '#1d4ed8' }}>{plan.economics?.estimated_yield}</strong></div>
          <div style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#fdf4ff', border: '1px solid rgba(217,70,239,0.2)', fontSize: '0.8rem', color: '#701a75', lineHeight: 1.5 }}>💡 {plan.economics?.market_outlook}</div>
        </div>
      </div>
    </div>
  </div>
);

/* ═══════════ PDF CONTENT ═══════════ */
const PdfContent = ({ plan, economics }) => (
  <div>
    <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: plan.suitability?.is_suitable ? '#e8f5e9' : '#fff3e0', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h3 style={{ fontSize: '16px', margin: '0 0 5px 0', color: '#333' }}>Suitability Verdict</h3>
      <p style={{ margin: 0, fontSize: '12px' }}>{plan.suitability?.analysis}</p>
      <strong style={{ fontSize: '12px', display: 'block', marginTop: '5px' }}>{plan.suitability?.recommendation}</strong>
    </div>
    {plan.inputs_required && (
      <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f9f9f9', border: '1px solid #eee', borderRadius: '8px' }}>
        <h4 style={{ fontSize: '14px', color: '#4A6317', borderBottom: '1px solid #ccc', paddingBottom: '5px', margin: '0 0 10px 0' }}>Required Farm Inputs</h4>
        <div style={{ display: 'flex', gap: '20px', fontSize: '11px' }}>
          <div style={{ flex: 1 }}><strong>Seeds:</strong><ul style={{ paddingLeft: '15px', margin: '5px 0' }}>{plan.inputs_required.seeds?.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
          <div style={{ flex: 1 }}><strong>Fertilizers:</strong><ul style={{ paddingLeft: '15px', margin: '5px 0' }}>{plan.inputs_required.fertilizers?.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
          <div style={{ flex: 1 }}><strong>Protection:</strong><ul style={{ paddingLeft: '15px', margin: '5px 0' }}>{plan.inputs_required.pesticides?.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
        </div>
      </div>
    )}
    <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '15px', textAlign: 'center', fontSize: '10px', color: '#999' }}>
      <p style={{ margin: 0 }}>Generated by AgriVista. Consult local experts before major investment.</p>
    </div>
  </div>
);

export default SeasonPlanner;

import React, { useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { Accordion, Badge, Card, Spinner } from 'react-bootstrap';
import {
    FaSeedling,
    FaWater,
    FaBug,
    FaTractor,
    FaChartLine,
    FaCheckCircle,
    FaExclamationTriangle,
    FaBoxOpen
} from 'react-icons/fa';
import { GiFertilizerBag, GiSickle } from 'react-icons/gi';
import './SeasonPlanner.css';
import html2pdf from "html2pdf.js";
import url from "../url";

const SeasonPlanner = () => {
    const [formData, setFormData] = useState({
        crop: '',
        season: '',
        state: '',
        district: '',
        taluka: ''
    });

    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState(null);
    const [cropImage, setCropImage] = useState(null); // State for crop image

    // Fetch Crop Image from Wikipedia
    const fetchCropImage = async (cropName) => {
        try {
            const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cropName)}`;
            const response = await axios.get(wikiUrl);
            if (response.data.thumbnail && response.data.thumbnail.source) {
                setCropImage(response.data.thumbnail.source);
            } else {
                setCropImage(null);
            }
        } catch (error) {
            console.error("Error fetching crop image:", error);
            setCropImage(null);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setPlan(null);
        setCropImage(null); // Reset image

        // Fetch image immediately (Moved to after plan generation to use English name)
        // fetchCropImage(formData.crop); 

        try {
            const response = await axios.post(
                `${url}/api/season-planner`,
                formData
            );

            if (response.data.success) {
                setPlan(response.data.plan);
                // Fetch image using the English name from the plan, or fallback to user input
                const searchName = response.data.plan.crop_name_english || formData.crop;
                fetchCropImage(searchName);
                toast.success('Smart Plan Generated!');
            }
        } catch (error) {
            console.error('Error fitting plan:', error);
            toast.error('Failed to generate plan. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    /* ---------------- PDF DOWNLOAD ---------------- */
    const handlePrint = () => {
        const element = document.getElementById("season-plan-pdf");
        const fileName = `${formData.crop || 'Crop'}_Season_Plan.pdf`;

        html2pdf().set({
            margin: 0.5,
            filename: fileName,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
        }).from(element).save();

        toast.success("Season Plan downloaded!");
    };

  return (
    <div className="dash-wrap">
      <Toaster position="top-center" />

      <div className="dash-sidebar">
        <div className="dash-sidebar-title">Planner</div>
        <div className="sidebar-item active"><span className="sidebar-icon">🔍</span>Find Best Crops</div>
        <div className="sidebar-item"><span className="sidebar-icon">📆</span>Crop Calendar</div>
        <div className="sidebar-item"><span className="sidebar-icon">🔄</span>Rotation Plan</div>
        <div className="dash-sidebar-title">Saved</div>
        <div className="sidebar-item"><span className="sidebar-icon">⭐</span>Saved Plans</div>
        <div className="sidebar-item"><span className="sidebar-icon">📋</span>History</div>
      </div>

      <div className="dash-main">
        <div className="dash-header">
          <h2>Season Planner</h2>
          <p>Tell us about your farm and get personalised crop recommendations.</p>
        </div>
        <div className="dash-grid2">
          {/* Farm Profile Form */}
          <div className="dash-card">
            <div className="dash-card-title">Farm Profile</div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-lbl">Target Crop</label>
                <input
                  type="text"
                  className="form-input"
                  name="crop"
                  value={formData.crop}
                  onChange={handleChange}
                  placeholder="e.g. Wheat, Cotton"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-lbl">Season</label>
                <select
                  className="form-input"
                  name="season"
                  value={formData.season}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Season</option>
                  <option value="Kharif">Kharif (June–Oct)</option>
                  <option value="Rabi">Rabi (Oct–March)</option>
                  <option value="Summer">Summer / Zaid (March–June)</option>
                  <option value="Whole Year">Whole Year</option>
                </select>
              </div>

              <div className="form-row2" style={{ marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-lbl">State</label>
                  <input
                    type="text"
                    className="form-input"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="e.g. Punjab"
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-lbl">District</label>
                  <input
                    type="text"
                    className="form-input"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    placeholder="e.g. Ludhiana"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', marginTop: '.3rem' }}
                disabled={loading}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Spinner animation="border" size="sm" />
                    Analysing Soil & Climate...
                  </span>
                ) : (
                  "Analyse & Recommend →"
                )}
              </button>
            </form>
          </div>

          {/* Seasonal Overview Card (Placeholder visual) */}
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

        {/* Top Recommended Crops Header (Placeholder visual before submit) */}
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

        {/* Interactive Results */}
        {plan && (
          <div style={{ animation: "fadeInUp 0.5s" }}>

            {/* Crop Image & Header */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              {cropImage && (
                <img
                  src={cropImage}
                  alt={formData.crop}
                  style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '50%', border: '4px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '1rem' }}
                />
              )}
              <h2 style={{ color: 'var(--forest)', fontFamily: 'var(--ff-head)', fontWeight: 700, fontSize: '1.8rem' }}>
                Your {formData.season} Plan for {formData.crop}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Based on data for {formData.district}, {formData.state}
              </p>
            </div>

            {/* PDF Download Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
              <button onClick={handlePrint} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '.8rem', padding: '8px 16px' }}>
                <FaChartLine /> Download PDF Report
              </button>
            </div>

            {/* Suitability Badge */}
            <div className="dash-card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '15px' }}>
              {plan.suitability?.is_suitable ? 
                <FaCheckCircle size={36} color="var(--leaf-bright)" /> : 
                <FaExclamationTriangle size={36} color="#fbbf24" />}
              <div>
                <h4 style={{ fontFamily: 'var(--ff-head)', fontSize: '1.1rem', color: 'var(--forest)', marginBottom: '4px' }}>
                  Suitability Verdict
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 0 }}>
                  {plan.suitability?.analysis} <strong style={{ color: 'var(--forest)' }}>{plan.suitability?.recommendation}</strong>
                </p>
              </div>
            </div>

            {/* 1. Land Prep */}
            <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
              <div className="dash-card-title"><FaTractor className="sidebar-icon" style={{ color: '#fbbf24', marginRight: '8px' }} /> Land Preparation</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {plan.soil_preparation?.steps?.map((step, i) => (
                  <li key={i} style={{ padding: '8px 0', borderBottom: '1px solid rgba(74,222,128,0.15)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                     <span style={{ color: 'var(--leaf)', fontWeight: 'bold', marginTop: '2px' }}>✓</span> {step}
                  </li>
                ))}
              </ul>
              {plan.soil_preparation?.key_tip && (
                <div style={{ backgroundColor: 'var(--mint-light)', border: '1px solid rgba(74,222,128,0.3)', padding: '12px', borderRadius: '8px', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--forest)' }}>
                  <strong>💡 Expert Tip:</strong> {plan.soil_preparation.key_tip}
                </div>
              )}
            </div>

            {/* 1A. Required Inputs */}
            {plan.inputs_required && (
              <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
                <div className="dash-card-title"><FaBoxOpen className="sidebar-icon" style={{ color: '#9ca3af', marginRight: '8px' }} /> Required Farm Inputs</div>
                <div className="dash-grid3" style={{ marginBottom: 0 }}>
                  <div className="rec-card" style={{ borderTop: '4px solid var(--leaf-bright)' }}>
                    <h4>🌱 Seeds</h4>
                    <ul style={{ paddingLeft: '15px', marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {plan.inputs_required.seeds?.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                  <div className="rec-card" style={{ borderTop: '4px solid #3b82f6' }}>
                    <h4>🧪 Fertilizers</h4>
                    <ul style={{ paddingLeft: '15px', marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {plan.inputs_required.fertilizers?.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                  <div className="rec-card" style={{ borderTop: '4px solid #ef4444' }}>
                    <h4>🛡 Pesticides</h4>
                    <ul style={{ paddingLeft: '15px', marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {plan.inputs_required.pesticides?.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Sowing */}
            <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
              <div className="dash-card-title"><FaSeedling className="sidebar-icon" style={{ color: 'var(--leaf-bright)', marginRight: '8px' }} /> Seed Selection & Sowing</div>
              
              <div className="form-lbl" style={{ margin: '1rem 0 0.5rem' }}>Recommended Varieties & Prices</div>
              <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Variety</th>
                      <th>Details</th>
                      <th>Approx. Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.sowing?.varieties?.map((v, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{v.name}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{v.details}</td>
                        <td><span className="pill pill-green">{v.approx_price}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="form-row2">
                <div className="rec-card">
                   <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}><strong>Seed Rate:</strong> {plan.sowing?.seed_rate}</div>
                   <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}><strong>Spacing:</strong> {plan.sowing?.spacing}</div>
                </div>
                <div className="rec-card">
                   <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}><strong>Method:</strong> {plan.sowing?.method}</div>
                   <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}><strong>Treatment:</strong> {plan.sowing?.treatment}</div>
                </div>
              </div>
            </div>

            {/* 3. Fertilizers */}
            <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
              <div className="dash-card-title"><GiFertilizerBag className="sidebar-icon" style={{ color: '#0ea5e9', marginRight: '8px' }} /> Nutrient Management</div>
              <div style={{ overflowX: 'auto' }}>
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Stage</th>
                      <th>Fertilizer</th>
                      <th>Dose</th>
                      <th>Est. Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.fertilizer?.schedule?.map((item, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{item.stage}</td>
                        <td style={{ fontWeight: 600 }}>{item.fertilizer}</td>
                        <td>{item.dose}</td>
                        <td><span className="pill pill-green">{item.approx_price}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Irrigation */}
            <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
              <div className="dash-card-title"><FaWater className="sidebar-icon" style={{ color: '#3b82f6', marginRight: '8px' }} /> Water Management</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '1rem', lineHeight: 1.6 }}>{plan.irrigation?.schedule}</p>
              
              <div className="form-lbl" style={{ marginBottom: '0.5rem' }}>Critical Irrigation Stages</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {plan.irrigation?.critical_stages?.map((stage, i) => (
                  <span key={i} className="pill pill-blue">{stage}</span>
                ))}
              </div>
            </div>

            {/* 5. Protection */}
            <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
              <div className="dash-card-title"><FaBug className="sidebar-icon" style={{ color: '#ef4444', marginRight: '8px' }} /> Plant Protection</div>
              <div className="dash-grid2">
                <div>
                  <div className="form-lbl" style={{ color: '#ef4444', marginBottom: '0.8rem' }}>⚠ Major Pests</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {plan.protection?.pests?.map((pest, i) => (
                      <div key={i} className="rec-card" style={{ borderLeft: '3px solid #ef4444', padding: '10px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>🦗 {pest}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="form-lbl" style={{ color: '#f59e0b', marginBottom: '0.8rem' }}>⚠ Major Diseases</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {plan.protection?.diseases?.map((d, i) => (
                      <div key={i + 100} className="rec-card" style={{ borderLeft: '3px solid #f59e0b', padding: '10px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>🦠 {d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 6. Harvest & Economics */}
            <div className="dash-card">
              <div className="dash-card-title"><GiSickle className="sidebar-icon" style={{ color: 'var(--leaf)', marginRight: '8px' }} /> Harvest & Economics</div>
              <div className="dash-grid2">
                <div>
                  <div className="form-lbl" style={{ marginBottom: '0.5rem' }}>Signs of Maturity</div>
                  <ul style={{ paddingLeft: '15px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                     {plan.harvest?.signs_of_maturity?.map((s, i) => <li key={i} style={{ marginBottom: '4px' }}>{s}</li>)}
                  </ul>
                  <div className="rec-card">
                    <span className="form-lbl" style={{ fontSize: '0.65rem' }}>Storage</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{plan.harvest?.storage}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                   <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--mint-faint)', border: '1px solid rgba(74,222,128,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Est. Cultivation Cost</span>
                     <strong style={{ fontSize: '1.2rem', color: 'var(--forest)' }}>{plan.economics?.estimated_cost}</strong>
                   </div>
                   <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#eff6ff', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <span style={{ fontSize: '0.8rem', color: '#1e3a8a', fontWeight: 600 }}>Est. Yield / Acre</span>
                     <strong style={{ fontSize: '1.2rem', color: '#1d4ed8' }}>{plan.economics?.estimated_yield}</strong>
                   </div>
                   <div style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#fdf4ff', border: '1px solid rgba(217,70,239,0.2)', fontSize: '0.8rem', color: '#701a75', lineHeight: 1.5 }}>
                     💡 {plan.economics?.market_outlook}
                   </div>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* HIDDEN PDF TEMPLATE */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <div id="season-plan-pdf" style={{
            padding: "40px",
            fontFamily: 'Arial, sans-serif',
            color: '#1a1a1a',
            width: '700px',
            backgroundColor: 'white',
            boxSizing: 'border-box'
        }}>
            {/* Header */}
            <div style={{ borderBottom: "3px solid #6A8E23", paddingBottom: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ color: "#4A6317", margin: 0, fontSize: '24px', fontWeight: 'bold' }}><span>AgriVista Season Guide</span></h1>
                    <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}><span>Comprehensive Farming Strategy</span></p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '12px' }}><strong><span>Date:</span></strong> <span>{new Date().toLocaleDateString()}</span></p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px' }}><strong><span>Crop:</span></strong> <span>{formData.crop}</span></p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px' }}><strong><span>Region:</span></strong> <span>{formData.district}</span>, <span>{formData.state}</span></p>
                </div>
            </div>

            {plan && (
                <div>
                    {/* Suitability */}
                    <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: plan.suitability?.is_suitable ? '#e8f5e9' : '#fff3e0', border: '1px solid #ddd', borderRadius: '8px' }}>
                        <h3 style={{ fontSize: '16px', margin: '0 0 5px 0', color: '#333' }}><span>Suitability Verdict</span></h3>
                        <p style={{ margin: 0, fontSize: '12px' }}><span>{plan.suitability?.analysis}</span></p>
                        <strong style={{ fontSize: '12px', display: 'block', marginTop: '5px' }}><span>{plan.suitability?.recommendation}</span></strong>
                    </div>

                    {/* Inputs Section for PDF */}
                    {plan.inputs_required && (
                        <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f9f9f9', border: '1px solid #eee', borderRadius: '8px' }}>
                            <h4 style={{ fontSize: '14px', color: '#4A6317', borderBottom: '1px solid #ccc', paddingBottom: '5px', margin: '0 0 10px 0' }}><span>Required Farm Inputs</span></h4>
                            <div style={{ display: 'flex', gap: '20px', fontSize: '11px' }}>
                                <div style={{ flex: 1 }}>
                                    <strong><span>Seeds:</span></strong>
                                    <ul style={{ paddingLeft: '15px', margin: '5px 0' }}>{plan.inputs_required.seeds?.map((s, i) => <li key={i}><span>{s}</span></li>)}</ul>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <strong><span>Fertilizers:</span></strong>
                                    <ul style={{ paddingLeft: '15px', margin: '5px 0' }}>{plan.inputs_required.fertilizers?.map((s, i) => <li key={i}><span>{s}</span></li>)}</ul>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <strong><span>Protection:</span></strong>
                                    <ul style={{ paddingLeft: '15px', margin: '5px 0' }}>{plan.inputs_required.pesticides?.map((s, i) => <li key={i}><span>{s}</span></li>)}</ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sections Loop */}
                    {[
                        { title: "1. Land Preparation", data: plan.soil_preparation, type: 'list' },
                        { title: "2. Seed Selection & Sowing", data: plan.sowing, type: 'sowing' },
                        { title: "3. Nutrient Management", data: plan.fertilizer, type: 'table' },
                        { title: "4. Water Management", data: plan.irrigation, type: 'text' },
                        { title: "5. Plant Protection", data: plan.protection, type: 'protection' },
                        { title: "6. Harvest & Economics", data: plan.harvest, type: 'harvest' }
                    ].map((section, idx) => (
                        <div key={idx} style={{ marginBottom: '25px' }}>
                            <h4 style={{
                                fontSize: '14px',
                                color: '#4A6317',
                                borderBottom: '1px solid #ccc',
                                paddingBottom: '5px',
                                margin: '0 0 10px 0',
                                textTransform: 'uppercase'
                            }}>
                                <span>{section.title}</span>
                            </h4>

                            {/* Content Rendering based on type */}
                            {section.type === 'list' && (
                                <ul style={{ fontSize: '11px', paddingLeft: '20px', margin: 0 }}>
                                    {section.data?.steps?.map((s, i) => <li key={i} style={{ marginBottom: '4px' }}><span>{s}</span></li>)}
                                    {section.data?.key_tip && <li style={{ marginTop: '8px', fontStyle: 'italic', color: '#d32f2f' }}><span>Tip:</span> <span>{section.data.key_tip}</span></li>}
                                </ul>
                            )}

                            {section.type === 'sowing' && (
                                <div style={{ fontSize: '11px' }}>
                                    <p style={{ margin: '0 0 5px 0' }}><strong><span>Method:</span></strong> <span>{section.data?.method}</span> | <strong><span>Rate:</span></strong> <span>{section.data?.seed_rate}</span> | <strong><span>Spacing:</span></strong> <span>{section.data?.spacing}</span></p>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#f5f5f5' }}>
                                                <th style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'left' }}><span>Variety</span></th>
                                                <th style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'left' }}><span>Details</span></th>
                                                <th style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'left' }}><span>Price</span></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {section.data?.varieties?.map((v, i) => (
                                                <tr key={i}>
                                                    <td style={{ padding: '6px', border: '1px solid #ddd' }}><span>{v.name}</span></td>
                                                    <td style={{ padding: '6px', border: '1px solid #ddd' }}><span>{v.details}</span></td>
                                                    <td style={{ padding: '6px', border: '1px solid #ddd' }}><span>{v.approx_price}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {section.type === 'table' && (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f5f5f5' }}>
                                            <th style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'left' }}><span>Stage</span></th>
                                            <th style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'left' }}><span>Fertilizer</span></th>
                                            <th style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'left' }}><span>Dose</span></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {section.data?.schedule?.map((row, i) => (
                                            <tr key={i}>
                                                <td style={{ padding: '6px', border: '1px solid #ddd' }}><span>{row.stage}</span></td>
                                                <td style={{ padding: '6px', border: '1px solid #ddd' }}><span>{row.fertilizer}</span></td>
                                                <td style={{ padding: '6px', border: '1px solid #ddd' }}><span>{row.dose}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {section.type === 'text' && (
                                <div style={{ fontSize: '11px' }}>
                                    <p style={{ margin: 0 }}><span>{section.data?.schedule}</span></p>
                                    <p style={{ margin: '5px 0 0 0' }}><strong><span>Critical Stages:</span></strong> <span>{section.data?.critical_stages?.join(', ')}</span></p>
                                </div>
                            )}

                            {section.type === 'protection' && (
                                <div style={{ fontSize: '11px', display: 'flex', gap: '20px' }}>
                                    <div style={{ flex: 1 }}>
                                        <strong style={{ margin: 0, display: 'block' }}><span>Pests:</span></strong>
                                        <ul style={{ paddingLeft: '15px', margin: '5px 0' }}>
                                            {section.data?.pests?.map((p, i) => <li key={i}><span>{p}</span></li>)}
                                        </ul>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <strong style={{ margin: 0, display: 'block' }}><span>Diseases:</span></strong>
                                        <ul style={{ paddingLeft: '15px', margin: '5px 0' }}>
                                            {section.data?.diseases?.map((d, i) => <li key={i}><span>{d}</span></li>)}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {section.type === 'harvest' && (
                                <div style={{ fontSize: '11px' }}>
                                    <p style={{ margin: '0 0 5px 0' }}><strong><span>Signs:</span></strong> <span>{section.data?.signs_of_maturity?.join(', ')}</span></p>
                                    <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f9f9f9', borderTop: '2px solid #6A8E23' }}>
                                        <p style={{ margin: 0 }}><strong><span>Yield Estimate:</span></strong> <span>{plan.economics?.estimated_yield}</span></p>
                                        <p style={{ margin: '5px 0 0 0' }}><strong><span>Cost Estimate:</span></strong> <span>{plan.economics?.estimated_cost}</span></p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '15px', textAlign: 'center', fontSize: '10px', color: '#999' }}>
                        <p style={{ margin: 0 }}><span>Generated by AgriVista. Consult local experts before major investment.</span></p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default SeasonPlanner;

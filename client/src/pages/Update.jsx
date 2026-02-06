import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import { GoogleGenAI } from "@google/genai";

const BACKEND_URL = "http://localhost:7000";
const ML_BASE_URL = "http://127.0.0.1:8000";
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const Update = () => {
  const navigate = useNavigate();
  const userId = Cookies.get("id");
  const userName = Cookies.get("username") || "Farmer";

  const [mode, setMode] = useState("crop");
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cropsData, setCropsData] = useState({});
  const [selectedCrop, setSelectedCrop] = useState(null);

  // New Design Colors derived from your reference
  const colors = {
    primaryGreen: "#6A8E23", // Olive
    deepGreen: "#4A6317",
    creamBg: "#F9F8F3",
    textDark: "#2C3322"
  };

  const [formData, setFormData] = useState({
    Nitrogen: "50", Phosphorus: "50", Potassium: "50", Temperature: "25",
    Humidity: "60", Rainfall: "100", pH: "7", Crop: "Maize",
    SoilType: "Sandy", NDVI_Index: "0.5", SoilMoisture: "30", TotalDays: "120"
  });

  useEffect(() => { if (!userId) navigate("/login"); }, [userId, navigate]);

  const visibleFields = useMemo(() => {
    const fields = {
      crop: ["Nitrogen", "Phosphorus", "Potassium", "Temperature", "Humidity", "Rainfall", "pH"],
      fertilizer: ["Crop", "SoilType", "Nitrogen", "Phosphorus", "Potassium"],
      yield: ["Crop", "SoilMoisture", "Temperature", "Humidity", "Rainfall", "pH", "NDVI_Index", "TotalDays"]
    };
    return fields[mode] || [];
  }, [mode]);

  const fixCropName = (name) => {
    let n = name.toLowerCase().replace(/s$/, '');
    if (n === "pigeonpea") n = "pigeon pea";
    return n.charAt(0).toUpperCase() + n.slice(1);
  };

  const getSmartAdvisory = async (soilData, cropName) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          role: "user",
          parts: [{ text: `Role: Agricultural Scientist. Provide tech advisory for "${cropName}" based on N:${soilData.Nitrogen}, P:${soilData.Phosphorus}, K:${soilData.Potassium}, pH:${soilData.pH}. Return ONLY JSON: {"rationale": "...", "fertilizer": "...", "planning": "...", "soilHealth": "..."}`}]
        }]
      });
      return JSON.parse(response.text.replace(/```json|```/g, "").trim());
    } catch (err) {
      console.error("AI Advisory Failed:", err);
      return null;
    }
  };

  const fetchCropTechnicalData = async (cropNames) => {
    const requests = cropNames.map(async (name) => {
      if (cropsData[name]) return [name, cropsData[name]];
      try {
        const cleanName = fixCropName(name);
        const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${cleanName.replace(/\s+/g, '_')}`;
        const [wikiRes, aiAdvice] = await Promise.all([
          axios.get(wikiUrl).catch(() => null),
          getSmartAdvisory(formData, name)
        ]);
        return [name, {
          image: wikiRes?.data?.thumbnail?.source || `https://placehold.co/400x400?text=${name}`,
          rationale: aiAdvice?.rationale || `Suitable conditions for ${name}.`,
          fertilizer: aiAdvice?.fertilizer || "Apply balanced NPK.",
          planning: aiAdvice?.planning || "Regular monitoring.",
          soilHealth: aiAdvice?.soilHealth || "Maintain soil pH."
        }];
      } catch (err) {
        return [name, { image: `https://placehold.co/400x400?text=${name}`, rationale: "Compatible.", fertilizer: "NPK.", planning: "Monitor.", soilHealth: "Check pH." }];
      }
    });
    const results = await Promise.all(requests);
    setCropsData(prev => ({ ...prev, ...Object.fromEntries(results) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setPrediction(null); setError("");
    try {
      const numData = Object.fromEntries(Object.entries(formData).map(([k, v]) => [k, isNaN(v) || v === "" ? v : +v]));
      let res;
      if (mode === "crop") {
        res = await axios.post(`${ML_BASE_URL}/predict-crop`, numData);
        const probs = res.data.probabilities || {};
        setPrediction(probs);
        await fetchCropTechnicalData(Object.keys(probs).slice(0, 4));
      } else if (mode === "fertilizer") {
        res = await axios.post(`${ML_BASE_URL}/predict-fertilizer`, { ...numData, soil_type: formData.SoilType, crop_type: formData.Crop });
        setPrediction(res.data.recommended_fertilizer);
      } else if (mode === "yield") {
        res = await axios.post(`${ML_BASE_URL}/predict-yield`, { ...numData, NDVI_index: numData.NDVI_Index, total_days: numData.TotalDays });
        setPrediction(res.data.estimated_yield);
      }
    } catch (err) { setError("Analysis failed."); }
    finally { setLoading(false); }
  };

  const handlePrint = () => {
    const element = document.getElementById("pdf-content");
    const opt = {
      margin: 10,
      filename: `AgriVista_Report_${userName}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="container-fluid py-5" style={{ backgroundColor: colors.creamBg, minHeight: "100vh" }}>
      <div className="mx-auto" style={{ maxWidth: "1100px" }}>
        
        {/* Updated Heading style to match Landing Page branding */}
        <div className="text-center mb-5">
            <h2 className="fw-bold mb-1" style={{ color: colors.deepGreen, fontFamily: 'serif', fontSize: '2.5rem' }}>Precision Advisory Hub</h2>
            <div style={{ width: '60px', height: '3px', backgroundColor: colors.primaryGreen, margin: '10px auto' }}></div>
            <p className="text-muted">Empowering {userName} with real-time AI agricultural insights.</p>
        </div>

        {/* Prediction Results UI - Re-styled for premium feel */}
        {prediction && (
          <div className="mb-5 animate-fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
              <h5 className="fw-bold m-0" style={{ color: colors.textDark }}>Generated Recommendations:</h5>
              <button onClick={handlePrint} className="btn btn-sm px-4 shadow-sm text-white" style={{ backgroundColor: colors.deepGreen, borderRadius: '50px' }}>
                <i className="bi bi-download me-2"></i>Download PDF Report
              </button>
            </div>
            
            {mode === "crop" ? (
              <div className="row g-4">
                {Object.entries(prediction).slice(0, 4).map(([crop, prob], idx) => (
                  <div key={crop} className={idx === 0 ? "col-12 mb-2" : "col-md-4"}>
                    <div 
                      className="card border-0 shadow-sm overflow-hidden" 
                      style={{ cursor: 'pointer', borderRadius: '15px', transition: '0.3s' }} 
                      onClick={() => setSelectedCrop(crop)}
                    >
                      <div className="row g-0 align-items-center">
                        <div className={idx === 0 ? "col-md-4" : "col-12"}>
                          <img src={cropsData[crop]?.image} className="img-fluid" style={{ height: idx === 0 ? '200px' : '150px', width: '100%', objectFit: 'cover' }} alt={crop} />
                        </div>
                        <div className={idx === 0 ? "col-md-8 p-4" : "col-12 p-3 text-center"}>
                          <h4 className="fw-bold text-capitalize mb-2" style={{ color: colors.deepGreen }}>{idx === 0 ? `⭐ Recommended: ${crop}` : crop}</h4>
                          <div className="progress mb-2" style={{ height: '8px', backgroundColor: '#eef2eb' }}>
                            <div className="progress-bar" style={{ width: `${prob}%`, backgroundColor: colors.primaryGreen }}></div>
                          </div>
                          <p className="mb-0 small text-muted">AI Confidence Level: <strong>{prob}%</strong></p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card border-0 shadow-sm text-center py-5 rounded-4 bg-white border-start border-5" style={{ borderColor: colors.primaryGreen }}>
                 <h6 className="text-muted fw-bold text-uppercase mb-2" style={{ letterSpacing: '2px' }}>{mode} Analysis Results</h6>
                 <span className="display-4 fw-bold" style={{ color: colors.deepGreen }}>{prediction} {mode === 'yield' ? 'tons/ha' : ''}</span>
              </div>
            )}
          </div>
        )}

        {/* Input Form - Redesigned to match Inquiry Card aesthetic */}
        <div className="card border-0 shadow-lg p-5 mb-5 rounded-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-4">
              <div className="col-12 mb-2">
                <label className="fw-bold mb-2 text-uppercase small" style={{ color: colors.primaryGreen, letterSpacing: '1px' }}>Service Mode</label>
                <select className="form-select border-2 py-3 rounded-3" style={{ borderColor: '#eef2eb' }} value={mode} onChange={(e) => {setMode(e.target.value); setPrediction(null);}}>
                  <option value="crop">🌱 Intelligent Crop Selection</option>
                  <option value="fertilizer">🌿 Fertilizer Requirement Advisor</option>
                  <option value="yield">🌾 Harvest Yield Forecaster</option>
                </select>
              </div>
              
              {visibleFields.map((field) => (
                <div className="col-md-4" key={field}>
                  <label className="small fw-bold text-secondary text-uppercase mb-1">{field.replace(/([A-Z])/g, ' $1')}</label>
                  <input 
                    name={field} 
                    type={field === "Crop" || field === "SoilType" ? "text" : "number"} 
                    className="form-control border-2 py-2" 
                    style={{ borderRadius: '8px', borderColor: '#eef2eb' }}
                    onChange={(e) => setFormData({...formData, [field]: e.target.value})} 
                    value={formData[field]} 
                    required 
                  />
                </div>
              ))}
            </div>
            <button 
              type="submit" 
              className="btn w-100 py-3 fw-bold mt-5 shadow text-white" 
              style={{ backgroundColor: colors.primaryGreen, borderRadius: '50px', fontSize: '1.1rem' }}
              disabled={loading}
            >
              {loading ? "GENERATING INSIGHTS..." : "START AI DIAGNOSIS"}
            </button>
          </form>
        </div>

        {/* Modal - Re-styled for premium feel */}
        {selectedCrop && cropsData[selectedCrop] && (
          <div className="modal show d-block" style={{backgroundColor: 'rgba(44, 51, 34, 0.95)'}} onClick={() => setSelectedCrop(null)}>
            <div className="modal-dialog modal-lg modal-dialog-centered" onClick={e => e.stopPropagation()}>
              <div className="modal-content border-0 overflow-hidden rounded-4">
                <div className="modal-header text-white py-3 border-0" style={{ backgroundColor: colors.deepGreen }}>
                  <h5 className="modal-title fw-bold text-capitalize">{selectedCrop} Technical Advisory</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedCrop(null)}></button>
                </div>
                <div className="modal-body p-5 bg-white">
                    <div className="row g-4">
                        <div className="col-md-5">
                          <img src={cropsData[selectedCrop].image} className="img-fluid rounded-4 shadow-sm mb-3" alt="crop"/>
                          <div className="p-3 rounded-3 border" style={{ backgroundColor: colors.creamBg }}>
                            <h6 className="fw-bold small text-uppercase" style={{ color: colors.primaryGreen }}>Soil Rationale</h6>
                            <p className="text-muted small mb-0">{cropsData[selectedCrop].rationale}</p>
                          </div>
                        </div>
                        <div className="col-md-7">
                            <h6 className="fw-bold" style={{ color: colors.deepGreen }}>Fertilizer Suggestion</h6>
                            <p className="p-3 border-start border-4 small shadow-sm" style={{ borderColor: colors.primaryGreen, backgroundColor: '#fcfdfa' }}>{cropsData[selectedCrop].fertilizer}</p>
                            
                            <h6 className="fw-bold mt-4" style={{ color: colors.deepGreen }}>Management Strategy</h6>
                            <p className="p-3 border-start border-4 small shadow-sm" style={{ borderColor: colors.primaryGreen, backgroundColor: '#fcfdfa' }}>{cropsData[selectedCrop].planning}</p>
                            
                            <h6 className="fw-bold mt-4" style={{ color: colors.deepGreen }}>Soil Health Directives</h6>
                            <p className="p-3 border-start border-4 small shadow-sm" style={{ borderColor: colors.primaryGreen, backgroundColor: '#fcfdfa' }}>{cropsData[selectedCrop].soilHealth}</p>
                        </div>
                    </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* PDF Template - Kept exactly as requested */}
        {/* ========================================== */}
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div id="pdf-content" style={{ padding: "40px", width: "700px", backgroundColor: "#ffffff", fontFamily: "'Helvetica', sans-serif" }}>
            <div style={{ textAlign: "center", borderBottom: `4px solid ${colors.primaryGreen}`, paddingBottom: "15px" }}>
              <h1 style={{ color: colors.deepGreen, fontSize: "32px", margin: 0 }}>AgriVista Precision Report</h1>
              <p style={{ color: "#777", fontSize: "12px", letterSpacing: "2px" }}>AI-DRIVEN AGRICULTURAL ANALYSIS</p>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", margin: "25px 0", fontSize: "14px" }}>
              <div>
                <p><strong>Farmer:</strong> {userName}</p>
                <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ color: colors.primaryGreen, fontWeight: "bold", textTransform: "uppercase" }}>{mode} Analysis</p>
              </div>
            </div>
            <div style={{ backgroundColor: "#f9faf8", padding: "15px", borderRadius: "8px", marginBottom: "25px", border: "1px solid #eef2eb" }}>
              <h4 style={{ color: colors.deepGreen, fontSize: "16px", marginBottom: "10px" }}>Field Input Data</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {visibleFields.map(field => (
                  <div key={field} style={{ width: "30%", fontSize: "12px" }}>
                    <span style={{ color: "#888", fontSize: "9px" }}>{field}</span><br /><strong>{formData[field]}</strong>
                  </div>
                ))}
              </div>
            </div>
            {mode === "crop" && prediction ? (
              <div>
                {Object.entries(prediction).slice(0, 4).map(([crop, prob]) => (
                  <div key={crop} style={{ marginBottom: "30px", border: "1px solid #e0e0e0", borderRadius: "10px", overflow: "hidden", pageBreakInside: "avoid" }}>
                    <div style={{ backgroundColor: colors.deepGreen, color: "white", padding: "10px 15px", display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: "bold", textTransform: "capitalize" }}>{crop}</span>
                      <span>Confidence: {prob}%</span>
                    </div>
                    <div style={{ display: "flex", padding: "15px" }}>
                      <img src={cropsData[crop]?.image} style={{ width: "140px", height: "140px", objectFit: "cover", borderRadius: "6px" }} alt={crop} />
                      <div style={{ marginLeft: "20px", flex: 1 }}>
                         <p style={{ fontSize: "12px", marginBottom: "10px" }}><strong>Rationale:</strong> {cropsData[crop]?.rationale}</p>
                         <p style={{ fontSize: "12px", marginBottom: "10px" }}><strong>Fertilizer:</strong> {cropsData[crop]?.fertilizer}</p>
                         <div style={{ display: "flex", gap: "15px", fontSize: "11px" }}>
                            <div style={{ flex: 1 }}><strong>Planning:</strong> {cropsData[crop]?.planning}</div>
                            <div style={{ flex: 1 }}><strong>Soil Health:</strong> {cropsData[crop]?.soilHealth}</div>
                         </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "40px", textAlign: "center", border: `2px dashed ${colors.primaryGreen}`, borderRadius: "15px" }}>
                <h2>Result: {prediction} {mode === 'yield' ? 'tons/ha' : ''}</h2>
              </div>
            )}
            <div style={{ marginTop: "40px", textAlign: "center", borderTop: "1px solid #eee", paddingTop: "15px" }}>
              <p style={{ color: colors.primaryGreen, fontWeight: "bold", fontSize: "14px" }}>"Precision Seeds for Prolific Harvests."</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Update;
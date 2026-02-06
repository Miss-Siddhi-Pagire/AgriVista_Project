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
    <div className="container-fluid py-4" style={{ backgroundColor: "#f4f7f4", minHeight: "100vh" }}>
      <div className="mx-auto" style={{ maxWidth: "1000px" }}>
        <h3 className="text-center fw-bold text-success mb-4">AgriVista Smart Advisory Hub 🚜</h3>

        {/* Prediction Results UI */}
        {prediction && (
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold m-0 text-dark">Analysis Result:</h5>
              <button onClick={handlePrint} className="btn btn-dark btn-sm px-4 shadow-sm">Download Detailed PDF</button>
            </div>
            {mode === "crop" ? (
              <div className="row g-3">
                {Object.entries(prediction).slice(0, 4).map(([crop, prob], idx) => (
                  <div key={crop} className={idx === 0 ? "col-12 mb-2" : "col-md-4"}>
                    <div className={`card border-0 shadow-sm ${idx === 0 ? 'bg-success text-white' : 'bg-white'}`} style={{ cursor: 'pointer' }} onClick={() => setSelectedCrop(crop)}>
                      <div className="row g-0 align-items-center">
                        <div className={idx === 0 ? "col-md-3" : "col-12"}>
                          <img src={cropsData[crop]?.image} className="img-fluid rounded" style={{ height: idx === 0 ? '160px' : '120px', width: '100%', objectFit: 'cover' }} alt={crop} />
                        </div>
                        <div className={idx === 0 ? "col-md-9 p-4" : "col-12 p-3 text-center"}>
                          <h5 className="fw-bold text-capitalize mb-1">{idx === 0 ? `⭐ ${crop}` : crop}</h5>
                          <p className="mb-0 opacity-75">Confidence: {prob}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card border-0 shadow-sm text-center py-5 bg-white">
                 <h6 className="text-success fw-bold text-uppercase mb-2">{mode} RESULT</h6>
                 <span className="display-5 fw-bold text-dark">{prediction} {mode === 'yield' ? 'tons/ha' : ''}</span>
              </div>
            )}
          </div>
        )}

        {/* Input Form */}
        <div className="card border-0 shadow-sm p-4 mb-5">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-12 mb-4">
                <label className="fw-bold mb-2">Service Type</label>
                <select className="form-select border-2 py-2" value={mode} onChange={(e) => {setMode(e.target.value); setPrediction(null);}}>
                  <option value="crop">🌱 Crop Recommendation</option>
                  <option value="fertilizer">🌿 Fertilizer Recommendation</option>
                  <option value="yield">🌾 Yield Prediction</option>
                </select>
              </div>
              {visibleFields.map((field) => (
                <div className="col-md-4 mb-3" key={field}>
                  <label className="small fw-bold text-secondary text-uppercase">{field.replace(/([A-Z])/g, ' $1')}</label>
                  <input name={field} type={field === "Crop" || field === "SoilType" ? "text" : "number"} className="form-control border-2" onChange={(e) => setFormData({...formData, [field]: e.target.value})} value={formData[field]} required />
                </div>
              ))}
            </div>
            <button type="submit" className="btn btn-success w-100 py-3 fw-bold mt-3 shadow" disabled={loading}>{loading ? "PROCESSING..." : "RUN AI ANALYSIS"}</button>
          </form>
        </div>

        {/* Modal for detail view */}
        {selectedCrop && cropsData[selectedCrop] && (
          <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.8)'}} onClick={() => setSelectedCrop(null)}>
            <div className="modal-dialog modal-lg modal-dialog-centered" onClick={e => e.stopPropagation()}>
              <div className="modal-content border-0 overflow-hidden">
                <div className="modal-header bg-success text-white py-3">
                  <h5 className="modal-title fw-bold text-capitalize">{selectedCrop} Analysis</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedCrop(null)}></button>
                </div>
                <div className="modal-body p-4 bg-light text-start">
                    <div className="row g-4">
                        <div className="col-md-4"><img src={cropsData[selectedCrop].image} className="img-fluid rounded-4 shadow-sm" alt="crop"/></div>
                        <div className="col-md-8">
                            <h6 className="text-success fw-bold">WHY THIS CROP?</h6>
                            <p className="text-muted small">{cropsData[selectedCrop].rationale}</p>
                            <h6 className="text-success fw-bold mt-4">FERTILIZER SUGGESTION</h6>
                            <p className="p-3 bg-white border-start border-4 border-success rounded small shadow-sm">{cropsData[selectedCrop].fertilizer}</p>
                        </div>
                        <div className="col-12">
                            <h6 className="text-success fw-bold">CULTIVATION PLANNING</h6>
                            <p className="p-3 bg-white border-start border-4 border-success rounded small shadow-sm">{cropsData[selectedCrop].planning}</p>
                            <h6 className="text-success fw-bold mt-3">SOIL HEALTH ACTION</h6>
                            <p className="p-3 bg-white border-start border-4 border-success rounded small shadow-sm">{cropsData[selectedCrop].soilHealth}</p>
                        </div>
                    </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* HIDDEN PDF TEMPLATE - FIXED WIDTH FOR NO CUTTING */}
        {/* ========================================== */}
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div id="pdf-content" style={{ 
            padding: "40px", 
            width: "700px", /* FIXED WIDTH TO FIT A4 PORTRAIT */
            backgroundColor: "#ffffff", 
            fontFamily: "'Helvetica', 'Arial', sans-serif",
            boxSizing: "border-box" /* ENSURES PADDING DOESN'T INCREASE WIDTH */
          }}>
            
            {/* Project Header */}
            <div style={{ textAlign: "center", borderBottom: "4px solid #198754", paddingBottom: "15px" }}>
              <h1 style={{ color: "#198754", fontSize: "32px", margin: 0 }}>AgriVista Hub</h1>
              <p style={{ color: "#555", fontSize: "12px", marginTop: "5px", letterSpacing: "1px" }}>PRECISION AGRICULTURAL ADVISORY</p>
            </div>

            {/* User Meta */}
            <div style={{ display: "flex", justifyContent: "space-between", margin: "25px 0", fontSize: "14px" }}>
              <div>
                <p style={{ margin: "2px 0" }}><strong>Farmer:</strong> {userName}</p>
                <p style={{ margin: "2px 0" }}><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ color: "#198754", fontWeight: "bold", textTransform: "uppercase" }}>
                   {mode} Analysis Report
                </p>
              </div>
            </div>

            {/* Input Parameters Section */}
            <div style={{ backgroundColor: "#f9f9f9", padding: "15px", borderRadius: "8px", marginBottom: "25px" }}>
              <h4 style={{ color: "#333", fontSize: "16px", borderBottom: "1px solid #ddd", paddingBottom: "8px", marginBottom: "10px" }}>Field Data Summary</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {visibleFields.map(field => (
                  <div key={field} style={{ width: "30%", fontSize: "12px", marginBottom: "5px" }}>
                    <span style={{ color: "#888", textTransform: "uppercase", fontSize: "9px" }}>{field}</span>
                    <br /><strong>{formData[field]}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Content */}
            {mode === "crop" && prediction ? (
              <div>
                <h3 style={{ color: "#198754", fontSize: "18px", marginBottom: "15px" }}>Top Recommended Crops</h3>
                {Object.entries(prediction).slice(0, 4).map(([crop, prob]) => (
                  <div key={crop} style={{ 
                    marginBottom: "30px", 
                    border: "1px solid #e0e0e0", 
                    borderRadius: "10px", 
                    overflow: "hidden", 
                    pageBreakInside: "avoid",
                    width: "100%" 
                  }}>
                    <div style={{ backgroundColor: "#198754", color: "white", padding: "8px 15px", display: "flex", justifyContent: "space-between", fontSize: "16px" }}>
                      <span style={{ fontWeight: "bold", textTransform: "capitalize" }}>{crop}</span>
                      <span>Confidence: {prob}%</span>
                    </div>
                    <div style={{ display: "flex", padding: "15px", boxSizing: "border-box" }}>
                      <img src={cropsData[crop]?.image} style={{ width: "150px", height: "150px", objectFit: "cover", borderRadius: "6px" }} alt={crop} />
                      <div style={{ marginLeft: "20px", flex: 1 }}>
                         <div style={{ marginBottom: "10px" }}>
                            <strong style={{ color: "#198754", fontSize: "11px", display: "block" }}>EXPERT RATIONALE</strong>
                            <p style={{ fontSize: "12px", margin: "3px 0", lineHeight: "1.4" }}>{cropsData[crop]?.rationale}</p>
                         </div>
                         <div style={{ marginBottom: "10px" }}>
                            <strong style={{ color: "#198754", fontSize: "11px", display: "block" }}>FERTILIZER ADVISORY</strong>
                            <p style={{ fontSize: "12px", margin: "3px 0", fontStyle: "italic", lineHeight: "1.4" }}>{cropsData[crop]?.fertilizer}</p>
                         </div>
                         <div style={{ display: "flex", gap: "15px" }}>
                            <div style={{ flex: 1 }}>
                               <strong style={{ color: "#198754", fontSize: "11px" }}>PLANNING</strong>
                               <p style={{ fontSize: "11px", margin: "3px 0" }}>{cropsData[crop]?.planning}</p>
                            </div>
                            <div style={{ flex: 1 }}>
                               <strong style={{ color: "#198754", fontSize: "11px" }}>SOIL HEALTH</strong>
                               <p style={{ fontSize: "11px", margin: "3px 0" }}>{cropsData[crop]?.soilHealth}</p>
                            </div>
                         </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "30px", textAlign: "center", border: "2px dashed #198754", borderRadius: "15px" }}>
                <h2 style={{ color: "#333", margin: 0 }}>Result: {prediction} {mode === 'yield' ? 'tons/ha' : ''}</h2>
              </div>
            )}

            {/* Tagline Footer */}
            <div style={{ marginTop: "40px", textAlign: "center", borderTop: "1px solid #f0f0f0", paddingTop: "15px" }}>
              <p style={{ color: "#198754", fontWeight: "bold", fontStyle: "italic", fontSize: "14px", margin: 0 }}>
                "Sowing Data, Harvesting Prosperity."
              </p>
              <p style={{ fontSize: "9px", color: "#999", marginTop: "8px" }}>
                AgriVista Hub AI Advisory • Final Year Computer Engg Project © 2026
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Update;
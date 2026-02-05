import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";

const BACKEND_URL = "http://localhost:7000";
const ML_BASE_URL = "http://127.0.0.1:8000";

const Update = () => {
  const navigate = useNavigate();
  const userId = Cookies.get("id");
  const userName = Cookies.get("username") || "Farmer";

  const [mode, setMode] = useState("crop");
  const [prediction, setPrediction] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    return fields[mode];
  }, [mode]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (type === "number" && value < 0) {
      setError(`${name} cannot be negative.`);
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setPrediction(null); setError("");
    try {
      const numData = Object.fromEntries(Object.entries(formData).map(([k, v]) => [k, isNaN(v) || v === "" ? v : +v]));
      let res;

      if (mode === "crop") {
        res = await axios.post(`${ML_BASE_URL}/predict-crop`, numData);
        setPrediction(res.data.probabilities || {}); 
        await axios.post(`${BACKEND_URL}/data`, { 
            id: userId, service: "crop", inputs: numData, prediction: res.data.recommended_crop 
        });
      } else if (mode === "fertilizer") {
        res = await axios.post(`${ML_BASE_URL}/predict-fertilizer`, { 
          Nitrogen: numData.Nitrogen, Phosphorus: numData.Phosphorus, Potassium: numData.Potassium, 
          soil_type: formData.SoilType, crop_type: formData.Crop 
        });
        setPrediction(res.data.recommended_fertilizer);
        await axios.post(`${BACKEND_URL}/api/fertilizer`, { id: userId, ...numData, RecommendedFertilizer: res.data.recommended_fertilizer });
      } else if (mode === "yield") {
        res = await axios.post(`${ML_BASE_URL}/predict-yield`, {
          soil_moisture: numData.SoilMoisture, pH: numData.pH, temperature: numData.Temperature,
          rainfall: numData.Rainfall, humidity: numData.Humidity, NDVI_index: numData.NDVI_Index, total_days: numData.TotalDays
        });
        setPrediction(res.data.estimated_yield);
        await axios.post(`${BACKEND_URL}/api/yield`, { id: userId, ...numData, PredictedYield: res.data.estimated_yield });
      }
    } catch (err) { setError("Analysis failed. Please check connection."); }
    finally { setLoading(false); }
  };

  const handlePrint = () => {
    const element = document.getElementById("pdf-content");
    // Dynamic naming based on user and service type
    const customFilename = `${userName.replace(/\s+/g, '_')}_${mode}_Report.pdf`;

    html2pdf().set({ 
        margin: 0.5, 
        filename: customFilename, 
        html2canvas: { scale: 2 }, 
        jsPDF: { format: 'a4', orientation: 'portrait' }
    }).from(element).save();
  };

  const renderCropResults = () => {
    if (!prediction || typeof prediction !== 'object') return null;
    const entries = Object.entries(prediction);
    const [bestCrop, ...otherCrops] = entries;

    return (
      <div className="mt-3">
        <div className="card text-center mb-4 shadow-sm border-0" style={{ backgroundColor: "#e8f5e9" }}>
          <div className="card-body py-4">
            <h6 className="text-success text-uppercase fw-bold mb-2">Best Recommendation</h6>
            <h2 className="card-title text-capitalize mb-1" style={{ color: "#2d6a4f" }}>⭐ {bestCrop[0]}</h2>
            <p className="fs-5 text-muted mb-0">{bestCrop[1]}% Accuracy Score</p>
          </div>
        </div>

        {otherCrops.length > 0 && (
          <div className="row g-3">
            {otherCrops.map(([crop, prob]) => (
              <div key={crop} className="col-md-4">
                <div className="card h-100 text-center shadow-sm border-0" style={{ backgroundColor: "#f0f7ff" }}>
                  <div className="card-body py-3">
                    <h6 className="text-primary text-uppercase small fw-bold mb-2">Near Match</h6>
                    <h5 className="card-title text-capitalize mb-1">{crop}</h5>
                    <p className="fw-bold text-dark mb-0">{prob}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="d-flex justify-content-center py-3" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <div className="card shadow-sm p-4" style={{ width: "95%", maxWidth: "900px" }}>
        <h3 className="mb-4 text-center fw-bold">AgriVista Insights Hub 📊</h3>
        {error && <div className="alert alert-danger fw-bold">{error}</div>}

        {prediction && (
          <div className="mb-4">
            <div className="d-flex justify-content-between mb-2 align-items-center">
              <h5 className="mb-0 fw-bold">Analysis Output:</h5>
              <button onClick={handlePrint} className="btn btn-outline-dark btn-sm">Download PDF Report</button>
            </div>
            {mode === "crop" ? (
              renderCropResults()
            ) : (
              <div className="card border-0 shadow-sm text-center py-4" style={{ backgroundColor: "#fff3e0" }}>
                 <h6 className="text-warning text-uppercase fw-bold mb-2">Prediction Result</h6>
                 <span className="fs-3 fw-bold">{prediction} {mode === 'yield' ? 'tons/ha' : ''}</span>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="border-top pt-4">
          <div className="mb-4">
            <label className="form-label fw-bold">Service Type</label>
            <select className="form-select fw-bold border-2" value={mode} onChange={(e) => {setMode(e.target.value); setPrediction(null);}}>
              <option value="crop">🌱 Crop Recommendation</option>
              <option value="fertilizer">🌿 Fertilizer Recommendation</option>
              <option value="yield">🌾 Yield Prediction</option>
            </select>
          </div>
          <div className="row">
            {visibleFields.map((field) => (
              <div className="col-md-6 mb-3" key={field}>
                <label className="form-label small fw-bold text-secondary">{field.replace(/([A-Z])/g, ' $1')}</label>
                <input name={field} type={field === "Crop" || field === "SoilType" ? "text" : "number"} className="form-control" onChange={handleChange} value={formData[field]} min="0" required />
              </div>
            ))}
          </div>
          <button type="submit" className="btn btn-success w-100 py-2 mt-2 fw-bold shadow-sm" disabled={loading}>
            {loading ? "Analyzing Data..." : "Generate Analysis"}
          </button>
        </form>

        {/* --- HIDDEN PROFESSIONAL REPORT CONTENT --- */}
        <div style={{ display: "none" }}>
          <div id="pdf-content" style={{ padding: "40px", fontFamily: 'Arial, sans-serif', color: '#333' }}>
            <div style={{ textAlign: 'center', borderBottom: '3px solid #198754', paddingBottom: '10px', marginBottom: '20px' }}>
              <h1 style={{ color: '#198754', margin: '0' }}>AgriVista Agricultural Report</h1>
              <p style={{ color: '#666', fontSize: '14px' }}>Precision Farming Advice & Analytics</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
              <div>
                <p style={{ margin: '2px 0' }}><strong>Farmer:</strong> {userName}</p>
                <p style={{ margin: '2px 0' }}><strong>Report Type:</strong> {mode.toUpperCase()}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '2px 0' }}><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                <p style={{ margin: '2px 0' }}><strong>Report ID:</strong> #AV-{Math.floor(Math.random() * 100000)}</p>
              </div>
            </div>

            <h4 style={{ color: '#198754', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>Data Inputs</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '30px', fontSize: '13px' }}>
              {visibleFields.map(field => (
                <div key={field}><strong>{field.replace(/([A-Z])/g, ' $1')}:</strong> {formData[field]}</div>
              ))}
            </div>

            <h4 style={{ color: '#198754', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>Analysis Suggestions</h4>
            <div style={{ padding: '20px', backgroundColor: '#e8f5e9', borderRadius: '8px', border: '1px solid #c8e6c9' }}>
              {mode === "crop" ? (
                <div>
                  <p style={{ marginBottom: '15px' }}>Based on your soil parameters, the following crops are recommended in order of suitability:</p>
                  {Object.entries(prediction || {}).map(([crop, prob], index) => (
                    <div key={crop} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: index === 0 ? '2px solid #2d6a4f' : '1px solid #ddd' }}>
                      <span style={{ fontWeight: index === 0 ? 'bold' : 'normal', fontSize: index === 0 ? '18px' : '15px', textTransform: 'capitalize' }}>
                        {index === 0 ? `⭐ ${crop} (Recommended)` : `${index + 1}. ${crop}`}
                      </span>
                      <span style={{ fontWeight: 'bold' }}>{prob}% Score</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <p>The calculated result for your {mode} analysis is:</p>
                  <h2 style={{ color: '#2d6a4f', margin: '10px 0' }}>{prediction} {mode === 'yield' ? 'tons/ha' : ''}</h2>
                </div>
              )}
            </div>

            <div style={{ marginTop: '50px', fontSize: '11px', color: '#999', borderTop: '1px solid #eee', paddingTop: '10px', textAlign: 'justify' }}>
              <p><strong>Disclaimer:</strong> This report is generated by a Machine Learning model. Environmental factors not captured in the input data may affect actual outcomes. AgriVista recommends cross-referencing these results with local agricultural extensions.</p>
              <p style={{ textAlign: 'center', marginTop: '10px' }}>© 2026 AgriVista Insights Hub</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Update;
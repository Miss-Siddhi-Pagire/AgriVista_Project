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
  // Assuming 'name' or 'username' is stored in cookies. Fallback to 'Farmer'
  const userName = Cookies.get("username") || "Farmer"; 

  const [mode, setMode] = useState("crop");
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    Crop: "", SoilType: "", Nitrogen: "", Phosphorus: "", Potassium: "",
    Temperature: "", Humidity: "", Rainfall: "", pH: "", 
    NDVI_Index: "", SoilMoisture: "", TotalDays: ""
  });

  useEffect(() => {
    if (!userId) navigate("/login");
  }, [userId, navigate]);

  const visibleFields = useMemo(() => {
    const fields = {
      crop: ["Nitrogen", "Phosphorus", "Potassium", "Temperature", "Humidity", "Rainfall", "pH"],
      fertilizer: ["Crop", "SoilType", "Nitrogen", "Phosphorus", "Potassium"],
      yield: ["Crop", "SoilMoisture", "Temperature", "Humidity", "Rainfall", "pH", "NDVI_Index", "TotalDays"]
    };
    return fields[mode];
  }, [mode]);

  // DYNAMIC FILENAME LOGIC
  const handlePrint = () => {
    const element = document.getElementById("pdf-content");
    
    // Format the mode name for the filename
    const reportType = mode === "crop" ? "Crop_Recommendation" : 
                       mode === "fertilizer" ? "Fertilizer_Report" : "Yield_Prediction";
    
    const fileName = `${userName.replace(/\s+/g, '_')}_${reportType}_Report.pdf`;

    const opt = {
      margin: 0.5,
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPrediction(null);
    setError("");
    try {
      let response;
      const numericData = Object.fromEntries(
        Object.entries(formData).map(([k, v]) => [k, isNaN(v) || v === "" ? v : +v])
      );

      if (mode === "crop") {
        response = await axios.post(`${ML_BASE_URL}/predict-crop`, numericData);
        const result = response.data.recommended_crop;
        setPrediction(result);
        await axios.post(`${BACKEND_URL}/data`, { id: userId, service: "crop", inputs: numericData, prediction: result });
      } else if (mode === "fertilizer") {
        response = await axios.post(`${ML_BASE_URL}/predict-fertilizer`, {
          Nitrogen: numericData.Nitrogen, Phosphorus: numericData.Phosphorus,
          Potassium: numericData.Potassium, soil_type: formData.SoilType, crop_type: formData.Crop
        });
        const result = response.data.recommended_fertilizer;
        setPrediction(result);
        await axios.post(`${BACKEND_URL}/api/fertilizer`, { id: userId, ...numericData, RecommendedFertilizer: result });
      } else if (mode === "yield") {
        response = await axios.post(`${ML_BASE_URL}/predict-yield`, {
            soil_moisture: numericData.SoilMoisture, pH: numericData.pH,
            temperature: numericData.Temperature, rainfall: numericData.Rainfall,
            humidity: numericData.Humidity, NDVI_index: numericData.NDVI_Index,
            total_days: numericData.TotalDays
        });
        const result = response.data.estimated_yield;
        setPrediction(result);
        await axios.post(`${BACKEND_URL}/api/yield`, { id: userId, ...numericData, PredictedYield: result });
      }
    } catch (err) {
      setError("Prediction failed. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-start py-3" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <div className="card shadow-sm p-4" style={{ width: "95%", maxWidth: "800px" }}>
        
        <h3 className="mb-4 text-center">
            {mode === "crop" ? "🌱 Crop Recommendation" : mode === "fertilizer" ? "🌿 Fertilizer Report" : "🌾 Yield Prediction"}
        </h3>

        {prediction && (
          <div className="alert alert-success d-flex justify-content-between align-items-center">
            <span><strong>Result:</strong> {prediction}</span>
            <button onClick={handlePrint} className="btn btn-dark btn-sm">Download PDF Report</button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-bold">Select Service</label>
            <select className="form-select" value={mode} onChange={(e) => { setMode(e.target.value); setPrediction(null); }}>
              <option value="crop">Crop Recommendation</option>
              <option value="fertilizer">Fertilizer Recommendation</option>
              <option value="yield">Yield Prediction</option>
            </select>
          </div>

          <div className="row">
            {visibleFields.map((field, idx) => (
              <div className="col-md-6 mb-3" key={idx}>
                <label className="form-label">{field.replace(/([A-Z])/g, ' $1')}</label>
                <input
                  name={field}
                  type={field === "Crop" || field === "SoilType" ? "text" : "number"}
                  className="form-control"
                  onChange={handleChange}
                  value={formData[field]}
                  required
                />
              </div>
            ))}
          </div>

          <button type="submit" className="btn btn-success w-100 py-2" disabled={loading}>
            {loading ? "Calculating..." : "Generate Prediction"}
          </button>
        </form>

        {/* --- PDF CONTENT TEMPLATE (HIDDEN) --- */}
        <div style={{ display: "none" }}>
          <div id="pdf-content" style={{ padding: "50px", fontFamily: "Arial, sans-serif" }}>
            <h1 style={{ color: "#2d6a4f", textAlign: "center" }}>Agricultural Analysis Report</h1>
            <hr />
            <div style={{ marginTop: "20px" }}>
              <p><strong>Farmer Name:</strong> {userName}</p>
              <p><strong>Report Type:</strong> {mode.toUpperCase()} Prediction</p>
              <p><strong>Generated On:</strong> {new Date().toLocaleString()}</p>
            </div>

            <h3 style={{ marginTop: "30px", borderBottom: "1px solid #ccc" }}>Input Data Provided:</h3>
            <table style={{ width: "100%", marginTop: "10px", borderCollapse: "collapse" }}>
              <tbody>
                {visibleFields.map((field) => (
                  <tr key={field}>
                    <td style={{ padding: "8px", border: "1px solid #ddd", fontWeight: "bold" }}>{field}</td>
                    <td style={{ padding: "8px", border: "1px solid #ddd" }}>{formData[field]}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: "40px", padding: "20px", backgroundColor: "#d8f3dc", borderLeft: "5px solid #2d6a4f" }}>
              <h2 style={{ margin: 0 }}>Recommended Outcome:</h2>
              <p style={{ fontSize: "24px", fontWeight: "bold", color: "#1b4332", marginTop: "10px" }}>{prediction}</p>
            </div>

            <p style={{ marginTop: "100px", fontSize: "12px", textAlign: "center", color: "#666" }}>
              © 2026 AgriVista | Digitally Verified Report
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Update;
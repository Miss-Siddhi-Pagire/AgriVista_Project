import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import { Leaf, FileDown, Sprout, CloudRain, Thermometer, Droplets, FlaskConical } from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

import url from "../url"; // Use the centralized URL
import api from '../api'; // Use if needed, or keep for reference
import PredictionImage from "../components/PredictionImage";

// If you want to use the python ML service directly or via backend proxy
// existing code used: const ML_BASE_URL = "http://127.0.0.1:8000";
// improved: navigate via backend proxy or consistent ENV variable.
// keeping original logic but styling it up.
const ML_BASE_URL = "http://127.0.0.1:8000";
const BACKEND_URL = url; // "http://localhost:7000" or prod

const Update = () => {
  const navigate = useNavigate();
  // Sanitize ID if it picked up extra characters
  const rawId = Cookies.get("id");
  // Robust sanitization: Remove "j:" prefix and quotes, then take first 24 chars if longer
  const cleanId = rawId ? rawId.replace(/^j:/, '').replace(/^"|"$/g, '') : null;
  const userId = cleanId ? cleanId : null;
  const userName = Cookies.get("username") || "Farmer";

  const [mode, setMode] = useState("crop");
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState(null); // Store fetched weather data independently

  // AgriVista Premium Palette
  const colors = {
    primaryGreen: "#6A8E23", // Olive Green
    deepGreen: "#4A6317",
    creamBg: "#F9F8F3",
    white: "#ffffff",
    textDark: "#2C3322",
    accent: "#E8F5E9"
  };

  /* ---------------- DEFAULT VALUES ---------------- */
  const defaultValues = {
    crop: {
      Nitrogen: 90, Phosphorus: 42, Potassium: 43, Temperature: 25, Humidity: 70, Rainfall: 200, pH: 6.5
    },
    fertilizer: {
      Crop: "Rice", SoilType: "Loamy", Nitrogen: 80, Phosphorus: 40, Potassium: 40
    },
    yield: {
      Crop: "Wheat", SoilMoisture: 45, Temperature: 24, Humidity: 65, Rainfall: 180, pH: 6.8, TotalDays: 120
    }
  };

  /* ---------------- FORM STATE ---------------- */
  const [formData, setFormData] = useState({
    Crop: "Rice", SoilType: "Loamy", Nitrogen: 90, Phosphorus: 42, Potassium: 43,
    Temperature: 25, Humidity: 70, Rainfall: 200, pH: 6.5, SoilMoisture: 45, TotalDays: 120
  });

  /* ---------------- AUTH CHECK ---------------- */
  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    // New: Fetch Weather Data
    const fetchWeather = async () => {
      try {
        const { data } = await axios.get(`${BACKEND_URL}/api/weather/${userId}`);
        if (data.success) {
          const { temperature, humidity, rainfall, location } = data.data;

          toast(t => (
            <span>
              Weather fetched for <b>{location}</b> from <b>WeatherAPI.com</b>
            </span>
          ), { icon: '🌤️' });

          const newWeatherData = {
            Temperature: temperature,
            Humidity: humidity,
            Rainfall: rainfall
          };

          setWeatherData(newWeatherData);

          setFormData(prev => ({
            ...prev,
            ...newWeatherData
          }));
        }
      } catch (err) {
        console.error("Failed to fetch weather", err);

        // Specific error handling for 401 Unauthorized
        if (err.response && err.response.status === 401) {
          toast.error("Weather API Error: Unauthorized (Check API Key in server/.env)", {
            id: 'weather-error',
            duration: 5000
          });
        } else if (err.response && err.response.status === 404) {
          toast.error("Location not found for weather data", { id: 'weather-error' });
        } else {
          // Generic error - keeping silent to avoid annoyance, or use debug log
          // toast.error("Could not auto-fetch weather data");
        }
      }
    };

    fetchWeather();

  }, [userId, navigate]);

  /* ---------------- FIELD VISIBILITY ---------------- */
  const visibleFields = useMemo(() => {
    const fields = {
      crop: ["Nitrogen", "Phosphorus", "Potassium", "Temperature", "Humidity", "Rainfall", "pH"],
      fertilizer: ["Crop", "SoilType", "Nitrogen", "Phosphorus", "Potassium"],
      yield: ["Crop", "SoilMoisture", "Temperature", "Humidity", "Rainfall", "pH", "TotalDays"]
    };
    return fields[mode];
  }, [mode]);

  /* ---------------- ICONS MAPPING ---------------- */
  const getIcon = (field) => {
    if (["Nitrogen", "Phosphorus", "Potassium", "pH"].some(k => field.includes(k))) return <FlaskConical size={18} />;
    if (field.includes("Temperature")) return <Thermometer size={18} />;
    if (field.includes("Rainfall") || field.includes("Moisture") || field.includes("Humidity")) return <CloudRain size={18} />;
    if (field.includes("Crop")) return <Sprout size={18} />;
    return <Leaf size={18} />;
  };

  /* ---------------- PDF DOWNLOAD ---------------- */
  const handlePrint = () => {
    const element = document.getElementById("pdf-content");
    const reportType = mode === "crop" ? "Crop_Recommendation" : mode === "fertilizer" ? "Fertilizer_Report" : "Yield_Prediction";
    const fileName = `${userName.replace(/\s+/g, "_")}_${reportType}.pdf`;

    html2pdf().set({
      margin: 0.5,
      filename: fileName,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
    }).from(element).save();

    toast.success("Report downloaded!");
  };

  /* ---------------- INPUT CHANGE ---------------- */
  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /* ---------------- FORM SUBMIT ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPrediction(null);

    const numericData = Object.fromEntries(
      Object.entries(formData).map(([k, v]) => [k, isNaN(v) || v === "" ? v : +v])
    );

    try {
      let response;
      let resultVal;

      if (mode === "crop") {
        response = await axios.post(`${ML_BASE_URL}/predict-crop`, numericData);
        // Store full object (recommendation + alternatives)
        resultVal = response.data;

        await axios.post(`${BACKEND_URL}/data`, {
          id: userId, service: "crop", inputs: numericData, prediction: resultVal
        });
      } else if (mode === "fertilizer") {
        response = await axios.post(`${ML_BASE_URL}/predict-fertilizer`, {
          Nitrogen: numericData.Nitrogen, Phosphorus: numericData.Phosphorus, Potassium: numericData.Potassium,
          soil_type: formData.SoilType, crop_type: formData.Crop
        });
        // Store full object
        resultVal = response.data;

        await axios.post(`${BACKEND_URL}/api/fertilizer`, {
          id: userId, ...numericData, RecommendedFertilizer: resultVal
        });
      } else if (mode === "yield") {
        response = await axios.post(`${ML_BASE_URL}/predict-yield`, {
          soil_moisture: numericData.SoilMoisture, pH: numericData.pH, temperature: numericData.Temperature,
          rainfall: numericData.Rainfall, humidity: numericData.Humidity, total_days: numericData.TotalDays
        });
        resultVal = response.data.estimated_yield;
        await axios.post(`${BACKEND_URL}/api/yield`, {
          id: userId, ...numericData, PredictedYield: resultVal
        });
      }

      setPrediction(resultVal);
      toast.success("Analysis Complete!");

    } catch (err) {
      console.error(err);
      toast.error("Prediction failed. Please check inputs or server connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.cardContainer}>

        {/* HEADER SECTION */}
        <div style={styles.header}>
          <div style={styles.iconWrapper}>
            <Leaf size={32} color={colors.white} />
          </div>
          <h2 style={styles.title}>AgriVista AI</h2>
          <p style={styles.subtitle}>Advanced Agricultural Intelligence for {userName}</p>
        </div>

        {/* TABS (Service Selection) */}
        <div style={styles.tabsContainer}>
          {['crop', 'fertilizer', 'yield'].map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setPrediction(null);
                setFormData(prev => ({
                  ...prev,
                  ...defaultValues[m],
                  ...weatherData // Re-apply weather data if available
                }));
              }}
              style={{
                ...styles.tab,
                ...(mode === m ? styles.activeTab : {})
              }}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        <div style={styles.contentBody}>

          {/* PREDICTION RESULT BLOCK */}
          {prediction && (
            <div style={styles.resultCard}>
              {/* Image Section */}
              {(typeof prediction === 'object' && prediction !== null) && (
                <div style={{ width: '120px', height: '120px', flexShrink: 0, marginRight: '20px' }}>
                  <PredictionImage
                    query={prediction.recommended_crop || prediction.recommended_fertilizer}
                  />
                </div>
              )}

              <div style={{ flex: 1 }}>
                <h4 style={styles.resultTitle}>Analysis Result</h4>

                {/* Check if prediction is an object (Crop/Fertilizer Multi-Option) or primitive (Yield) */}
                {typeof prediction === 'object' && prediction !== null ? (
                  <div>
                    <p style={styles.resultValue}>
                      {prediction.recommended_crop || prediction.recommended_fertilizer}
                      <span style={{ fontSize: '0.9rem', color: '#4A6317', marginLeft: '10px', fontWeight: '500' }}>
                        ({prediction.confidence}%)
                      </span>
                    </p>

                    {prediction.alternatives && prediction.alternatives.length > 0 && (
                      <div style={{ marginTop: '12px', borderTop: '1px solid rgba(74, 99, 23, 0.2)', paddingTop: '8px' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: '700', color: '#4A6317', marginBottom: '6px', textTransform: 'uppercase' }}>
                          Other Possibilities:
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                          {prediction.alternatives.map((alt, idx) => (
                            <div key={idx} style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              width: '80px' // Fixed width for alignment
                            }}>
                              <div style={{ width: '60px', height: '60px', marginBottom: '5px' }}>
                                <PredictionImage query={alt.crop || alt.fertilizer} style={{ borderRadius: '8px' }} />
                              </div>
                              <span style={{
                                fontSize: '0.8rem',
                                color: '#2C3322',
                                textAlign: 'center',
                                lineHeight: '1.2'
                              }}>
                                <b>{alt.crop || alt.fertilizer}</b>
                                <br />
                                <span style={{ opacity: 0.8, fontSize: '0.7rem' }}>{alt.probability}%</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={styles.resultValue}>{prediction} {mode === 'yield' ? 'tons/hectare' : ''}</p>
                )}
              </div>
              <button onClick={handlePrint} style={styles.pdfBtn}>
                <FileDown size={18} /> Download PDF
              </button>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.grid}>
              {visibleFields.map((field) => (
                <div key={field} style={styles.inputGroup}>
                  {/* Additional UI Text for Weather Fields based on request */}
                  {["Temperature", "Humidity", "Rainfall"].includes(field) && (
                    <span style={{ fontSize: '0.75rem', color: '#6A8E23', marginBottom: '2px', fontWeight: '500' }}>
                      * Auto-filled for your region
                    </span>
                  )}
                  <label style={styles.label}>
                    {getIcon(field)}
                    <span style={{ marginLeft: '8px' }}>{field.replace(/([A-Z])/g, " $1")}</span>
                  </label>
                  <input
                    type={field === "Crop" || field === "SoilType" ? "text" : "number"}
                    name={field}
                    value={formData[field]}
                    onChange={handleChange}
                    style={styles.input}
                    required
                  />
                </div>
              ))}
            </div>

            <div style={{ marginTop: '30px' }}>
              <button type="submit" disabled={loading} style={styles.submitBtn}>
                {loading ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <Sprout size={20} style={{ marginRight: '8px' }} />
                    Generate Prediction
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* PDF HIDDEN TEMPLATE */}
      <div style={{ display: "none" }}>
        <div id="pdf-content" style={{ padding: "40px", fontFamily: 'serif' }}>
          <h1 style={{ color: colors.deepGreen, borderBottom: `2px solid ${colors.primaryGreen}` }}>AgriVista Analysis Report</h1>
          <div style={{ marginTop: '20px', fontSize: '14px' }}>
            <p><strong>Farmer Name:</strong> {userName}</p>
            <p><strong>Report Type:</strong> {mode.toUpperCase()}</p>
            <p><strong>Date Generated:</strong> {new Date().toLocaleString()}</p>
          </div>
          <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
            <h2 style={{ margin: 0 }}>
              Result: {typeof prediction === 'object' && prediction !== null
                ? (prediction.recommended_crop || prediction.recommended_fertilizer)
                : prediction}
            </h2>
            {typeof prediction === 'object' && prediction !== null && prediction.alternatives && (
              <div style={{ marginTop: '10px', fontSize: '12px' }}>
                <p><strong>Confidence:</strong> {prediction.confidence}%</p>
                <p><strong>Alternatives:</strong> {prediction.alternatives.map(a => a.crop || a.fertilizer).join(', ')}</p>
              </div>
            )}
          </div>
          <div style={{ marginTop: '40px', fontSize: '12px', color: '#666' }}>
            <p>Generated by AgriVista AI Module.</p>
          </div>
        </div>
      </div>

      <Toaster position="top-center" reverseOrder={false} />
    </div>
  );
};

const styles = {
  pageWrapper: {
    minHeight: "100vh",
    backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url("https://images.unsplash.com/photo-1625246333195-09d9b630dc0a?q=80&w=2000&auto=format&fit=crop")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px 20px"
  },
  cardContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: "24px",
    width: "100%",
    maxWidth: "850px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    overflow: "hidden"
  },
  header: {
    background: "linear-gradient(135deg, #4A6317 0%, #6A8E23 100%)",
    padding: "30px 40px",
    color: "white",
    textAlign: "center"
  },
  iconWrapper: {
    backgroundColor: "rgba(255,255,255,0.2)",
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 15px auto"
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "2rem",
    fontWeight: "700",
    marginBottom: "5px"
  },
  subtitle: {
    fontSize: "0.9rem",
    opacity: 0.9
  },
  tabsContainer: {
    display: "flex",
    backgroundColor: "#F1F8E9",
    padding: "10px",
    gap: "10px",
    justifyContent: "center",
    borderBottom: "1px solid #e0e0e0"
  },
  tab: {
    flex: 1,
    padding: "12px",
    border: "none",
    backgroundColor: "transparent",
    color: "#4A6317",
    fontWeight: "600",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontSize: "0.95rem"
  },
  activeTab: {
    backgroundColor: "#ffffff",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    color: "#2C3322"
  },
  contentBody: {
    padding: "40px"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "25px",
    width: "100%"
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  label: {
    fontSize: "0.85rem",
    fontWeight: "700",
    color: "#4A6317",
    textTransform: "uppercase",
    display: "flex",
    alignItems: "center"
  },
  input: {
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid #d0d0d0",
    backgroundColor: "#ffffff",
    fontSize: "1rem",
    transition: "border-color 0.2s",
    outline: "none"
  },
  submitBtn: {
    width: "100%",
    backgroundColor: "#6A8E23",
    color: "white",
    border: "none",
    padding: "16px",
    borderRadius: "50px",
    fontSize: "1.1rem",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 10px 20px rgba(106, 142, 35, 0.3)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    transition: "transform 0.2s"
  },
  resultCard: {
    backgroundColor: "#DCEDC8",
    borderLeft: "6px solid #4A6317",
    padding: "20px 30px",
    borderRadius: "12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    animation: "fadeIn 0.5s ease"
  },
  resultTitle: {
    margin: 0,
    fontSize: "0.9rem",
    color: "#4A6317",
    textTransform: "uppercase",
    fontWeight: "700"
  },
  resultValue: {
    margin: "5px 0 0 0",
    fontSize: "1.5rem",
    color: "#2C3322",
    fontWeight: "800",
    fontFamily: "'Playfair Display', serif"
  },
  pdfBtn: {
    backgroundColor: "#2C3322",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "30px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.85rem",
    cursor: "pointer",
    fontWeight: "600"
  }
};

// Add keyframes for animations
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(styleSheet);

export default Update;

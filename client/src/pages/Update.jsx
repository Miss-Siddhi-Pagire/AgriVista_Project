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
import { INDIAN_LOCALES } from "../util/Indian_Locales";

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
  const [advisory, setAdvisory] = useState(null); // AI Advisory
  const [loadingAdvisory, setLoadingAdvisory] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState(null); // Track which crop advisory is shown
  const [advisoryCache, setAdvisoryCache] = useState({}); // Cache advisories to avoid re-fetching
  const [weatherData, setWeatherData] = useState(null); // Store fetched weather data independently

  // Clear cache when mode changes or new prediction starts
  useEffect(() => {
    setAdvisoryCache({});
    setSelectedCrop(null);
  }, [mode]);

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

  /* ---------------- LOCATION STATE ---------------- */
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedTaluka, setSelectedTaluka] = useState("");

  const [availableDistricts, setAvailableDistricts] = useState([]); // Array of objects {name, talukas[]}
  const [availableTalukas, setAvailableTalukas] = useState([]); // Array of strings
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState("");

  // Fetch Seasons
  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const { data } = await axios.get(`${BACKEND_URL}/api/ml/seasons`);
        if (data.seasons) setSeasons(data.seasons);
      } catch (err) {
        console.error("Failed to fetch seasons", err);
      }
    };
    fetchSeasons();
  }, []);

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
          const { temperature, humidity, rainfall, location, userAddress } = data.data;

          toast(t => (
            <span>
              Weather fetched for <b>{location}</b> from <b>WeatherAPI.com</b>
            </span>
          ), { icon: '🌤️' });

          const newWeatherData = {
            Temperature: temperature,
            Humidity: humidity,
            Rainfall: rainfall,
            location: location,
            userAddress: userAddress // Store user address for PDF
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

  // Handle State Change
  const handleStateChange = (e) => {
    const newState = e.target.value;
    setSelectedState(newState);
    setSelectedDistrict("");
    setSelectedTaluka("");
    setAvailableTalukas([]);

    if (newState) {
      const stateData = INDIAN_LOCALES.find(l => l.state === newState);
      setAvailableDistricts(stateData ? stateData.districts : []);
    } else {
      setAvailableDistricts([]);
    }
  };

  // Handle District Change
  const handleDistrictChange = (e) => {
    const newDistrict = e.target.value;
    setSelectedDistrict(newDistrict);
    setSelectedTaluka("");

    if (newDistrict) {
      const districtData = availableDistricts.find(d => d.name === newDistrict);
      setAvailableTalukas(districtData ? districtData.talukas : []);
    } else {
      setAvailableTalukas([]);
    }
  };

  // Trigger Weather Fetch
  useEffect(() => {
    // Only fetch if at least valid State is selected. 
    // Prioritize specific location: Taluka > District > State

    // Construct Query
    let query = "";
    if (selectedTaluka) query = `${selectedTaluka}, ${selectedDistrict}, ${selectedState}`;
    else if (selectedDistrict) query = `${selectedDistrict}, ${selectedState}`;
    else if (selectedState) query = selectedState;

    if (!query) return;

    fetchRegionWeather(query);

  }, [selectedState, selectedDistrict, selectedTaluka]);

  const fetchRegionWeather = async (queryLocation) => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/weather/region?region=${queryLocation}`);
      if (data.success) {
        const { temperature, humidity, rainfall, location } = data.data;

        // Only show toast if it looks successful
        toast.dismiss('weather-loading');
        toast.success(`Weather fetched for ${location}`, { icon: '🌤️', duration: 3000 });

        const newWeatherData = {
          Temperature: temperature,
          Humidity: humidity,
          Rainfall: rainfall
        };

        setWeatherData(newWeatherData);
        setFormData(prev => ({ ...prev, ...newWeatherData }));
      }
    } catch (err) {
      // access denied or 404
      console.error(err);
    }
  };

  /* ---------------- FETCH AI ADVISORY ---------------- */
  const fetchAdvisory = async (inputs, predictionResult, targetCrop = null) => {
    const cropName = targetCrop || predictionResult.recommended_crop || predictionResult.recommended_fertilizer || predictionResult;

    // Check Cache first
    if (advisoryCache[cropName]) {
      setAdvisory(advisoryCache[cropName]);
      setSelectedCrop(cropName);
      return;
    }

    setLoadingAdvisory(true);
    setAdvisory(null);
    setSelectedCrop(cropName);

    try {
      const { data } = await axios.post(`${BACKEND_URL}/api/advisory`, {
        inputs,
        prediction: predictionResult,
        target_crop: cropName
      });
      if (data.success) {
        setAdvisory(data.advisory);
        setAdvisoryCache(prev => ({ ...prev, [cropName]: data.advisory }));
        toast.success(`Advisory generated for ${cropName}`, { icon: '🤖' });
      }
    } catch (error) {
      console.error("Advisory Error:", error);
      toast.error("Could not generate AI advisory.");
    } finally {
      setLoadingAdvisory(false);
    }
  };

  const handleCropClick = (cropName) => {
    if (cropName === selectedCrop || loadingAdvisory) return;
    // Re-construct numeric inputs from formData
    const numericData = Object.fromEntries(
      Object.entries(formData).map(([k, v]) => [k, isNaN(v) || v === "" ? v : +v])
    );
    fetchAdvisory(numericData, prediction, cropName);
  };

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
        const requestData = {
          ...numericData,
          State: selectedState,
          District: selectedDistrict,
          Season: selectedSeason
        };
        // Use Backend Proxy to avoid CORS and centralized error handling
        response = await axios.post(`${BACKEND_URL}/api/ml/predict-crop`, requestData);
        // Store full object (recommendation + alternatives)
        resultVal = response.data;

        if (resultVal.error) {
          toast.error(resultVal.error, { duration: 5000, icon: '⚠️' });
          return;
        }

        await axios.post(`${BACKEND_URL}/data`, {
          id: userId, service: "crop", inputs: numericData, prediction: resultVal
        });

        // Trigger AI Advisory
        fetchAdvisory(numericData, resultVal);

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
      if (err.response && err.response.data && err.response.data.error) {
        toast.error(err.response.data.error);
      } else if (err.response && err.response.data && err.response.data.detail) {
        toast.error(err.response.data.detail);
      } else {
        toast.error("Prediction failed. Please check inputs or server connection.");
      }
    } finally {
      setLoading(false);
    }
  };


  /* ---------------- HELPER: RENDER ADVISORY ---------------- */
  const renderAdvisoryContent = (advisoryData, isPdf = false) => {
    if (!advisoryData) return null;

    // Handle legacy string format or error
    if (typeof advisoryData === 'string') {
      return <div style={{ whiteSpace: 'pre-wrap' }}>{advisoryData}</div>;
    }

    // Handle error object
    if (advisoryData.error) {
      return <div style={{ color: 'red', fontStyle: 'italic' }}>{advisoryData.error}</div>;
    }

    const sections = [
      { key: 'why_this_crop', title: '1. Why this crop?', icon: '🧐' },
      { key: 'monthly_schedule', title: '2. Monthly Schedule (15-Day Plan)', icon: '📅' },
      { key: 'care_maintenance', title: '3. Care & Maintenance', icon: '🛠️' },
      { key: 'disease_management', title: '4. Disease Management', icon: '🦠' },
      { key: 'fertilizer_recommendations', title: '5. Fertilizer Recommendations', icon: '🧪' }
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {sections.map(section => {
          // Fallback for transition period or different prompt versions
          const content = advisoryData[section.key] || advisoryData[section.key.replace('management', 'prevention')] || advisoryData['crop_planning'];

          if (!content) return null;

          // Skip showing legacy crop_planning if monthly_schedule is present and we confuse them
          if (section.key === 'monthly_schedule' && !advisoryData.monthly_schedule && !advisoryData.crop_planning) return null;

          return (
            <div key={section.key} style={{
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: '#fff',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              border: '1px solid #e0e0e0'
            }}>
              <h5 style={{
                margin: '0 0 12px 0',
                color: '#2e7d32',
                fontWeight: '700',
                fontSize: isPdf ? '11px' : '1.1rem',
                borderBottom: '2px solid #a5d6a7',
                paddingBottom: '8px',
                display: 'flex',
                alignItems: 'center'
              }}>
                {!isPdf && <span style={{ marginRight: '10px', fontSize: '1.2rem' }}>{section.icon}</span>}
                {section.title}
              </h5>

              {/* Special Rendering for Fertilizer Recommendations (New Structured Format) */}
              {section.key === 'fertilizer_recommendations' && Array.isArray(content) && typeof content[0] === 'object' ? (
                <div style={{ display: 'grid', gridTemplateColumns: isPdf ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
                  {content.map((fert, i) => (
                    <div key={i} style={{
                      backgroundColor: '#f1f8e9',
                      border: '1px solid #c5e1a5',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: isPdf ? '9px' : '0.9rem',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#689f38'
                      }}></div>

                      <div style={{ marginLeft: '10px' }}>
                        <h6 style={{ margin: '0 0 5px 0', fontSize: '1rem', color: '#33691e', fontWeight: 'bold' }}>{fert.name}</h6>

                        <div style={{ marginBottom: '8px', color: '#558b2f' }}>
                          <strong>Action:</strong> <span style={{ color: '#333' }}>{fert.action}</span>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '0.85rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', padding: '4px 8px', borderRadius: '4px', border: '1px solid #dcedc8' }}>
                            <span>⚖️</span> <span style={{ marginLeft: '5px', fontWeight: '500' }}>{fert.dosage}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', padding: '4px 8px', borderRadius: '4px', border: '1px solid #dcedc8' }}>
                            <span>💰</span> <span style={{ marginLeft: '5px', fontWeight: 'bold', color: '#e65100' }}>{fert.approx_price}</span>
                          </div>
                        </div>

                        <div style={{ marginTop: '8px', fontSize: '0.8rem', fontStyle: 'italic', color: '#555', display: 'flex', alignItems: 'flex-start' }}>
                          <span style={{ marginRight: '5px' }}>🏪</span> Availability: {fert.availability}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) :
                /* Special Rendering for Disease Management */
                section.key === 'disease_management' && Array.isArray(content) && typeof content[0] === 'object' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: isPdf ? '1fr 1fr' : 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                    {content.map((d, i) => (
                      <div key={i} style={{
                        backgroundColor: '#fffde7',
                        border: '1px solid #fff59d',
                        borderRadius: '8px',
                        padding: '12px',
                        fontSize: isPdf ? '9px' : '0.9rem'
                      }}>
                        <strong style={{ color: '#fbc02d', display: 'block', marginBottom: '6px', fontSize: '1rem' }}>{d.disease}</strong>
                        <div style={{ marginBottom: '6px' }}><span style={{ fontWeight: 'bold' }}>Symptoms:</span> <span style={{ color: '#555' }}>{d.symptoms}</span></div>
                        <div><span style={{ fontWeight: 'bold' }}>Treatment:</span> <span style={{ color: '#555' }}>{d.solution}</span></div>
                      </div>
                    ))}
                  </div>
                ) : Array.isArray(content) ? (
                  <ul style={{
                    margin: '0',
                    paddingLeft: '20px',
                    fontSize: isPdf ? '10px' : '0.95rem',
                    color: '#444',
                    lineHeight: '1.6'
                  }}>
                    {content.map((item, idx) => (
                      <li key={idx} style={{ marginBottom: '6px' }}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={{
                    margin: '0',
                    fontSize: isPdf ? '10px' : '0.95rem',
                    color: '#444',
                    textAlign: 'justify',
                    lineHeight: '1.6'
                  }}>
                    {content}
                  </p>
                )}
            </div>
          );
        })}
      </div>
    );
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
                setAdvisory(null);
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
                    <div
                      onClick={() => handleCropClick(prediction.recommended_crop || prediction.recommended_fertilizer)}
                      style={{
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '8px',
                        backgroundColor: (selectedCrop === (prediction.recommended_crop || prediction.recommended_fertilizer)) ? '#e8f5e9' : 'transparent',
                        border: (selectedCrop === (prediction.recommended_crop || prediction.recommended_fertilizer)) ? '2px solid #6A8E23' : '1px dashed transparent',
                        display: 'inline-block',
                        marginBottom: '10px',
                        transition: 'all 0.2s'
                      }}
                      title="Click to view details for the top recommendation"
                    >
                      <p style={{ ...styles.resultValue, margin: 0 }}>
                        {prediction.recommended_crop || prediction.recommended_fertilizer}
                        <span style={{ fontSize: '0.9rem', color: '#4A6317', marginLeft: '10px', fontWeight: '500' }}>
                          ({prediction.confidence}%)
                        </span>
                      </p>
                      <div style={{ fontSize: '0.75rem', color: '#6A8E23', marginTop: '4px', display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '4px' }}>👆</span> Click to view AI details
                      </div>
                    </div>

                    {prediction.alternatives && prediction.alternatives.length > 0 && (
                      <div style={{ marginTop: '12px', borderTop: '1px solid rgba(74, 99, 23, 0.2)', paddingTop: '8px' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: '700', color: '#4A6317', marginBottom: '6px', textTransform: 'uppercase' }}>
                          Other Possibilities:
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                          {prediction.alternatives.map((alt, idx) => {
                            const altName = alt.crop || alt.fertilizer;
                            const isSelected = altName === selectedCrop;
                            return (
                              <div key={idx}
                                onClick={() => handleCropClick(altName)}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  width: '80px',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  border: isSelected ? '2px solid #6A8E23' : '2px solid transparent',
                                  borderRadius: '8px',
                                  backgroundColor: isSelected ? '#f1f8e9' : 'transparent',
                                  transition: 'all 0.2s'
                                }}>
                                <div style={{ width: '60px', height: '60px', marginBottom: '5px' }}>
                                  <PredictionImage query={altName} style={{ borderRadius: '8px' }} />
                                </div>
                                <span style={{
                                  fontSize: '0.8rem',
                                  color: '#2C3322',
                                  textAlign: 'center',
                                  lineHeight: '1.2'
                                }}>
                                  <b>{altName}</b>
                                  <br />
                                  <span style={{ opacity: 0.8, fontSize: '0.7rem' }}>{alt.probability}%</span>
                                </span>
                              </div>
                            );
                          })}
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

          {/* AI ADVISORY CARD - WEB VIEW */}
          {(loadingAdvisory || advisory) && (
            <div style={{ ...styles.resultCard, backgroundColor: '#FFF8E1', borderLeft: '6px solid #FFB300', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>🤖</span>
                <h4 style={{ ...styles.resultTitle, color: '#F57F17' }}>AI Consultant: {selectedCrop}</h4>
              </div>

              {loadingAdvisory ? (
                <div style={{ color: '#7e7e7e', fontStyle: 'italic' }}>Analyzing soil conditions and generating expert advice...</div>
              ) : (
                <div style={{ width: '100%' }}>
                  {renderAdvisoryContent(advisory, false)}
                </div>
              )}
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} style={styles.form}>

            {/* Region Selection Block */}
            {["crop", "yield"].includes(mode) && (
              <div style={{ marginBottom: '25px', padding: '20px', backgroundColor: '#f4f9f4', borderRadius: '16px', border: '1px solid #c8e6c9' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', color: '#2e7d32' }}>
                  <CloudRain size={20} />
                  <span style={{ marginLeft: '10px', fontWeight: '700', fontSize: '1rem' }}>Location Weather Data</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  {/* State Select */}
                  <div style={styles.inputGroup}>
                    <label style={{ ...styles.label, fontSize: '0.75rem' }}>State</label>
                    <select
                      value={selectedState}
                      onChange={handleStateChange}
                      style={{ ...styles.input, cursor: 'pointer' }}
                    >
                      <option value="">-- Select State --</option>
                      {INDIAN_LOCALES.map(l => (
                        <option key={l.state} value={l.state}>{l.state}</option>
                      ))}
                    </select>
                  </div>

                  {/* District Select */}
                  <div style={styles.inputGroup}>
                    <label style={{ ...styles.label, fontSize: '0.75rem' }}>District</label>
                    <select
                      value={selectedDistrict}
                      onChange={handleDistrictChange}
                      style={{ ...styles.input, cursor: selectedState ? 'pointer' : 'not-allowed', opacity: selectedState ? 1 : 0.6 }}
                      disabled={!selectedState}
                    >
                      <option value="">-- Select District --</option>
                      {availableDistricts.map(d => (
                        <option key={d.name} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Taluka Select */}
                  <div style={styles.inputGroup}>
                    <label style={{ ...styles.label, fontSize: '0.75rem' }}>Taluka / Sub-district</label>
                    <select
                      value={selectedTaluka}
                      onChange={(e) => setSelectedTaluka(e.target.value)}
                      style={{ ...styles.input, cursor: selectedDistrict ? 'pointer' : 'not-allowed', opacity: selectedDistrict ? 1 : 0.6 }}
                      disabled={!selectedDistrict}
                    >
                      <option value="">-- Select Taluka --</option>
                      {availableTalukas.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  {/* Season Select (Only for Crop) */}
                  {mode === 'crop' && (
                    <div style={styles.inputGroup}>
                      <label style={{ ...styles.label, fontSize: '0.75rem' }}>Season</label>
                      <select
                        value={selectedSeason}
                        onChange={(e) => setSelectedSeason(e.target.value)}
                        style={{ ...styles.input, cursor: 'pointer' }}
                      >
                        <option value="">-- Select Season --</option>
                        {seasons.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <p style={{ fontSize: '0.7rem', color: '#558b2f', marginTop: '10px', fontStyle: 'italic' }}>
                  * Weather data will automatically update based on the most specific location provided.
                </p>
              </div>
            )}

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

      {/* PDF HIDDEN TEMPLATE - Visible to html2canvas but hidden from user */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <div id="pdf-content" style={{ padding: "40px", fontFamily: 'Arial, sans-serif', color: '#1a1a1a', width: '800px', backgroundColor: 'white' }}>

          {/* 1. Header */}
          <div style={{ borderBottom: `3px solid ${colors.primaryGreen}`, paddingBottom: '20px', validBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ color: colors.deepGreen, margin: 0, fontSize: '24px', fontWeight: 'bold' }}>AgriVista Intelligence</h1>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>Smart Farming Advisory Report</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '12px' }}><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px' }}><strong>Time:</strong> {new Date().toLocaleTimeString()}</p>
            </div>
          </div>

          {/* 2. Farmer & Report Info */}
          <div style={{ marginTop: '30px', display: 'flex', gap: '40px' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '14px', borderBottom: '1px solid #ccc', paddingBottom: '5px', color: '#444' }}>FARMER DETAILS</h3>
              <p style={{ fontSize: '14px', margin: '8px 0' }}><strong>Name:</strong> {userName}</p>
              <p style={{ fontSize: '14px', margin: '8px 0' }}><strong>ID:</strong> {userId}</p>
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '14px', borderBottom: '1px solid #ccc', paddingBottom: '5px', color: '#444' }}>REPORT CONTEXT</h3>
              <p style={{ fontSize: '14px', margin: '8px 0' }}><strong>Analysis Type:</strong> {mode.charAt(0).toUpperCase() + mode.slice(1)} Prediction</p>
              <p style={{ fontSize: '14px', margin: '8px 0' }}>
                <strong>Location:</strong> {selectedDistrict
                  ? `${selectedTaluka ? selectedTaluka + ', ' : ''}${selectedDistrict}, ${selectedState}`
                  : (weatherData?.userAddress
                    ? `${weatherData.userAddress.taluka || ''}, ${weatherData.userAddress.district || ''}, ${weatherData.userAddress.state || ''}`.replace(/^, |, $/g, '').replace(/, ,/g, ',')
                    : (weatherData?.location || 'User Profile Location'))}
              </p>
            </div>
          </div>

          {/* 3. Input Parameters (What Farmer Entered) */}
          {/* 3. Input Parameters (Dynamic based on Mode) */}
          <div style={{ marginTop: '30px' }}>
            <h3 style={{ fontSize: "14px", backgroundColor: "#f4f4f4", padding: "8px", borderLeft: `4px solid ${colors.deepGreen}` }}>SOIL & WEATHER CONDITIONS</h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0',
              border: '1px solid #ddd',
              marginTop: '10px',
              fontSize: '12px'
            }}>
              {visibleFields.map((field, index) => (
                <div key={field} style={{
                  padding: '10px',
                  borderBottom: '1px solid #ddd',
                  borderRight: index % 2 === 0 ? '1px solid #ddd' : 'none',
                  backgroundColor: index % 4 === 0 || index % 4 === 3 ? '#fafafa' : 'white' // Zebra striping pattern
                }}>
                  <strong style={{ color: '#444', marginRight: '5px' }}>
                    {field.replace(/([A-Z])/g, " $1").trim()}:
                  </strong>
                  <span>{formData[field]} {
                    ["Temperature"].includes(field) ? "°C" :
                      ["Humidity", "SoilMoisture"].includes(field) ? "%" :
                        ["Rainfall"].includes(field) ? "mm" :
                          ["TotalDays"].includes(field) ? "Days" : ""
                  }</span>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Prediction Result */}
          <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#e8f5e9', borderRadius: '8px', border: `1px solid ${colors.primaryGreen}` }}>
            <h3 style={{ fontSize: '16px', color: colors.deepGreen, margin: '0 0 15px 0', textAlign: 'center' }}>RECOMMENDED {mode.toUpperCase()}</h3>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '30px' }}>
              {/* Crop Image */}
              {prediction && (typeof prediction === 'object' ? (prediction.recommended_crop || prediction.recommended_fertilizer) : prediction) && (
                <div style={{ width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '2px solid white', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                  <PredictionImage
                    query={typeof prediction === 'object' ? (prediction.recommended_crop || prediction.recommended_fertilizer) : prediction}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}

              <div>
                <h2 style={{ fontSize: '28px', margin: '0', color: '#2e7d32' }}>
                  {typeof prediction === 'object' && prediction !== null
                    ? (prediction.recommended_crop || prediction.recommended_fertilizer)
                    : prediction + (mode === 'yield' ? ' tons/ha' : '')}
                </h2>
                {typeof prediction === 'object' && prediction !== null && prediction.confidence && (
                  <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#558b2f' }}><strong>Confidence Score:</strong> {prediction.confidence}%</p>
                )}
              </div>
            </div>
          </div>

          {/* 5. AI Advisory - PDF VIEW */}
          {advisory && (
            <div style={{ marginTop: '30px' }}>
              <h3 style={{ fontSize: "14px", backgroundColor: "#fff8e1", padding: "8px", borderLeft: "4px solid #ffb300", color: "#f57f17" }}>AI CONSULTANT ADVISORY</h3>
              <div style={{ marginTop: '10px' }}>
                {renderAdvisoryContent(advisory, true)}
              </div>
            </div>
          )}

          {/* 6. Footer */}
          <div style={{ marginTop: '50px', borderTop: '1px solid #eee', paddingTop: '15px', textAlign: 'center', fontSize: '10px', color: '#999' }}>
            <p>Generated by AgriVista AI. This report is a suggestion based on data inputs and ML models. Please consult a local agricultural officer for final confirmation.</p>
            <p>&copy; {new Date().getFullYear()} AgriVista. All rights reserved.</p>
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

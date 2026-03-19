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
  const [advisory, setAdvisory] = useState(null); // Advisory
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
        if (data.seasons) {
          const allowedSeasons = ["Rabi", "Kharif", "Summer", "Whole Year"];
          const filtered = data.seasons.filter(s => allowedSeasons.includes(s));
          setSeasons(filtered);
        }
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

  /* ---------------- FETCH ADVISORY ---------------- */
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

        // Trigger Advisory
        fetchAdvisory(numericData, resultVal);

      } else if (mode === "fertilizer") {
        // Use Backend Proxy
        response = await axios.post(`${BACKEND_URL}/api/ml/predict-fertilizer`, {
          Nitrogen: numericData.Nitrogen, Phosphorus: numericData.Phosphorus, Potassium: numericData.Potassium,
          soil_type: formData.SoilType, crop_type: formData.Crop
        });
        // Store full object
        resultVal = response.data;

        await axios.post(`${BACKEND_URL}/api/fertilizer`, {
          id: userId, ...numericData, RecommendedFertilizer: resultVal
        });
      } else if (mode === "yield") {
        // Use Backend Proxy
        response = await axios.post(`${BACKEND_URL}/api/ml/predict-yield`, {
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
    <div className="dash-wrap">
      <Toaster position="top-center" reverseOrder={false} />

      {/* DASHBOARD SIDEBAR */}
      <div className="dash-sidebar">
        <div className="dash-sidebar-title">Menu</div>
        {['crop', 'fertilizer', 'yield'].map((m) => (
            <div
                key={m}
                className={`sidebar-item ${mode === m ? 'active' : ''}`}
                onClick={() => {
                setMode(m);
                setPrediction(null);
                setAdvisory(null);
                setFormData(prev => ({
                    ...prev,
                    ...defaultValues[m],
                    ...weatherData
                }));
                }}
            >
                {getIcon(m === "fertilizer" ? "Nitrogen" : m === "yield" ? "Temperature" : "Crop")} 
                <span style={{ marginLeft: '10px' }}>{m.charAt(0).toUpperCase() + m.slice(1)} Prediction</span>
            </div>
        ))}
      </div>

      {/* DASHBOARD MAIN */}
      <div className="dash-main">
        {/* HEADER SECTION */}
        <div className="dash-header">
          <h2 style={{ display: 'flex', alignItems: 'center' }}>
            <Leaf className="sidebar-icon" style={{color: "var(--leaf)", marginRight: "10px"}} /> 
            AgriVista Intelligence
          </h2>
          <p>Advanced Agricultural Insights for {userName}</p>
        </div>

        {/* CONTENT BODY */}
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>

          {/* PREDICTION RESULT BLOCK */}
          {prediction && (
            <div className="dash-card" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--mint-light)', borderLeft: '4px solid var(--leaf)' }}>
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                {/* Image Section */}
                {(typeof prediction === 'object' && prediction !== null) && (
                  <div style={{ width: '100px', height: '100px', flexShrink: 0, marginRight: '1.5rem', borderRadius: '12px', overflow: 'hidden', border: '2px solid white', boxShadow: '0 4px 12px rgba(5,46,22,0.1)' }}>
                    <PredictionImage
                      query={prediction.recommended_crop || prediction.recommended_fertilizer}
                    />
                  </div>
                )}

                <div style={{ flex: 1 }}>
                  <h4 style={{ fontFamily: 'var(--ff-head)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Analysis Result
                  </h4>

                  {/* Check if prediction is an object (Crop/Fertilizer Multi-Option) or primitive (Yield) */}
                  {typeof prediction === 'object' && prediction !== null ? (
                    <div>
                      <div
                        onClick={() => handleCropClick(prediction.recommended_crop || prediction.recommended_fertilizer)}
                        style={{
                          cursor: 'pointer',
                          padding: '10px 15px',
                          borderRadius: '10px',
                          backgroundColor: (selectedCrop === (prediction.recommended_crop || prediction.recommended_fertilizer)) ? 'var(--mint)' : 'transparent',
                          border: (selectedCrop === (prediction.recommended_crop || prediction.recommended_fertilizer)) ? '2px solid var(--leaf)' : '1px dashed transparent',
                          display: 'inline-block',
                          marginBottom: '10px',
                          transition: 'all 0.2s'
                        }}
                        title="Click to view details for the top recommendation"
                      >
                        <p style={{ fontFamily: 'var(--ff-head)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--forest)', margin: 0 }}>
                          {prediction.recommended_crop || prediction.recommended_fertilizer}
                          <span style={{ fontFamily: 'var(--ff-body)', fontSize: '1rem', color: 'var(--leaf)', marginLeft: '10px', fontWeight: 600 }}>
                            ({prediction.confidence}%)
                          </span>
                        </p>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center' }}>
                          <span style={{ marginRight: '6px' }}>👆</span> Click to view advisory
                        </div>
                      </div>

                      {prediction.alternatives && prediction.alternatives.length > 0 && (
                        <div style={{ marginTop: '15px', borderTop: '1px solid rgba(74,222,128,0.2)', paddingTop: '10px' }}>
                          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
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
                                    padding: '6px',
                                    border: isSelected ? '2px solid var(--leaf)' : '2px solid transparent',
                                    borderRadius: '10px',
                                    backgroundColor: isSelected ? 'var(--mint)' : 'transparent',
                                    transition: 'all 0.2s'
                                  }}>
                                  <div style={{ width: '60px', height: '60px', marginBottom: '8px' }}>
                                    <PredictionImage query={altName} style={{ borderRadius: '8px' }} />
                                  </div>
                                  <span style={{
                                    fontFamily: 'var(--ff-body)',
                                    fontSize: '0.85rem',
                                    color: 'var(--forest)',
                                    textAlign: 'center',
                                    lineHeight: '1.2'
                                  }}>
                                    <b>{altName}</b>
                                    <br />
                                    <span style={{ opacity: 0.8, fontSize: '0.75rem' }}>{alt.probability}%</span>
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p style={{ fontFamily: 'var(--ff-head)', fontSize: '2rem', fontWeight: 700, color: 'var(--forest)', margin: 0 }}>
                      <span>{prediction}</span> <span style={{ fontFamily: 'var(--ff-body)', fontSize: '1.2rem', color: 'var(--text-muted)' }}>{mode === 'yield' ? 'tons/hectare' : ''}</span>
                    </p>
                  )}
                </div>
              </div>
              <button onClick={handlePrint} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
                <FileDown size={18} /> Download PDF
              </button>
            </div>
          )}

          {/* AI ADVISORY CARD - WEB VIEW */}
          {(loadingAdvisory || advisory) && (
            <div className="dash-card" style={{ marginBottom: '1.5rem', backgroundColor: '#FFFce8', borderLeft: '4px solid #FFB300' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.2rem' }}>
                <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>🤖</span>
                <h4 style={{ fontFamily: 'var(--ff-head)', fontSize: '1.2rem', fontWeight: 700, color: '#b45309', margin: 0 }}>
                  Consultant: {selectedCrop}
                </h4>
              </div>

              {loadingAdvisory ? (
                <div style={{ color: 'var(--text-light)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="spinner-border spinner-border-sm" role="status"></div>
                    Analyzing data and generating expert advice...
                </div>
              ) : (
                <div style={{ width: '100%' }}>
                  {renderAdvisoryContent(advisory, false)}
                </div>
              )}
            </div>
          )}

          {/* FORM */}
          <div className="dash-card">
            <div className="dash-card-title">
              {mode === 'crop' && <Sprout className="sidebar-icon" style={{color: "var(--leaf)", marginRight: "8px"}}/>}
              {mode === 'fertilizer' && <FlaskConical className="sidebar-icon" style={{color: "var(--leaf)", marginRight: "8px"}}/>}
              {mode === 'yield' && <CloudRain className="sidebar-icon" style={{color: "var(--leaf)", marginRight: "8px"}}/>}
              Enter Details
            </div>
            
            <form onSubmit={handleSubmit}>
              {/* Region Selection Block */}
              {["crop", "yield"].includes(mode) && (
                <div style={{ marginBottom: '1.5rem', padding: '1.2rem', backgroundColor: 'var(--mint-light)', borderRadius: '12px', border: '1px solid rgba(74,222,128,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', color: 'var(--forest)' }}>
                    <CloudRain size={20} />
                    <span style={{ marginLeft: '10px', fontFamily: 'var(--ff-head)', fontWeight: 700, fontSize: '1.1rem' }}>Location Weather Data</span>
                  </div>

                  <div className="dash-grid3">
                    {/* State Select */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-lbl">State</label>
                      <select
                        className="form-input"
                        value={selectedState}
                        onChange={handleStateChange}
                      >
                        <option value="">-- Select State --</option>
                        {INDIAN_LOCALES.map(l => (
                          <option key={l.state} value={l.state}>{l.state}</option>
                        ))}
                      </select>
                    </div>

                    {/* District Select */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-lbl">District</label>
                      <select
                        className="form-input"
                        value={selectedDistrict}
                        onChange={handleDistrictChange}
                        style={{ opacity: selectedState ? 1 : 0.6 }}
                        disabled={!selectedState}
                      >
                        <option value="">-- Select District --</option>
                        {availableDistricts.map(d => (
                          <option key={d.name} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Taluka Select */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-lbl">Taluka / Sub-district</label>
                      <select
                        className="form-input"
                        value={selectedTaluka}
                        onChange={(e) => setSelectedTaluka(e.target.value)}
                        style={{ opacity: selectedDistrict ? 1 : 0.6 }}
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
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-lbl">Season</label>
                        <select
                          className="form-input"
                          value={selectedSeason}
                          onChange={(e) => setSelectedSeason(e.target.value)}
                        >
                          <option value="">-- Select Season --</option>
                          {seasons.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <p style={{ fontFamily: 'var(--ff-body)', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.8rem', fontStyle: 'italic', margin: '0.8rem 0 0 0' }}>
                    * Weather data will automatically update based on the most specific location provided.
                  </p>
                </div>
              )}

              <div className="dash-grid3">
                {visibleFields.map((field) => (
                  <div key={field} className="form-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label className="form-lbl" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                        {getIcon(field)}
                        <span>{field.replace(/([A-Z])/g, " $1")}</span>
                        </label>
                        {/* Additional UI Text for Weather Fields */}
                        {["Temperature", "Humidity", "Rainfall"].includes(field) && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--leaf)', fontWeight: 600 }}>
                            * Auto-filled
                        </span>
                        )}
                    </div>
                    
                    <input
                      className="form-input"
                      type={field === "Crop" || field === "SoilType" ? "text" : "number"}
                      name={field}
                      value={formData[field]}
                      onChange={handleChange}
                      required
                    />
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '2rem' }}>
                <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '14px', fontSize: '1.1rem' }}>
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <div className="spinner-border spinner-border-sm" role="status"></div>
                        Processing...
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <Sprout size={20} />
                      <span>Generate Prediction</span>
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* PDF HIDDEN TEMPLATE - Visible to html2canvas but hidden from user */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <div id="pdf-content" style={{
          padding: "40px",
          fontFamily: 'Arial, sans-serif',
          color: '#1a1a1a',
          width: '700px', // Reduced from 800px to fit A4 with margins
          backgroundColor: 'white',
          boxSizing: 'border-box'
        }}>

          {/* 1. Header */}
          <div style={{ borderBottom: `3px solid var(--leaf)`, paddingBottom: '20px', validBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ color: 'var(--forest)', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>AgriVista Intelligence</h1>
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
          <div style={{ marginTop: '30px' }}>
            <h3 style={{ fontSize: "14px", backgroundColor: "#f4f4f4", padding: "8px", borderLeft: `4px solid var(--forest)` }}>SOIL & WEATHER CONDITIONS</h3>

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
          <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#e8f5e9', borderRadius: '8px', border: `1px solid var(--leaf)` }}>
            <h3 style={{ fontSize: '16px', color: 'var(--forest)', margin: '0 0 15px 0', textAlign: 'center' }}>RECOMMENDED {mode.toUpperCase()}</h3>

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
                  <span>
                    {typeof prediction === 'object' && prediction !== null
                      ? (prediction.recommended_crop || prediction.recommended_fertilizer)
                      : prediction + (mode === 'yield' ? ' tons/ha' : '')}
                  </span>
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
    </div>
  );
};

export default Update;

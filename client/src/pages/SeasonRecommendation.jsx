import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FaLeaf, FaMapMarkerAlt, FaCloudSun, FaSeedling } from "react-icons/fa";
import url from "../url";

const SeasonRecommendation = () => {
    const [locations, setLocations] = useState({});
    const [states, setStates] = useState([]);
    const [seasons, setSeasons] = useState([]);

    const [selectedState, setSelectedState] = useState("");
    const [districts, setDistricts] = useState([]);
    const [selectedDistrict, setSelectedDistrict] = useState("");
    const [selectedSeason, setSelectedSeason] = useState("");

    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch Locations and Seasons on Mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const locRes = await axios.get(`${url}/locations`);
                setLocations(locRes.data.locations);
                setStates(locRes.data.states);

                const seasRes = await axios.get(`${url}/seasons`);
                if (seasRes.data.seasons) {
                    const allowedSeasons = ["Rabi", "Kharif", "Summer", "Whole Year"];
                    const filtered = seasRes.data.seasons.filter(s => allowedSeasons.includes(s));
                    setSeasons(filtered);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                toast.error("Failed to load location data.");
            }
        };
        fetchData();
    }, []);

    // Update districts when state changes
    useEffect(() => {
        if (selectedState && locations[selectedState]) {
            setDistricts(locations[selectedState]);
            setSelectedDistrict(""); // Reset district
        }
    }, [selectedState, locations]);

    const handleRecommend = async (e) => {
        e.preventDefault();
        if (!selectedState || !selectedDistrict || !selectedSeason) {
            toast.error("Please select all fields");
            return;
        }

        setLoading(true);
        setRecommendations([]);

        try {
            const response = await axios.post(`${url}/recommend-season-commodity`, {
                state: selectedState,
                district: selectedDistrict,
                season: selectedSeason
            });

            if (response.data.recommendations && response.data.recommendations.length > 0) {
                setRecommendations(response.data.recommendations);
                toast.success("Recommendations fetched successfully!");
            } else {
                toast("No data found for this combination.", { icon: "ℹ️" });
            }
        } catch (error) {
            console.error("Error getting recommendations:", error);
            if (error.response && error.response.data && error.response.data.error) {
                toast.error(error.response.data.error);
            } else {
                toast.error("Failed to get recommendations.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dash-wrap">
            <Toaster position="top-center" />

            {/* DASHBOARD SIDEBAR */}
            <div className="dash-sidebar">
                <div className="dash-sidebar-title">Menu</div>
                <div className="sidebar-item">
                    <FaCloudSun className="sidebar-icon" /> Recommendations
                </div>
            </div>

            {/* DASHBOARD MAIN */}
            <div className="dash-main">
                {/* Header */}
                <div className="dash-header">
                    <h2><FaLeaf className="sidebar-icon" style={{color: "var(--leaf)", marginRight: "8px"}}/> Seasonal Crop Planner</h2>
                    <p>Get expert crop recommendations based on historical district data and season.</p>
                </div>

                {/* Input Card */}
                <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
                    <div className="dash-card-title"><FaMapMarkerAlt className="sidebar-icon" style={{color: "var(--leaf)", marginRight: "8px"}}/> Select Your Region & Season</div>
                    <form onSubmit={handleRecommend}>
                        <div className="dash-grid3" style={{ marginBottom: '1rem' }}>
                            {/* State Selection */}
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-lbl">State</label>
                                <select
                                    className="form-input"
                                    value={selectedState}
                                    onChange={(e) => setSelectedState(e.target.value)}
                                >
                                    <option value="">-- Select State --</option>
                                    {states.map((st) => (
                                        <option key={st} value={st}>{st}</option>
                                    ))}
                                </select>
                            </div>

                            {/* District Selection */}
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-lbl">District</label>
                                <select
                                    className="form-input"
                                    value={selectedDistrict}
                                    onChange={(e) => setSelectedDistrict(e.target.value)}
                                    disabled={!selectedState}
                                >
                                    <option value="">-- Select District --</option>
                                    {districts.map((dst) => (
                                        <option key={dst} value={dst}>{dst}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Season Selection */}
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-lbl">Season</label>
                                <select
                                    className="form-input"
                                    value={selectedSeason}
                                    onChange={(e) => setSelectedSeason(e.target.value)}
                                >
                                    <option value="">-- Select Season --</option>
                                    {seasons.map((seas) => (
                                        <option key={seas} value={seas}>{seas}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div style={{ marginTop: '1.5rem' }}>
                            <button
                                type="submit"
                                className="btn-primary"
                                style={{ width: '100%' }}
                                disabled={loading}
                            >
                                {loading ? (
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                        Analyzing...
                                    </span>
                                ) : (
                                    <>
                                        <FaCloudSun className="sidebar-icon" style={{marginRight: "8px"}}/> Get Recommendations
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Results Section */}
                {recommendations.length > 0 && (
                    <div style={{ animation: "fadeInUp 0.5s" }}>
                        <h3 style={{ fontFamily: 'var(--ff-head)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--forest)', marginBottom: '1.2rem', paddingLeft: '10px', borderLeft: '4px solid var(--leaf)' }}>
                            Top Recommended Crops
                        </h3>

                        <div className="dash-grid3">
                            {recommendations.map((item, index) => (
                                <div key={index} className="dash-card" style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--mint)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--leaf)', marginRight: '12px' }}>
                                            <FaSeedling size={20} />
                                        </div>
                                        <h4 style={{ fontFamily: 'var(--ff-head)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--forest)', margin: 0 }}>
                                            {item.crop}
                                        </h4>
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid rgba(74,222,128,0.1)' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Avg Yield</span>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--leaf)' }}>{item.yield} <small style={{ fontSize: '0.65rem', fontWeight: 500 }}>tons/ha</small></span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Avg Production</span>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--forest)' }}>{item.production} <small style={{ fontSize: '0.65rem', fontWeight: 500 }}>tons</small></span>
                                        </div>
                                    </div>
                                    
                                    <div style={{ textAlign: 'center', marginTop: '1.2rem', paddingTop: '10px', borderTop: '1px solid rgba(74,222,128,0.1)' }}>
                                        <small style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>Rank #{index + 1} based on historical yield</small>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SeasonRecommendation;

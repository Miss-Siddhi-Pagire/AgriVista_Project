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
                setSeasons(seasRes.data.seasons);
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
        <div className="container-fluid min-vh-100 bg-light py-5">
            <div className="container">

                {/* Header */}
                <div className="text-center mb-5">
                    <h1 className="display-4 fw-bold text-success mb-3">
                        <FaLeaf className="me-3" />
                        Seasonal Crop Planner
                    </h1>
                    <p className="lead text-muted">
                        Get AI-driven crop recommendations based on your historical district data and season.
                    </p>
                </div>

                {/* Input Card */}
                <div className="card border-0 shadow-lg rounded-4 mb-5 overflow-hidden">
                    <div className="card-header bg-success text-white p-4">
                        <h4 className="mb-0 fw-bold d-flex align-items-center">
                            <FaMapMarkerAlt className="me-2" /> Select Your Region & Season
                        </h4>
                    </div>
                    <div className="card-body p-4 p-lg-5 bg-white">
                        <form onSubmit={handleRecommend} className="row g-4">

                            {/* State Selection */}
                            <div className="col-md-4">
                                <label className="form-label fw-bold text-secondary">State</label>
                                <select
                                    className="form-select form-select-lg border-2"
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
                            <div className="col-md-4">
                                <label className="form-label fw-bold text-secondary">District</label>
                                <select
                                    className="form-select form-select-lg border-2"
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
                            <div className="col-md-4">
                                <label className="form-label fw-bold text-secondary">Season</label>
                                <select
                                    className="form-select form-select-lg border-2"
                                    value={selectedSeason}
                                    onChange={(e) => setSelectedSeason(e.target.value)}
                                >
                                    <option value="">-- Select Season --</option>
                                    {seasons.map((seas) => (
                                        <option key={seas} value={seas}>{seas}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Submit Button */}
                            <div className="col-12 text-center mt-4">
                                <button
                                    type="submit"
                                    className="btn btn-success btn-lg px-5 py-3 rounded-pill fw-bold shadow transition-hover"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <span>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Analyzing...
                                        </span>
                                    ) : (
                                        <>
                                            <FaCloudSun className="me-2" /> Get Recommendations
                                        </>
                                    )}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>

                {/* Results Section */}
                {recommendations.length > 0 && (
                    <div className="animate__animated animate__fadeInUp">
                        <h3 className="fw-bold text-secondary mb-4 border-start border-5 border-success ps-3">
                            Top Recommended Crops
                        </h3>

                        <div className="row g-4">
                            {recommendations.map((item, index) => (
                                <div key={index} className="col-md-6 col-lg-4">
                                    <div className="card h-100 border-0 shadow-sm hover-shadow transition-all">
                                        <div className="card-body p-4">
                                            <div className="d-flex align-items-center mb-3">
                                                <div className="bg-light rounded-circle p-3 me-3 text-success">
                                                    <FaSeedling size={24} />
                                                </div>
                                                <h4 className="card-title fw-bold text-dark mb-0">{item.crop}</h4>
                                            </div>

                                            <div className="mt-3">
                                                <div className="d-flex justify-content-between mb-2 border-bottom pb-2">
                                                    <span className="text-muted">Avg Yield</span>
                                                    <span className="fw-bold text-success">{item.yield} <small>tons/ha</small></span>
                                                </div>
                                                <div className="d-flex justify-content-between">
                                                    <span className="text-muted">Avg Production</span>
                                                    <span className="fw-bold text-dark">{item.production} <small>tons</small></span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card-footer bg-transparent border-0 text-center pb-3">
                                            <small className="text-muted">Rank #{index + 1} based on historical yield</small>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>

            <style>{`
        .transition-hover {
          transition: transform 0.2s;
        }
        .transition-hover:hover {
          transform: translateY(-2px);
        }
        .hover-shadow:hover {
          box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
        }
      `}</style>
        </div>
    );
};

export default SeasonRecommendation;

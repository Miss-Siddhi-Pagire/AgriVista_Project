import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Sprout, Wheat, Droplets, ArrowLeft, Trash2 } from "lucide-react";
import { url } from "../url";

const ParticularUserData = () => {
  const userId = Cookies.get("id");
  const userName = Cookies.get("username") || "Farmer";
  const navigate = useNavigate();

  const [soilData, setSoilData] = useState([]);
  const [yieldData, setYieldData] = useState([]);
  const [fertilizerData, setFertilizerData] = useState([]);
  const [loading, setLoading] = useState(true);

  const colors = {
    primaryGreen: "#6A8E23",
    deepGreen: "#4A6317",
    creamBg: "#F9F8F3",
    textDark: "#2C3322",
    white: "#ffffff",
    lightGreen: "#F0F4E8"
  };

  useEffect(() => {
    const fetchAllData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const [soilRes, yieldRes, fertRes] = await Promise.all([
          axios.get(`${url}/get-form/${userId}`).catch(() => ({ data: [] })),
          axios.get(`${url}/api/yield/${userId}`).catch(() => ({ data: [] })),
          axios.get(`${url}/api/fertilizer/${userId}`).catch(() => ({ data: [] }))
        ]);

        const formatData = (res) => {
          const data = Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []);
          return data.sort((a, b) => new Date(b.createdAt || b.Timestamp) - new Date(a.createdAt || a.Timestamp));
        };

        setSoilData(formatData(soilRes));
        setYieldData(formatData(yieldRes));
        setFertilizerData(formatData(fertRes));

      } catch (error) {
        console.error("Critical error in fetchAllData:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [userId]);

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  // Helper to safely render prediction (handles String vs Object)
  const getPredVal = (val) => {
    if (!val) return "N/A";
    if (typeof val === 'object') {
      return val.recommended_crop || val.recommended_fertilizer || "N/A";
    }
    return val;
  };

  const deleteRecord = async (id, type) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    try {
      if (type === 'crop') {
        await axios.delete(`${url}/delete-form/${id}`);
        setSoilData(prev => prev.filter(item => item._id !== id));
      } else if (type === 'yield') {
        await axios.delete(`${url}/api/yield/${id}`);
        setYieldData(prev => prev.filter(item => item._id !== id));
      } else if (type === 'fertilizer') {
        await axios.delete(`${url}/api/fertilizer/${id}`);
        setFertilizerData(prev => prev.filter(item => item._id !== id));
      }
      // Optional: Add a toast notification here
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete record. Please try again.");
    }
  };

  if (loading) return (
    <div className="min-h-screen d-flex align-items-center justify-content-center" style={{ backgroundColor: colors.creamBg }}>
      <div className="spinner-border" style={{ color: colors.primaryGreen }} role="status"></div>
    </div>
  );

  return (
    <div className="d-flex justify-content-center align-items-center py-5" style={{ backgroundColor: colors.creamBg, minHeight: "100vh" }}>
      <div className="card border-0 shadow-lg overflow-hidden rounded-4" style={{ width: "95%", maxWidth: "1100px" }}>
        <div className="row g-0">

          {/* Left Decorative Sidebar */}
          <div className="col-md-3 d-none d-md-flex flex-column justify-content-center p-5 text-white text-center"
            style={{
              background: `linear-gradient(rgba(74, 99, 23, 0.85), rgba(74, 99, 23, 0.85)), url('https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=1000')`,
              backgroundSize: 'cover'
            }}>
            <div className="mb-4">
              <div className="bg-white rounded-circle d-inline-flex p-3 mb-3 shadow">
                <LayoutDashboard size={40} color={colors.primaryGreen} />
              </div>
              <h4 className="fw-bold font-serif">Your Farm Journey</h4>
              <p className="small opacity-75">Reviewing your historical data helps in making better decisions for the future.</p>
            </div>
          </div>

          {/* Right Content Section */}
          <div className="col-md-9 p-4 p-md-5 bg-white">
            <header className="mb-5 border-bottom pb-3">
              <h3 className="fw-bold font-serif" style={{ color: colors.textDark, fontSize: '2.2rem' }}>
                {userName}'s Insights Hub
              </h3>
              <p className="text-muted" style={{ fontSize: '1.1rem' }}>
                Explore the historical performance and analysis of your land, {userName}.
              </p>
            </header>

            <div className="accordion custom-accordion" id="predictionAccordion">

              {/* CROP RECOMMENDATION */}
              <div className="accordion-item mb-4 border-0 shadow-sm rounded-4 overflow-hidden">
                <h2 className="accordion-header">
                  <button className="accordion-button collapsed px-4 py-3" type="button" data-bs-toggle="collapse" data-bs-target="#collapseCrop">
                    <div className="d-flex justify-content-between w-100 align-items-center pe-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="p-2 rounded-circle" style={{ backgroundColor: colors.lightGreen }}><Sprout size={20} color={colors.primaryGreen} /></div>
                        <span className="fw-bold" style={{ color: colors.textDark }}>Crop Recommendations</span>
                      </div>
                      {soilData.length > 0 && (
                        <span className="badge rounded-pill px-3 py-2" style={{ backgroundColor: colors.primaryGreen }}>Latest: {getPredVal(soilData[0].Prediction)}</span>
                      )}
                    </div>
                  </button>
                </h2>
                <div id="collapseCrop" className="accordion-collapse collapse" data-bs-parent="#predictionAccordion">
                  <div className="accordion-body">
                    {soilData.length > 0 ? (
                      <>
                        <div className="p-3 mb-4 rounded-3 border-start border-4 shadow-sm" style={{ backgroundColor: colors.lightGreen, borderColor: colors.primaryGreen }}>
                          <p className="text-muted small mb-1">Most Recent Result ({formatDateTime(soilData[0].createdAt)})</p>
                          <h4 className="fw-bold mb-0" style={{ color: colors.deepGreen }}>{getPredVal(soilData[0].Prediction)}</h4>
                          <div className="mt-2 small text-dark opacity-75">
                            <strong>Inputs:</strong> N: {soilData[0].Nitrogen} | P: {soilData[0].Phosphorus} | K: {soilData[0].Potassium} | pH: {soilData[0].pH}
                          </div>
                        </div>
                        <p className="fw-bold text-uppercase small mb-3" style={{ color: colors.primaryGreen, letterSpacing: '1px' }}>Previous Records</p>
                        <div className="table-responsive rounded-3 overflow-hidden border">
                          <table className="table table-hover mb-0 text-center">
                            <thead style={{ backgroundColor: colors.textDark, color: colors.white }}>
                              <tr><th>Crop</th><th>N-P-K</th><th>Date</th><th>Action</th></tr>
                            </thead>
                            <tbody>
                              {soilData.slice(1).map((item, index) => (
                                <tr key={index}>
                                  <td className="fw-bold" style={{ color: colors.primaryGreen }}>{getPredVal(item.Prediction)}</td>
                                  <td>{`${item.Nitrogen}-${item.Phosphorus}-${item.Potassium}`}</td>
                                  <td className="text-muted small">{formatDateTime(item.createdAt || item.Timestamp)}</td>
                                  <td>
                                    <button
                                      className="btn btn-sm btn-outline-danger border-0"
                                      onClick={() => deleteRecord(item._id, 'crop')}
                                      title="Delete Record"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : <p className="text-muted text-center py-3">No history available.</p>}
                  </div>
                </div>
              </div>

              {/* YIELD PREDICTION */}
              <div className="accordion-item mb-4 border-0 shadow-sm rounded-4 overflow-hidden">
                <h2 className="accordion-header">
                  <button className="accordion-button collapsed px-4 py-3" type="button" data-bs-toggle="collapse" data-bs-target="#collapseYield">
                    <div className="d-flex justify-content-between w-100 align-items-center pe-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="p-2 rounded-circle" style={{ backgroundColor: "#E3F2FD" }}><Wheat size={20} color="#0D6EFD" /></div>
                        <span className="fw-bold" style={{ color: colors.textDark }}>Yield Predictions</span>
                      </div>
                      {yieldData.length > 0 && (
                        <span className="badge rounded-pill bg-primary px-3 py-2">Latest: {yieldData[0].PredictedYield}</span>
                      )}
                    </div>
                  </button>
                </h2>
                <div id="collapseYield" className="accordion-collapse collapse" data-bs-parent="#predictionAccordion">
                  <div className="accordion-body">
                    {yieldData.length > 0 ? (
                      <>
                        <div className="p-3 mb-4 rounded-3 border-start border-primary border-4 shadow-sm bg-light">
                          <p className="text-muted small mb-1">Most Recent Result ({formatDateTime(yieldData[0].createdAt)})</p>
                          <h4 className="text-primary fw-bold mb-0">{yieldData[0].PredictedYield} <small className="text-muted fs-6">for {yieldData[0].Crop}</small></h4>
                        </div>
                        <div className="table-responsive rounded-3 border overflow-hidden">
                          <table className="table table-hover mb-0 text-center">
                            <thead className="table-dark">
                              <tr><th>Crop</th><th>Yield</th><th>Date</th><th>Action</th></tr>
                            </thead>
                            <tbody>
                              {yieldData.slice(1).map((item, index) => (
                                <tr key={index}>
                                  <td>{item.Crop}</td>
                                  <td className="fw-bold text-primary">{item.PredictedYield}</td>
                                  <td className="text-muted small">{formatDateTime(item.createdAt || item.Timestamp)}</td>
                                  <td>
                                    <button
                                      className="btn btn-sm btn-outline-danger border-0"
                                      onClick={() => deleteRecord(item._id, 'yield')}
                                      title="Delete Record"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : <p className="text-muted text-center py-3">No history available.</p>}
                  </div>
                </div>
              </div>

              {/* FERTILIZER RECOMMENDATION */}
              <div className="accordion-item mb-4 border-0 shadow-sm rounded-4 overflow-hidden">
                <h2 className="accordion-header">
                  <button className="accordion-button collapsed px-4 py-3" type="button" data-bs-toggle="collapse" data-bs-target="#collapseFert">
                    <div className="d-flex justify-content-between w-100 align-items-center pe-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="p-2 rounded-circle" style={{ backgroundColor: "#FFF8E1" }}><Droplets size={20} color="#FFC107" /></div>
                        <span className="fw-bold" style={{ color: colors.textDark }}>Fertilizer Recommendations</span>
                      </div>
                      {fertilizerData.length > 0 && (
                        <span className="badge rounded-pill bg-warning text-dark px-3 py-2">Latest: {getPredVal(fertilizerData[0].RecommendedFertilizer)}</span>
                      )}
                    </div>
                  </button>
                </h2>
                <div id="collapseFert" className="accordion-collapse collapse" data-bs-parent="#predictionAccordion">
                  <div className="accordion-body">
                    {fertilizerData.length > 0 ? (
                      <>
                        <div className="p-3 mb-4 rounded-3 border-start border-warning border-4 shadow-sm bg-light">
                          <p className="text-muted small mb-1">Most Recent Result ({formatDateTime(fertilizerData[0].createdAt)})</p>
                          <h4 className="text-dark fw-bold mb-0">{getPredVal(fertilizerData[0].RecommendedFertilizer)}</h4>
                          <p className="small mb-0 mt-1 text-muted">Optimized for: <strong>{fertilizerData[0].Crop}</strong> in {fertilizerData[0].SoilType} soil.</p>
                        </div>
                        <div className="table-responsive rounded-3 border overflow-hidden">
                          <table className="table table-hover mb-0 text-center">
                            <thead className="table-dark">
                              <tr><th>Fertilizer</th><th>Crop</th><th>Date</th><th>Action</th></tr>
                            </thead>
                            <tbody>
                              {fertilizerData.slice(1).map((item, index) => (
                                <tr key={index}>
                                  <td className="fw-bold text-warning">{getPredVal(item.RecommendedFertilizer)}</td>
                                  <td>{item.Crop}</td>
                                  <td className="text-muted small">{formatDateTime(item.createdAt || item.Timestamp)}</td>
                                  <td>
                                    <button
                                      className="btn btn-sm btn-outline-danger border-0"
                                      onClick={() => deleteRecord(item._id, 'fertilizer')}
                                      title="Delete Record"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : <p className="text-muted text-center py-3">No history available.</p>}
                  </div>
                </div>
              </div>

            </div>

            <div className="d-flex justify-content-center mt-5">
              <button onClick={() => navigate("/Landing")}
                className="btn px-5 py-3 fw-bold d-flex align-items-center gap-2 shadow-sm rounded-pill"
                style={{ backgroundColor: colors.textDark, color: colors.white, border: 'none', transition: '0.3s' }}>
                <ArrowLeft size={18} /> Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        
        .font-serif { font-family: 'Playfair Display', serif; }
        
        .custom-accordion .accordion-button:not(.collapsed) {
          background-color: transparent;
          box-shadow: none;
        }
        
        .custom-accordion .accordion-button:focus {
          box-shadow: none;
          border-color: rgba(0,0,0,0.1);
        }

        .accordion-item {
          border: 1px solid #eee !important;
        }

        .btn:hover {
          filter: brightness(1.2);
          transform: translateY(-2px);
        }

        .table thead th {
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 15px;
        }
      `}</style>
    </div>
  );
};

export default ParticularUserData;
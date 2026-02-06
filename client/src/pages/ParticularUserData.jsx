import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";

const ParticularUserData = () => {
  const userId = Cookies.get("id");
  const navigate = useNavigate();

  const [soilData, setSoilData] = useState([]);
  const [yieldData, setYieldData] = useState([]);
  const [fertilizerData, setFertilizerData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Theme colors derived from the landscape UI
  const colors = {
    primaryGreen: "#6A8E23",
    deepGreen: "#4A6317",
    creamBg: "#F9F8F3",
    white: "#ffffff"
  };

  useEffect(() => {
    const fetchAllData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const [soilRes, yieldRes, fertRes] = await Promise.all([
          axios.get(`http://localhost:7000/get-form/${userId}`).catch(() => ({ data: [] })),
          axios.get(`http://localhost:7000/api/yield/${userId}`).catch(() => ({ data: [] })),
          axios.get(`http://localhost:7000/api/fertilizer/${userId}`).catch(() => ({ data: [] }))
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

  if (loading) return <div className="text-center mt-5" style={{ color: colors.primaryGreen }}>Loading Dashboard...</div>;

  return (
    <div className="py-4" style={{ backgroundColor: colors.creamBg, minHeight: "100vh" }}>
      <div className="container bg-white rounded-4 shadow-sm p-4" style={{ maxWidth: "950px" }}>
        
        <h3 className="mb-5 text-center fw-bold" style={{ color: colors.deepGreen, fontFamily: 'serif' }}>
          Agricultural Insights Hub 📊
        </h3>

        <div className="accordion" id="predictionAccordion">
          
          {/* ================= CROP RECOMMENDATION ================= */}
          <div className="accordion-item mb-3 border-0 shadow-sm overflow-hidden" style={{ borderRadius: "12px" }}>
            <h2 className="accordion-header">
              <button 
                className="accordion-button collapsed px-4" 
                type="button" 
                data-bs-toggle="collapse" 
                data-bs-target="#collapseCrop"
                style={{ backgroundColor: "#f4f7f0", color: colors.deepGreen }}
              >
                <div className="d-flex justify-content-between w-100 align-items-center pe-3">
                  <span className="fw-bold">🌱 Crop Recommendation</span>
                  {soilData.length > 0 && (
                    <span className="badge rounded-pill px-3" style={{ backgroundColor: colors.primaryGreen }}>Latest: {soilData[0].Prediction}</span>
                  )}
                </div>
              </button>
            </h2>
            <div id="collapseCrop" className="accordion-collapse collapse" data-bs-parent="#predictionAccordion">
              <div className="accordion-body bg-white">
                {soilData.length > 0 ? (
                  <>
                    <div className="p-3 mb-4 rounded border-start border-4 shadow-sm" style={{ borderLeftColor: colors.primaryGreen, backgroundColor: colors.creamBg }}>
                      <p className="text-muted small mb-1">Most Recent Result ({formatDateTime(soilData[0].createdAt)})</p>
                      <h4 className="fw-bold mb-0" style={{ color: colors.primaryGreen }}>{soilData[0].Prediction}</h4>
                      <div className="mt-2 small text-dark">
                        <strong>Inputs:</strong> N: {soilData[0].Nitrogen} | P: {soilData[0].Phosphorus} | K: {soilData[0].Potassium} | pH: {soilData[0].pH}
                      </div>
                    </div>

                    <p className="fw-bold text-secondary small text-uppercase">Previous Recommendations</p>
                    <div className="table-responsive" style={{ maxHeight: "250px", overflowY: "auto", borderRadius: "8px" }}>
                      <table className="table table-hover table-sm align-middle text-center mb-0">
                        <thead className="sticky-top" style={{ backgroundColor: colors.deepGreen, color: "#fff" }}>
                          <tr><th>Crop</th><th>N-P-K</th><th>Date</th></tr>
                        </thead>
                        <tbody>
                          {soilData.slice(1).map((item, index) => (
                            <tr key={index}>
                              <td className="fw-bold" style={{ color: colors.primaryGreen }}>{item.Prediction}</td>
                              <td>{`${item.Nitrogen}-${item.Phosphorus}-${item.Potassium}`}</td>
                              <td className="text-muted small">{formatDateTime(item.createdAt || item.Timestamp)}</td>
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

          {/* ================= YIELD PREDICTION ================= */}
          <div className="accordion-item mb-3 border-0 shadow-sm overflow-hidden" style={{ borderRadius: "12px" }}>
            <h2 className="accordion-header">
              <button 
                className="accordion-button collapsed px-4" 
                type="button" 
                data-bs-toggle="collapse" 
                data-bs-target="#collapseYield"
                style={{ backgroundColor: "#f0f4f8", color: "#2E5A88" }}
              >
                <div className="d-flex justify-content-between w-100 align-items-center pe-3">
                  <span className="fw-bold">🌾 Yield Prediction</span>
                  {yieldData.length > 0 && (
                    <span className="badge rounded-pill bg-primary px-3">Latest: {yieldData[0].PredictedYield}</span>
                  )}
                </div>
              </button>
            </h2>
            <div id="collapseYield" className="accordion-collapse collapse" data-bs-parent="#predictionAccordion">
              <div className="accordion-body bg-white">
                {yieldData.length > 0 ? (
                  <>
                    <div className="p-3 mb-4 rounded border-start border-primary border-4 shadow-sm bg-light">
                      <p className="text-muted small mb-1">Most Recent Result ({formatDateTime(yieldData[0].createdAt)})</p>
                      <h4 className="text-primary fw-bold mb-0">{yieldData[0].PredictedYield} <small className="text-muted fs-6">for {yieldData[0].Crop}</small></h4>
                    </div>

                    <p className="fw-bold text-secondary small text-uppercase">Previous Predictions</p>
                    <div className="table-responsive" style={{ maxHeight: "250px", overflowY: "auto", borderRadius: "8px" }}>
                      <table className="table table-hover table-sm align-middle text-center mb-0">
                        <thead className="table-dark sticky-top">
                          <tr><th>Crop</th><th>Yield</th><th>Date</th></tr>
                        </thead>
                        <tbody>
                          {yieldData.slice(1).map((item, index) => (
                            <tr key={index}>
                              <td>{item.Crop}</td>
                              <td className="fw-bold text-primary">{item.PredictedYield}</td>
                              <td className="text-muted small">{formatDateTime(item.createdAt || item.Timestamp)}</td>
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

          {/* ================= FERTILIZER RECOMMENDATION ================= */}
          <div className="accordion-item mb-3 border-0 shadow-sm overflow-hidden" style={{ borderRadius: "12px" }}>
            <h2 className="accordion-header">
              <button 
                className="accordion-button collapsed px-4" 
                type="button" 
                data-bs-toggle="collapse" 
                data-bs-target="#collapseFert"
                style={{ backgroundColor: "#fdf8e6", color: "#B48D08" }}
              >
                <div className="d-flex justify-content-between w-100 align-items-center pe-3 ">
                  <span className="fw-bold text-dark">🌿 Fertilizer Recommendation</span>
                  {fertilizerData.length > 0 && (
                    <span className="badge rounded-pill bg-warning text-dark px-3">Latest: {fertilizerData[0].RecommendedFertilizer}</span>
                  )}
                </div>
              </button>
            </h2>
            <div id="collapseFert" className="accordion-collapse collapse" data-bs-parent="#predictionAccordion">
              <div className="accordion-body bg-white">
                {fertilizerData.length > 0 ? (
                  <>
                    <div className="p-3 mb-4 rounded border-start border-warning border-4 shadow-sm bg-light">
                      <p className="text-muted small mb-1">Most Recent Result ({formatDateTime(fertilizerData[0].createdAt)})</p>
                      <h4 className="text-dark fw-bold mb-0">{fertilizerData[0].RecommendedFertilizer}</h4>
                      <p className="small mb-0 mt-1 text-muted">Optimized for: <strong>{fertilizerData[0].Crop}</strong> in {fertilizerData[0].SoilType} soil.</p>
                    </div>

                    <p className="fw-bold text-secondary small text-uppercase">Previous History</p>
                    <div className="table-responsive" style={{ maxHeight: "250px", overflowY: "auto", borderRadius: "8px" }}>
                      <table className="table table-hover table-sm align-middle text-center mb-0">
                        <thead className="table-dark sticky-top">
                          <tr><th>Fertilizer</th><th>Crop</th><th>Date</th></tr>
                        </thead>
                        <tbody>
                          {fertilizerData.slice(1).map((item, index) => (
                            <tr key={index}>
                              <td className="fw-bold text-warning">{item.RecommendedFertilizer}</td>
                              <td>{item.Crop}</td>
                              <td className="text-muted small">{formatDateTime(item.createdAt || item.Timestamp)}</td>
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

        <div className="text-center mt-5 mb-4">
          <button 
            className="btn px-5 shadow-sm rounded-pill text-white fw-bold" 
            style={{ backgroundColor: colors.deepGreen }}
            onClick={() => navigate("/Landing")}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParticularUserData;
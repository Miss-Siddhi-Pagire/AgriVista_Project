import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
import { Toaster, toast } from "react-hot-toast";
import {
  MapPin, AlertTriangle, Plus, ThumbsUp, Trash2,
  Filter, Activity, Leaf, Search, X
} from "lucide-react";
import url from "../url";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker
} from "react-simple-maps";
import { geoCentroid } from "d3-geo";

// ── Severity config ──────────────────────────────────────────────────────────
const SEVERITY_CONFIG = {
  Low:      { color: "#22c55e", bg: "#dcfce7", border: "#bbf7d0" },
  Moderate: { color: "#f59e0b", bg: "#fef3c7", border: "#fde68a" },
  High:     { color: "#ef4444", bg: "#fee2e2", border: "#fecaca" },
  Critical: { color: "#7c3aed", bg: "#ede9fe", border: "#ddd6fe" },
};

const STATES = ["Punjab","Maharashtra","Gujarat","Madhya Pradesh","Uttar Pradesh","Haryana"];

const DISTRICTS = {
  "Punjab": ["Ludhiana","Amritsar","Jalandhar","Patiala","Bathinda","Gurdaspur"],
  "Maharashtra": ["Pune","Nashik","Nagpur","Aurangabad","Solapur","Kolhapur"],
  "Gujarat": ["Ahmedabad","Surat","Rajkot","Vadodara","Junagadh","Anand"],
  "Madhya Pradesh": ["Indore","Bhopal","Ujjain","Gwalior","Jabalpur","Sagar"],
  "Uttar Pradesh": ["Lucknow","Agra","Kanpur","Varanasi","Meerut","Allahabad"],
  "Haryana": ["Karnal","Panipat","Rohtak","Hisar","Sirsa","Ambala"],
};

const COMMON_DISEASES = [
  "Leaf Blight","Powdery Mildew","Rust","Stem Rot","Root Rot",
  "Bacterial Wilt","Fusarium Wilt","Downy Mildew","Smut","Aphid Infestation",
  "Whitefly Attack","Brown Spot","Blast","Sheath Blight","Other"
];

const CROPS = ["Wheat","Rice","Cotton","Soybean","Maize","Sugarcane","Onion","Potato","Tomato","Mustard","Chickpea","Groundnut"];

// ── Map Visualizer ─────────────────────────────────────────────────────────────
// Plots reports as colored circles on an actual India map
const SEVERITY_DOT_SIZE = { Low: 4, Moderate: 6, High: 8, Critical: 10 };

function MapViz({ reports, onSelectReport }) {
  const [hoveredId, setHoveredId] = useState(null);
  
  return (
    <div style={{ position: "relative", width: "100%", paddingBottom: "85%", background: "linear-gradient(135deg,#f0fdf4,#dbeafe)", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(74,222,128,0.25)" }}>
      
      <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 1300,
            center: [81, 22] // center of India
          }}
          style={{ width: "100%", height: "100%" }}
        >
          <Geographies geography="/india-states.json">
            {({ geographies }) => (
              <>
                {geographies.map(geo => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    style={{
                      default: { fill: "rgba(240,253,244,0.7)", stroke: "rgba(74,222,128,0.5)", strokeWidth: 0.5, outline: "none" },
                      hover: { fill: "rgba(187,247,208,0.5)", stroke: "rgba(74,222,128,0.8)", strokeWidth: 0.5, outline: "none" },
                      pressed: { fill: "rgba(187,247,208,0.6)", outline: "none" }
                    }}
                  />
                ))}
                {geographies.map(geo => {
                  const centroid = geoCentroid(geo);
                  // Optional adjustments for specific state label placement
                  let [x, y] = centroid;
                  if (geo.properties.NAME_1 === "Uttar Pradesh") { y -= 0.5; x += 1; }
                  
                  return (
                    <Marker key={geo.rsmKey + "-label"} coordinates={[x, y]}>
                      <text y={0} fontSize={8} fontWeight={600} textAnchor="middle" fill="rgba(5,46,22,0.6)" fontFamily="serif" style={{ pointerEvents: "none" }}>
                        {geo.properties.NAME_1}
                      </text>
                    </Marker>
                  );
                })}
              </>
            )}
          </Geographies>

          {reports.filter(r => r.latitude && r.longitude).map(r => {
            const cfg = SEVERITY_CONFIG[r.severity];
            const sz = SEVERITY_DOT_SIZE[r.severity] || 5;
            const isHovered = hoveredId === r._id;
            return (
              <Marker key={r._id} coordinates={[parseFloat(r.longitude), parseFloat(r.latitude)]}>
                <g style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHoveredId(r._id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => onSelectReport(r)}
                >
                  {(r.severity === "Critical" || r.severity === "High") && (
                    <circle cx={0} cy={0} r={sz + 4} fill={cfg.color} opacity="0.18">
                      <animate attributeName="r" values={`${sz};${sz+6};${sz}`} dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle cx={0} cy={0} r={isHovered ? sz + 2 : sz} fill={cfg.color} stroke="#fff" strokeWidth="1" opacity="0.9" />
                </g>
              </Marker>
            );
          })}
        </ComposableMap>
      </div>

      <div style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(255,255,255,0.92)", borderRadius: 8, padding: "8px 12px", fontSize: 11, backdropFilter: "blur(4px)" }}>
        {Object.entries(SEVERITY_CONFIG).map(([sev, cfg]) => (
          <div key={sev} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: cfg.color }} />
            <span style={{ color: "#334155", fontWeight: 500 }}>{sev}</span>
          </div>
        ))}
      </div>

      <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(255,255,255,0.85)", borderRadius: 8, padding: "4px 10px", fontSize: 10, color: "#64748b", backdropFilter: "blur(4px)" }}>
        🗺️ Interactive Disease Map — India
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const DiseaseHeatmap = () => {
  const [cookies] = useCookies(["token"]);
  const [userId, setUserId] = useState(null);
  const [usernameState, setUsername] = useState("Farmer");

  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterState, setFilterState] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [searchDisease, setSearchDisease] = useState("");

  // Selected pin detail
  const [selectedReport, setSelectedReport] = useState(null);

  // Modal
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    cropName: "Wheat", diseaseName: "Leaf Blight", severity: "Moderate",
    description: "", state: "Punjab", district: "Ludhiana"
  });

  // Auth
  useEffect(() => {
    if (!cookies.token) return;
    axios.post(`${url}/`, { tok: cookies.token }, { withCredentials: true })
      .then(({ data }) => {
        if (data.status) {
          setUserId(data.id);
          setUsername(data.username || "Farmer");
        }
      }).catch(() => {});
  }, [cookies]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterState) params.state = filterState;
      if (filterSeverity) params.severity = filterSeverity;
      if (searchDisease) params.disease = searchDisease;
      const { data } = await axios.get(`${url}/api/disease-reports`, { params });
      if (data.success) { setReports(data.reports); setStats(data.stats); }
    } catch (err) {
      toast.error("Failed to load disease reports.");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, [filterState, filterSeverity, searchDisease]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) { toast.error("Please log in to submit a report."); return; }
    setSubmitting(true);
    try {
      const { data } = await axios.post(`${url}/api/disease-reports`, {
        userId, username: usernameState, ...formData
      });
      if (data.success) {
        toast.success("Report submitted! Helping farmers stay safe. 🌾");
        setShowForm(false);
        fetchReports();
      }
    } catch (err) { toast.error("Failed to submit report."); }
    finally { setSubmitting(false); }
  };

  const handleUpvote = async (id) => {
    try {
      const { data } = await axios.patch(`${url}/api/disease-reports/${id}/upvote`);
      if (data.success) {
        setReports(prev => prev.map(r => r._id === id ? { ...r, upvotes: data.upvotes } : r));
        toast.success("Confirmed!");
      }
    } catch { toast.error("Failed to upvote."); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this report?")) return;
    try {
      await axios.delete(`${url}/api/disease-reports/${id}`);
      toast.success("Report removed.");
      fetchReports();
    } catch { toast.error("Failed to delete."); }
  };

  // Top diseases
  const topDiseases = useMemo(() =>
    Object.entries(stats)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 6),
    [stats]
  );

  const totalReports = reports.length;
  const criticalCount = reports.filter(r => r.severity === "Critical").length;
  const highCount = reports.filter(r => r.severity === "High").length;
  const affectedDistricts = new Set(reports.map(r => r.district)).size;

  return (
    <div className="dash-wrap">
      <Toaster position="top-center" />

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <div className="dash-sidebar" style={{ width: 280, padding: "1.5rem", backgroundColor: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.5rem" }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#ef4444,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <Activity size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--forest)", fontFamily: "var(--ff-head)" }}>Disease Heatmap</h3>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Crowdsourced Reports</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: "1.5rem" }}>
          {[
            { val: totalReports, label: "Reports", color: "#3b82f6" },
            { val: affectedDistricts, label: "Districts", color: "#10b981" },
            { val: criticalCount, label: "Critical", color: "#7c3aed" },
            { val: highCount, label: "High Risk", color: "#ef4444" },
          ].map(({ val, label, color }) => (
            <div key={label} style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 8px", textAlign: "center", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color, fontFamily: "var(--ff-head)" }}>{val}</div>
              <div style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <button
          onClick={() => setShowForm(true)}
          style={{ width: "100%", padding: "11px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: "1.5rem" }}
        >
          <Plus size={18} /> Report Disease
        </button>

        {/* Filters */}
        <div className="dash-sidebar-title">Filters</div>
        <select value={filterState} onChange={e => setFilterState(e.target.value)}
          style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.85rem", marginBottom: 8, background: "#f8fafc" }}>
          <option value="">All States</option>
          {STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}
          style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.85rem", marginBottom: 8, background: "#f8fafc" }}>
          <option value="">All Severities</option>
          {Object.keys(SEVERITY_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{ position: "relative", marginBottom: "1.5rem" }}>
          <Search size={14} color="#94a3b8" style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: 10 }} />
          <input type="text" placeholder="Search disease..." value={searchDisease}
            onChange={e => setSearchDisease(e.target.value)}
            style={{ width: "100%", padding: "9px 10px 9px 30px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#f8fafc", boxSizing: "border-box" }} />
        </div>

        {/* Disease stats */}
        {topDiseases.length > 0 && (
          <>
            <div className="dash-sidebar-title">Top Outbreaks</div>
            {topDiseases.map(([disease, info]) => (
              <div key={disease} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ fontSize: "0.8rem", color: "#1e293b", fontWeight: 500 }}>{disease}</span>
                <span style={{ fontSize: "0.75rem", background: "#fee2e2", color: "#dc2626", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>{info.count}</span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* ── MAIN ────────────────────────────────────────────────────────────── */}
      <div className="dash-main">
        <div className="dash-header" style={{ marginBottom: "1.2rem" }}>
          <h2 style={{ fontFamily: "var(--ff-head)", fontSize: "1.6rem", color: "var(--forest)", margin: 0 }}>
            🗺️ Disease Outbreak Heatmap
          </h2>
          <p style={{ color: "var(--text-muted)", marginTop: 4 }}>
            Community-powered disease tracking across Indian farming regions. Report, verify, and stay protected.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>Loading reports...</div>
        ) : (
          <>
            {/* The Map */}
            <div style={{ marginBottom: "1.5rem" }}>
              <MapViz reports={reports} onSelectReport={setSelectedReport} />
            </div>

            {/* Selected Pin Detail */}
            {selectedReport && (
              <div style={{ marginBottom: "1.5rem", border: `2px solid ${SEVERITY_CONFIG[selectedReport.severity].color}`, borderRadius: 14, padding: "1.2rem", background: SEVERITY_CONFIG[selectedReport.severity].bg, position: "relative" }}>
                <button onClick={() => setSelectedReport(null)} style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                  <X size={18} />
                </button>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ padding: "3px 10px", borderRadius: 20, background: SEVERITY_CONFIG[selectedReport.severity].color, color: "#fff", fontSize: "0.75rem", fontWeight: 700 }}>
                        {selectedReport.severity}
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{new Date(selectedReport.createdAt).toLocaleDateString("en-IN")}</span>
                    </div>
                    <h3 style={{ margin: "0 0 4px", fontFamily: "var(--ff-head)", fontSize: "1.1rem", color: "var(--forest)" }}>{selectedReport.diseaseName}</h3>
                    <p style={{ margin: "0 0 6px", fontSize: "0.85rem", color: "#475569" }}>Crop: <b>{selectedReport.cropName}</b></p>
                    <p style={{ margin: "0 0 6px", fontSize: "0.85rem", color: "#475569" }}>
                      <MapPin size={13} style={{ display: "inline", marginRight: 3 }} />
                      {selectedReport.district}, {selectedReport.state}
                    </p>
                    {selectedReport.description && <p style={{ margin: "0", fontSize: "0.82rem", color: "#64748b", lineHeight: 1.5 }}>{selectedReport.description}</p>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Reported by: <b>{selectedReport.username}</b></div>
                    <button onClick={() => handleUpvote(selectedReport._id)}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}>
                      <ThumbsUp size={14} /> Confirm ({selectedReport.upvotes})
                    </button>
                    {selectedReport.userId === userId && (
                      <button onClick={() => handleDelete(selectedReport._id)}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1px solid #fecaca", background: "#fee2e2", cursor: "pointer", fontSize: "0.82rem", color: "#dc2626", fontWeight: 600 }}>
                        <Trash2 size={14} /> Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Reports List */}
            <div className="dash-card">
              <div className="dash-card-title">
                Recent Reports
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 400 }}>{reports.length} results</span>
              </div>
              {reports.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                  <AlertTriangle size={36} color="#fed7aa" style={{ marginBottom: 10 }} />
                  <p>No disease reports yet. Be the first to report an outbreak!</p>
                  <button className="btn-primary" style={{ marginTop: 12 }} onClick={() => setShowForm(true)}>Report Now</button>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14, marginTop: 12 }}>
                  {reports.slice(0, 12).map(r => {
                    const cfg = SEVERITY_CONFIG[r.severity];
                    return (
                      <div key={r._id} onClick={() => setSelectedReport(r)}
                        style={{ border: `1px solid ${cfg.border}`, borderLeft: `4px solid ${cfg.color}`, borderRadius: 10, padding: "1rem", background: cfg.bg, cursor: "pointer", transition: "transform 0.2s" }}
                        onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                        onMouseLeave={e => e.currentTarget.style.transform = ""}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                          <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#1e293b", fontWeight: 700 }}>{r.diseaseName}</h4>
                          <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: 20, background: cfg.color, color: "#fff", fontWeight: 700, flexShrink: 0 }}>{r.severity}</span>
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#475569", marginBottom: 3 }}>
                          <Leaf size={12} style={{ display: "inline", marginRight: 4 }} />{r.cropName}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: 6 }}>
                          <MapPin size={12} style={{ display: "inline", marginRight: 4 }} />{r.district}, {r.state}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{new Date(r.createdAt).toLocaleDateString("en-IN")}</span>
                          <button onClick={e => { e.stopPropagation(); handleUpvote(r._id); }}
                            style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.7)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 6, padding: "3px 8px", fontSize: "0.72rem", cursor: "pointer", color: "#475569" }}>
                            <ThumbsUp size={11} /> {r.upvotes}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── SUBMIT MODAL ────────────────────────────────────────────────────── */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center", padding: "1rem" }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 520, padding: "2rem", boxShadow: "0 25px 50px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ margin: 0, fontFamily: "var(--ff-head)", color: "var(--forest)", fontSize: "1.3rem" }}>
                🚨 Report a Disease Outbreak
              </h3>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer", color: "#94a3b8" }}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: 5 }}>Crop*</label>
                  <select value={formData.cropName} onChange={e => setFormData(p => ({ ...p, cropName: e.target.value }))}
                    style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.88rem" }}>
                    {CROPS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: 5 }}>Disease*</label>
                  <select value={formData.diseaseName} onChange={e => setFormData(p => ({ ...p, diseaseName: e.target.value }))}
                    style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.88rem" }}>
                    {COMMON_DISEASES.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: 8 }}>Severity*</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                  {Object.entries(SEVERITY_CONFIG).map(([sev, cfg]) => (
                    <div key={sev} onClick={() => setFormData(p => ({ ...p, severity: sev }))}
                      style={{ padding: "10px 5px", borderRadius: 8, textAlign: "center", cursor: "pointer",
                        border: `2px solid ${formData.severity === sev ? cfg.color : "#e2e8f0"}`,
                        background: formData.severity === sev ? cfg.bg : "#fff",
                        color: formData.severity === sev ? cfg.color : "#94a3b8",
                        fontWeight: 700, fontSize: "0.82rem", transition: "all 0.2s" }}>
                      {sev}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: 5 }}>State*</label>
                  <select value={formData.state}
                    onChange={e => setFormData(p => ({ ...p, state: e.target.value, district: DISTRICTS[e.target.value][0] }))}
                    style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.88rem" }}>
                    {STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: 5 }}>District*</label>
                  <select value={formData.district} onChange={e => setFormData(p => ({ ...p, district: e.target.value }))}
                    style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.88rem" }}>
                    {(DISTRICTS[formData.state] || []).map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: 5 }}>Description (Optional)</label>
                <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  rows={3} placeholder="Describe the symptoms you observed..."
                  style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.88rem", resize: "vertical", boxSizing: "border-box" }} />
              </div>

              <button type="submit" disabled={submitting}
                style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: submitting ? "#94a3b8" : "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", fontWeight: 700, fontSize: "1rem", cursor: submitting ? "not-allowed" : "pointer" }}>
                {submitting ? "Submitting..." : "🚨 Submit Report"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiseaseHeatmap;

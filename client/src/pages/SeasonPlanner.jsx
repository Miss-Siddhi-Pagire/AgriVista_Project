import React, { useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { Accordion, Badge, Card, Spinner } from 'react-bootstrap';
import {
    FaSeedling,
    FaWater,
    FaBug,
    FaTractor,
    FaChartLine,
    FaCheckCircle,
    FaExclamationTriangle,
    FaBoxOpen
} from 'react-icons/fa';
import { GiFertilizerBag, GiSickle } from 'react-icons/gi';
import './SeasonPlanner.css';
import html2pdf from "html2pdf.js";
import url from "../url";

const SeasonPlanner = () => {
    const [formData, setFormData] = useState({
        crop: '',
        season: '',
        state: '',
        district: '',
        taluka: ''
    });

    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState(null);
    const [cropImage, setCropImage] = useState(null); // State for crop image

    // Fetch Crop Image from Wikipedia
    const fetchCropImage = async (cropName) => {
        try {
            const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cropName)}`;
            const response = await axios.get(wikiUrl);
            if (response.data.thumbnail && response.data.thumbnail.source) {
                setCropImage(response.data.thumbnail.source);
            } else {
                setCropImage(null);
            }
        } catch (error) {
            console.error("Error fetching crop image:", error);
            setCropImage(null);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setPlan(null);
        setCropImage(null); // Reset image

        // Fetch image immediately (Moved to after plan generation to use English name)
        // fetchCropImage(formData.crop); 

        try {
            const response = await axios.post(
                `${url}/api/season-planner`,
                formData
            );

            if (response.data.success) {
                setPlan(response.data.plan);
                // Fetch image using the English name from the plan, or fallback to user input
                const searchName = response.data.plan.crop_name_english || formData.crop;
                fetchCropImage(searchName);
                toast.success('Smart Plan Generated!');
            }
        } catch (error) {
            console.error('Error fitting plan:', error);
            toast.error('Failed to generate plan. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    /* ---------------- PDF DOWNLOAD ---------------- */
    const handlePrint = () => {
        const element = document.getElementById("season-plan-pdf");
        const fileName = `${formData.crop || 'Crop'}_Season_Plan.pdf`;

        html2pdf().set({
            margin: 0.5,
            filename: fileName,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
        }).from(element).save();

        toast.success("Season Plan downloaded!");
    };

    return (
        <div className="season-planner-container">
            <Toaster position="top-center" />

            <div className="container" style={{ maxWidth: '1000px', margin: '0 auto' }}>

                {/* Header */}
                <div className="text-center mb-5 planner-header">
                    <h1 className="display-4">
                        <span>🌾 Smart Season Guide</span>
                    </h1>
                    <p className="lead text-muted">
                        <span>Get a comprehensive, AI-driven farming strategy tailored to your location.</span>
                    </p>
                </div>

                {/* Input Form */}
                <Card className="planner-card mb-5">
                    <Card.Body className="p-4 p-md-5">

                        <form onSubmit={handleSubmit}>
                            <div className="row g-4">

                                <div className="col-md-6">
                                    <label className="form-label">
                                        <span>Target Crop</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control form-control-lg"
                                        name="crop"
                                        value={formData.crop}
                                        onChange={handleChange}
                                        placeholder="e.g. Wheat, Cotton"
                                        required
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label">
                                        <span>Season</span>
                                    </label>
                                    <select
                                        className="form-select form-select-lg"
                                        name="season"
                                        value={formData.season}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select Season</option>
                                        <option value="Kharif">Kharif (Monsoon)</option>
                                        <option value="Rabi">Rabi (Winter)</option>
                                        <option value="Zaid">Zaid (Summer)</option>
                                        <option value="Whole Year">Whole Year</option>
                                    </select>
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">
                                        <span>State</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleChange}
                                        placeholder="e.g. Punjab"
                                        required
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">
                                        <span>District</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="district"
                                        value={formData.district}
                                        onChange={handleChange}
                                        placeholder="e.g. Ludhiana"
                                        required
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">
                                        <span>Taluka (Optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="taluka"
                                        value={formData.taluka}
                                        onChange={handleChange}
                                        placeholder="e.g. Khanna"
                                    />
                                </div>
                            </div>

                            <div className="mt-5 text-center">
                                <button
                                    type="submit"
                                    className="btn btn-generate btn-lg px-5 py-3 rounded-pill w-100 w-md-auto"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <span className="d-flex align-items-center justify-content-center">
                                            <Spinner animation="border" size="sm" className="me-2" />
                                            <span>Analysing Soil & Climate...</span>
                                        </span>
                                    ) : (
                                        <span>
                                            Generate Smart Plan
                                        </span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </Card.Body>
                </Card>

                {/* Interactive Results */}
                {plan && (
                    <div className="animate__animated animate__fadeInUp">

                        {/* Result Display */}
                        {plan && (
                            <div className="planner-results fade-in">

                                {/* Crop Image & Header */}
                                <div className="text-center mb-4">
                                    {cropImage && (
                                        <img
                                            src={cropImage}
                                            alt={formData.crop}
                                            className="img-fluid rounded-circle shadow-lg mb-3"
                                            style={{ width: '150px', height: '150px', objectFit: 'cover', border: '5px solid #fff' }}
                                        />
                                    )}
                                    <h2 className="text-success fw-bold"><span>Your {formData.season} Plan for {formData.crop}</span></h2>
                                    <p className="text-muted"><span>Based on data for {formData.district}, {formData.state}</span></p>
                                </div>

                                {/* PDF Download Button */}
                                <div className="d-flex justify-content-end mb-3">
                                    <button onClick={handlePrint} className="btn btn-dark d-flex align-items-center gap-2 rounded-pill px-4">
                                        <FaChartLine /> <span>Download PDF Report</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Suitability Badge */}
                        <div className={`suitability-card shadow-sm mb-4 d-flex align-items-center ${plan.suitability?.is_suitable ? 'suitability-success' : 'suitability-warning'}`}>
                            {plan.suitability?.is_suitable ? <FaCheckCircle size={32} className="text-success me-3" /> : <FaExclamationTriangle size={32} className="text-warning me-3" />}
                            <div>
                                <h5 className="mb-1 fw-bold"><span>Suitability Verdict</span></h5>
                                <span className="mb-0 text-muted"><span>{plan.suitability?.analysis}</span></span> <strong className="text-dark"><span>{plan.suitability?.recommendation}</span></strong>
                            </div>
                        </div>

                        <Accordion defaultActiveKey="0" className="season-accordion">

                            {/* 1. Land Prep */}
                            <Accordion.Item eventKey="0">
                                <Accordion.Header><FaTractor className="me-3 text-warning" size={24} /> <span>Land Preparation</span></Accordion.Header>
                                <Accordion.Body className="bg-white">
                                    <h6 className="text-muted text-uppercase small fw-bold mb-3"><span>Action Steps</span></h6>
                                    <ul className="list-group list-group-flush mb-3">
                                        {plan.soil_preparation?.steps?.map((step, i) => (
                                            <li key={i} className="list-group-item border-0 ps-0 d-flex"><i className="bi bi-check-circle-fill text-success me-3 mt-1"></i> <span>{step}</span></li>
                                        ))}
                                    </ul>
                                    <div className="alert alert-warning border-0 rounded-3 d-flex align-items-center">
                                        <div className="me-3 fs-4"><span>💡</span></div>
                                        <div>
                                            <small className="fw-bold text-uppercase opacity-75"><span>Expert Tip</span></small><br />
                                            <span>{plan.soil_preparation?.key_tip}</span>
                                        </div>
                                    </div>
                                </Accordion.Body>
                            </Accordion.Item>

                            {/* 1A. Required Inputs (NEW) */}
                            {plan.inputs_required && (
                                <Accordion.Item eventKey="0A">
                                    <Accordion.Header><FaBoxOpen className="me-3 text-secondary" size={24} /> <span>Required Farm Inputs</span></Accordion.Header>
                                    <Accordion.Body>
                                        <div className="row g-3">
                                            <div className="col-md-4">
                                                <div className="p-3 bg-light rounded-3 h-100 border-top border-success border-3">
                                                    <h6 className="fw-bold text-success mb-2"><span>🌱 Seeds</span></h6>
                                                    <ul className="list-unstyled small mb-0">
                                                        {plan.inputs_required.seeds?.map((item, i) => <li key={i} className="mb-1"><span>• {item}</span></li>)}
                                                    </ul>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="p-3 bg-light rounded-3 h-100 border-top border-info border-3">
                                                    <h6 className="fw-bold text-info mb-2"><span>🧪 Fertilizers</span></h6>
                                                    <ul className="list-unstyled small mb-0">
                                                        {plan.inputs_required.fertilizers?.map((item, i) => <li key={i} className="mb-1"><span>• {item}</span></li>)}
                                                    </ul>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="p-3 bg-light rounded-3 h-100 border-top border-danger border-3">
                                                    <h6 className="fw-bold text-danger mb-2"><span>🛡 Pesticides</span></h6>
                                                    <ul className="list-unstyled small mb-0">
                                                        {plan.inputs_required.pesticides?.map((item, i) => <li key={i} className="mb-1"><span>• {item}</span></li>)}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </Accordion.Body>
                                </Accordion.Item>
                            )}

                            {/* 2. Sowing */}
                            <Accordion.Item eventKey="1">
                                <Accordion.Header><FaSeedling className="me-3 text-success" size={24} /> <span>Seed Selection & Sowing</span></Accordion.Header>
                                <Accordion.Body>
                                    <div className="row g-4">
                                        <div className="col-12">
                                            <h6 className="fw-bold text-success mb-3"><span>Recommended Varieties & Prices</span></h6>
                                            <div className="table-responsive">
                                                <table className="table result-table align-middle">
                                                    <thead>
                                                        <tr>
                                                            <th width="30%"><span>Variety</span></th>
                                                            <th width="45%"><span>Details</span></th>
                                                            <th width="25%"><span>Approx. Price</span></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {plan.sowing?.varieties?.map((v, i) => (
                                                            <tr key={i}>
                                                                <td className="fw-bold"><span>{v.name}</span></td>
                                                                <td className="small text-muted"><span>{v.details}</span></td>
                                                                <td><Badge bg="success" className="px-3 py-2 rounded-pill"><span>{v.approx_price}</span></Badge></td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="p-3 bg-light rounded-3 h-100 border">
                                                <h6 className="fw-bold text-dark mb-3"><span>Parameters</span></h6>
                                                <p className="mb-2 d-flex justify-content-between"><span>Seed Rate:</span> <strong><span>{plan.sowing?.seed_rate}</span></strong></p>
                                                <p className="mb-2 d-flex justify-content-between"><span>Spacing:</span> <strong><span>{plan.sowing?.spacing}</span></strong></p>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="p-3 bg-light rounded-3 h-100 border">
                                                <h6 className="fw-bold text-dark mb-3"><span>Methodology</span></h6>
                                                <p className="mb-2 small"><strong><span>Method:</span></strong> <span>{plan.sowing?.method}</span></p>
                                                <p className="mb-0 small"><strong><span>Treatment:</span></strong> <span>{plan.sowing?.treatment}</span></p>
                                            </div>
                                        </div>
                                    </div>
                                </Accordion.Body>
                            </Accordion.Item>

                            {/* 3. Fertilizers */}
                            <Accordion.Item eventKey="2">
                                <Accordion.Header><GiFertilizerBag className="me-3 text-info" size={24} /> <span>Nutrient Management</span></Accordion.Header>
                                <Accordion.Body>
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle result-table">
                                            <thead>
                                                <tr>
                                                    <th width="25%"><span>Stage</span></th>
                                                    <th width="35%"><span>Fertilizer</span></th>
                                                    <th width="20%"><span>Dose</span></th>
                                                    <th width="20%"><span>Est. Cost</span></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {plan.fertilizer?.schedule?.map((item, i) => (
                                                    <tr key={i}>
                                                        <td className="fw-bold text-secondary"><span>{item.stage}</span></td>
                                                        <td className="fw-bold text-dark"><span>{item.fertilizer}</span></td>
                                                        <td><span>{item.dose}</span></td>
                                                        <td className="text-success fw-bold"><span>{item.approx_price}</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Accordion.Body>
                            </Accordion.Item>

                            {/* 4. Irrigation */}
                            <Accordion.Item eventKey="3">
                                <Accordion.Header><FaWater className="me-3 text-primary" size={24} /> <span>Water Management</span></Accordion.Header>
                                <Accordion.Body>
                                    <p className="lead fs-6 mb-4"><span>{plan.irrigation?.schedule}</span></p>
                                    <h6 className="fw-bold text-primary mb-3"><span>Critical Irrigation Stages</span></h6>
                                    <div className="d-flex flex-wrap gap-2">
                                        {plan.irrigation?.critical_stages?.map((stage, i) => (
                                            <span key={i} className="badge bg-white text-primary border border-primary px-3 py-2 rounded-pill shadow-sm">
                                                <span>{stage}</span>
                                            </span>
                                        ))}
                                    </div>
                                </Accordion.Body>
                            </Accordion.Item>

                            {/* 5. Protection */}
                            <Accordion.Item eventKey="4">
                                <Accordion.Header><FaBug className="me-3 text-danger" size={24} /> <span>Plant Protection</span></Accordion.Header>
                                <Accordion.Body>
                                    <h6 className="text-danger fw-bold mb-3"><span>⚠ Major Threats & Solutions</span></h6>
                                    <div className="row g-3">
                                        {plan.protection?.pests?.map((pest, i) => (
                                            <div key={i} className="col-md-6">
                                                <div className="d-flex align-items-start p-3 bg-light rounded-3 border-start border-4 border-danger h-100">
                                                    <div className="me-3 fs-5"><span>🦗</span></div>
                                                    <div>
                                                        <strong><span>{pest}</span></strong>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {plan.protection?.diseases?.map((d, i) => (
                                            <div key={i + 100} className="col-md-6">
                                                <div className="d-flex align-items-start p-3 bg-light rounded-3 border-start border-4 border-warning h-100">
                                                    <div className="me-3 fs-5"><span>🦠</span></div>
                                                    <div>
                                                        <strong><span>{d}</span></strong>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Accordion.Body>
                            </Accordion.Item>

                            {/* 6. Harvest & Economics */}
                            <Accordion.Item eventKey="5">
                                <Accordion.Header><GiSickle className="me-3 text-success" size={24} /> <span>Harvest & Economics</span></Accordion.Header>
                                <Accordion.Body>
                                    <div className="row g-4">
                                        <div className="col-md-6 border-end-md">
                                            <h6 className="fw-bold text-warning mb-3"><span>Harvesting Guide</span></h6>
                                            <p className="small text-muted mb-2 text-uppercase fw-bold"><span>Signs of Maturity</span></p>
                                            <ul className="mb-4 text-dark small">
                                                {plan.harvest?.signs_of_maturity?.map((s, i) => <li key={i}><span>{s}</span></li>)}
                                            </ul>
                                            <div className="p-3 bg-light rounded-3">
                                                <small className="d-block fw-bold text-muted mb-1"><span>STORAGE</span></small>
                                                <span>{plan.harvest?.storage}</span>
                                            </div>
                                        </div>
                                        <div className="col-md-6 ps-md-4">
                                            <h6 className="fw-bold text-success mb-3"><FaChartLine className="me-2" /><span>Economic Projections</span></h6>
                                            <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-white shadow-sm rounded-3 border-bottom border-success border-3">
                                                <span className="text-muted"><span>Est. Cultivation Cost</span></span>
                                                <strong className="fs-5 text-dark"><span>{plan.economics?.estimated_cost}</span></strong>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-white shadow-sm rounded-3 border-bottom border-primary border-3">
                                                <span className="text-muted"><span>Est. Yield / Acre</span></span>
                                                <strong className="fs-5 text-dark"><span>{plan.economics?.estimated_yield}</span></strong>
                                            </div>
                                            <div className="alert alert-info border-0 small">
                                                <span>{plan.economics?.market_outlook}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Accordion.Body>
                            </Accordion.Item>

                        </Accordion>
                    </div>
                )}
            </div>

            {/* HIDDEN PDF TEMPLATE */}
            <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
                <div id="season-plan-pdf" style={{
                    padding: "40px",
                    fontFamily: 'Arial, sans-serif',
                    color: '#1a1a1a',
                    width: '700px',
                    backgroundColor: 'white',
                    boxSizing: 'border-box'
                }}>
                    {/* Header */}
                    <div style={{ borderBottom: "3px solid #6A8E23", paddingBottom: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1 style={{ color: "#4A6317", margin: 0, fontSize: '24px', fontWeight: 'bold' }}><span>AgriVista Season Guide</span></h1>
                            <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}><span>Comprehensive Farming Strategy</span></p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: 0, fontSize: '12px' }}><strong><span>Date:</span></strong> <span>{new Date().toLocaleDateString()}</span></p>
                            <p style={{ margin: '2px 0 0 0', fontSize: '12px' }}><strong><span>Crop:</span></strong> <span>{formData.crop}</span></p>
                            <p style={{ margin: '2px 0 0 0', fontSize: '12px' }}><strong><span>Region:</span></strong> <span>{formData.district}</span>, <span>{formData.state}</span></p>
                        </div>
                    </div>

                    {plan && (
                        <div>
                            {/* Suitability */}
                            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: plan.suitability?.is_suitable ? '#e8f5e9' : '#fff3e0', border: '1px solid #ddd', borderRadius: '8px' }}>
                                <h3 style={{ fontSize: '16px', margin: '0 0 5px 0', color: '#333' }}><span>Suitability Verdict</span></h3>
                                <p style={{ margin: 0, fontSize: '12px' }}><span>{plan.suitability?.analysis}</span></p>
                                <strong style={{ fontSize: '12px', display: 'block', marginTop: '5px' }}><span>{plan.suitability?.recommendation}</span></strong>
                            </div>

                            {/* Inputs Section for PDF */}
                            {plan.inputs_required && (
                                <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f9f9f9', border: '1px solid #eee', borderRadius: '8px' }}>
                                    <h4 style={{ fontSize: '14px', color: '#4A6317', borderBottom: '1px solid #ccc', paddingBottom: '5px', marginBottom: '10px' }}><span>Required Farm Inputs</span></h4>
                                    <div style={{ display: 'flex', gap: '20px', fontSize: '11px' }}>
                                        <div style={{ flex: 1 }}>
                                            <strong><span>Seeds:</span></strong>
                                            <ul style={{ paddingLeft: '15px', margin: '5px 0' }}>{plan.inputs_required.seeds?.map((s, i) => <li key={i}><span>{s}</span></li>)}</ul>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <strong><span>Fertilizers:</span></strong>
                                            <ul style={{ paddingLeft: '15px', margin: '5px 0' }}>{plan.inputs_required.fertilizers?.map((s, i) => <li key={i}><span>{s}</span></li>)}</ul>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <strong><span>Protection:</span></strong>
                                            <ul style={{ paddingLeft: '15px', margin: '5px 0' }}>{plan.inputs_required.pesticides?.map((s, i) => <li key={i}><span>{s}</span></li>)}</ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Sections Loop */}
                            {[
                                { title: "1. Land Preparation", data: plan.soil_preparation, type: 'list' },
                                { title: "2. Seed Selection & Sowing", data: plan.sowing, type: 'sowing' },
                                { title: "3. Nutrient Management", data: plan.fertilizer, type: 'table' },
                                { title: "4. Water Management", data: plan.irrigation, type: 'text' },
                                { title: "5. Plant Protection", data: plan.protection, type: 'protection' },
                                { title: "6. Harvest & Economics", data: plan.harvest, type: 'harvest' }
                            ].map((section, idx) => (
                                <div key={idx} style={{ marginBottom: '25px' }}>
                                    <h4 style={{
                                        fontSize: '14px',
                                        color: '#4A6317',
                                        borderBottom: '1px solid #ccc',
                                        paddingBottom: '5px',
                                        marginBottom: '10px',
                                        uppercase: 'uppercase'
                                    }}>
                                        <span>{section.title}</span>
                                    </h4>

                                    {/* Content Rendering based on type */}
                                    {section.type === 'list' && (
                                        <ul style={{ fontSize: '11px', paddingLeft: '20px', margin: 0 }}>
                                            {section.data?.steps?.map((s, i) => <li key={i} style={{ marginBottom: '4px' }}><span>{s}</span></li>)}
                                            {section.data?.key_tip && <li style={{ marginTop: '8px', fontStyle: 'italic', color: '#d32f2f' }}><span>Tip:</span> <span>{section.data.key_tip}</span></li>}
                                        </ul>
                                    )}

                                    {section.type === 'sowing' && (
                                        <div style={{ fontSize: '11px' }}>
                                            <p><strong><span>Method:</span></strong> <span>{section.data?.method}</span> | <strong><span>Rate:</span></strong> <span>{section.data?.seed_rate}</span> | <strong><span>Spacing:</span></strong> <span>{section.data?.spacing}</span></p>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                                                        <th style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'left' }}><span>Variety</span></th>
                                                        <th style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'left' }}><span>Details</span></th>
                                                        <th style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'left' }}><span>Price</span></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {section.data?.varieties?.map((v, i) => (
                                                        <tr key={i}>
                                                            <td style={{ padding: '6px', border: '1px solid #ddd' }}><span>{v.name}</span></td>
                                                            <td style={{ padding: '6px', border: '1px solid #ddd' }}><span>{v.details}</span></td>
                                                            <td style={{ padding: '6px', border: '1px solid #ddd' }}><span>{v.approx_price}</span></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {section.type === 'table' && (
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                                            <thead>
                                                <tr style={{ backgroundColor: '#f5f5f5' }}>
                                                    <th style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'left' }}><span>Stage</span></th>
                                                    <th style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'left' }}><span>Fertilizer</span></th>
                                                    <th style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'left' }}><span>Dose</span></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {section.data?.schedule?.map((row, i) => (
                                                    <tr key={i}>
                                                        <td style={{ padding: '6px', border: '1px solid #ddd' }}><span>{row.stage}</span></td>
                                                        <td style={{ padding: '6px', border: '1px solid #ddd' }}><span>{row.fertilizer}</span></td>
                                                        <td style={{ padding: '6px', border: '1px solid #ddd' }}><span>{row.dose}</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}

                                    {section.type === 'text' && (
                                        <div style={{ fontSize: '11px' }}>
                                            <p style={{ margin: 0 }}><span>{section.data?.schedule}</span></p>
                                            <p style={{ marginTop: '5px' }}><strong><span>Critical Stages:</span></strong> <span>{section.data?.critical_stages?.join(', ')}</span></p>
                                        </div>
                                    )}

                                    {section.type === 'protection' && (
                                        <div style={{ fontSize: '11px', display: 'flex', gap: '20px' }}>
                                            <div style={{ flex: 1 }}>
                                                <strong><span>Pests:</span></strong>
                                                <ul style={{ paddingLeft: '15px', margin: '5px 0' }}>
                                                    {section.data?.pests?.map((p, i) => <li key={i}><span>{p}</span></li>)}
                                                </ul>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <strong><span>Diseases:</span></strong>
                                                <ul style={{ paddingLeft: '15px', margin: '5px 0' }}>
                                                    {section.data?.diseases?.map((d, i) => <li key={i}><span>{d}</span></li>)}
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {section.type === 'harvest' && (
                                        <div style={{ fontSize: '11px' }}>
                                            <p><strong><span>Signs:</span></strong> <span>{section.data?.signs_of_maturity?.join(', ')}</span></p>
                                            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f9f9f9', borderTop: '2px solid #6A8E23' }}>
                                                <p style={{ margin: 0 }}><strong><span>Yield Estimate:</span></strong> <span>{plan.economics?.estimated_yield}</span></p>
                                                <p style={{ margin: '5px 0 0 0' }}><strong><span>Cost Estimate:</span></strong> <span>{plan.economics?.estimated_cost}</span></p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '15px', textAlign: 'center', fontSize: '10px', color: '#999' }}>
                                <p><span>Generated by AgriVista AI. Consult local experts before major investment.</span></p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SeasonPlanner;

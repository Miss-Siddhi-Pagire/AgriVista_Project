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
    FaExclamationTriangle
} from 'react-icons/fa';
import { GiFertilizerBag, GiSickle } from 'react-icons/gi';
import './SeasonPlanner.css';

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

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setPlan(null);

        try {
            const response = await axios.post(
                'http://localhost:7000/api/season-planner',
                formData
            );

            if (response.data.success) {
                setPlan(response.data.plan);
                toast.success('Smart Plan Generated!');
            }
        } catch (error) {
            console.error('Error fitting plan:', error);
            toast.error('Failed to generate plan. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="season-planner-container">
            <Toaster position="top-center" />

            <div className="container" style={{ maxWidth: '1000px', margin: '0 auto' }}>

                {/* Header */}
                <div className="text-center mb-5 planner-header">
                    <h1 className="display-4">
                        🌾 Smart Season Guide
                    </h1>
                    <p className="lead text-muted">
                        Get a comprehensive, AI-driven farming strategy tailored to your location.
                    </p>
                </div>

                {/* Input Form */}
                <Card className="planner-card mb-5">
                    <Card.Body className="p-4 p-md-5">

                        <form onSubmit={handleSubmit}>
                            <div className="row g-4">

                                <div className="col-md-6">
                                    <label className="form-label">
                                        Target Crop
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
                                        Season
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
                                        State
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
                                        District
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
                                        Taluka (Optional)
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
                                        <>
                                            <Spinner animation="border" size="sm" className="me-2" />
                                            Analysing Soil & Climate...
                                        </>
                                    ) : (
                                        <>
                                            Generate Smart Plan
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </Card.Body>
                </Card>

                {/* Interactive Results */}
                {plan && (
                    <div className="animate__animated animate__fadeInUp">
                        {/* Suitability Badge */}
                        <div className={`suitability-card shadow-sm mb-4 d-flex align-items-center ${plan.suitability?.is_suitable ? 'suitability-success' : 'suitability-warning'}`}>
                            {plan.suitability?.is_suitable ? <FaCheckCircle size={32} className="text-success me-3" /> : <FaExclamationTriangle size={32} className="text-warning me-3" />}
                            <div>
                                <h5 className="mb-1 fw-bold">Suitability Verdict</h5>
                                <p className="mb-0 text-muted">{plan.suitability?.analysis} <strong className="text-dark">{plan.suitability?.recommendation}</strong></p>
                            </div>
                        </div>

                        <Accordion defaultActiveKey="0" className="season-accordion">

                            {/* 1. Land Prep */}
                            <Accordion.Item eventKey="0">
                                <Accordion.Header><FaTractor className="me-3 text-warning" size={24} /> <span>Land Preparation</span></Accordion.Header>
                                <Accordion.Body className="bg-white">
                                    <h6 className="text-muted text-uppercase small fw-bold mb-3">Action Steps</h6>
                                    <ul className="list-group list-group-flush mb-3">
                                        {plan.soil_preparation?.steps?.map((step, i) => (
                                            <li key={i} className="list-group-item border-0 ps-0 d-flex"><i className="bi bi-check-circle-fill text-success me-3 mt-1"></i> {step}</li>
                                        ))}
                                    </ul>
                                    <div className="alert alert-warning border-0 rounded-3 d-flex align-items-center">
                                        <div className="me-3 fs-4">💡</div>
                                        <div>
                                            <small className="fw-bold text-uppercase opacity-75">Expert Tip</small><br />
                                            {plan.soil_preparation?.key_tip}
                                        </div>
                                    </div>
                                </Accordion.Body>
                            </Accordion.Item>

                            {/* 2. Sowing */}
                            <Accordion.Item eventKey="1">
                                <Accordion.Header><FaSeedling className="me-3 text-success" size={24} /> <span>Seed Selection & Sowing</span></Accordion.Header>
                                <Accordion.Body>
                                    <div className="row g-4">
                                        <div className="col-12">
                                            <h6 className="fw-bold text-success mb-3">Recommended Varieties & Prices</h6>
                                            <div className="table-responsive">
                                                <table className="table result-table align-middle">
                                                    <thead>
                                                        <tr>
                                                            <th width="30%">Variety</th>
                                                            <th width="45%">Details</th>
                                                            <th width="25%">Approx. Price</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {plan.sowing?.varieties?.map((v, i) => (
                                                            <tr key={i}>
                                                                <td className="fw-bold">{v.name}</td>
                                                                <td className="small text-muted">{v.details}</td>
                                                                <td><Badge bg="success" className="px-3 py-2 rounded-pill">{v.approx_price}</Badge></td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="p-3 bg-light rounded-3 h-100 border">
                                                <h6 className="fw-bold text-dark mb-3">Parameters</h6>
                                                <p className="mb-2 d-flex justify-content-between"><span>Seed Rate:</span> <strong>{plan.sowing?.seed_rate}</strong></p>
                                                <p className="mb-2 d-flex justify-content-between"><span>Spacing:</span> <strong>{plan.sowing?.spacing}</strong></p>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="p-3 bg-light rounded-3 h-100 border">
                                                <h6 className="fw-bold text-dark mb-3">Methodology</h6>
                                                <p className="mb-2 small"><strong>Method:</strong> {plan.sowing?.method}</p>
                                                <p className="mb-0 small"><strong>Treatment:</strong> {plan.sowing?.treatment}</p>
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
                                                    <th width="25%">Stage</th>
                                                    <th width="35%">Fertilizer</th>
                                                    <th width="20%">Dose</th>
                                                    <th width="20%">Est. Cost</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {plan.fertilizer?.schedule?.map((item, i) => (
                                                    <tr key={i}>
                                                        <td className="fw-bold text-secondary">{item.stage}</td>
                                                        <td className="fw-bold text-dark">{item.fertilizer}</td>
                                                        <td>{item.dose}</td>
                                                        <td className="text-success fw-bold">{item.approx_price}</td>
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
                                    <p className="lead fs-6 mb-4">{plan.irrigation?.schedule}</p>
                                    <h6 className="fw-bold text-primary mb-3">Critical Irrigation Stages</h6>
                                    <div className="d-flex flex-wrap gap-2">
                                        {plan.irrigation?.critical_stages?.map((stage, i) => (
                                            <span key={i} className="badge bg-white text-primary border border-primary px-3 py-2 rounded-pill shadow-sm">
                                                {stage}
                                            </span>
                                        ))}
                                    </div>
                                </Accordion.Body>
                            </Accordion.Item>

                            {/* 5. Protection */}
                            <Accordion.Item eventKey="4">
                                <Accordion.Header><FaBug className="me-3 text-danger" size={24} /> <span>Plant Protection</span></Accordion.Header>
                                <Accordion.Body>
                                    <h6 className="text-danger fw-bold mb-3">⚠ Major Threats & Solutions</h6>
                                    <div className="row g-3">
                                        {plan.protection?.pests?.map((pest, i) => (
                                            <div key={i} className="col-md-6">
                                                <div className="d-flex align-items-start p-3 bg-light rounded-3 border-start border-4 border-danger h-100">
                                                    <div className="me-3 fs-5">🦗</div>
                                                    <div>
                                                        <strong>{pest}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {plan.protection?.diseases?.map((d, i) => (
                                            <div key={i + 100} className="col-md-6">
                                                <div className="d-flex align-items-start p-3 bg-light rounded-3 border-start border-4 border-warning h-100">
                                                    <div className="me-3 fs-5">🦠</div>
                                                    <div>
                                                        <strong>{d}</strong>
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
                                            <h6 className="fw-bold text-warning mb-3">Harvesting Guide</h6>
                                            <p className="small text-muted mb-2 text-uppercase fw-bold">Signs of Maturity</p>
                                            <ul className="mb-4 text-dark small">
                                                {plan.harvest?.signs_of_maturity?.map((s, i) => <li key={i}>{s}</li>)}
                                            </ul>
                                            <div className="p-3 bg-light rounded-3">
                                                <small className="d-block fw-bold text-muted mb-1">STORAGE</small>
                                                {plan.harvest?.storage}
                                            </div>
                                        </div>
                                        <div className="col-md-6 ps-md-4">
                                            <h6 className="fw-bold text-success mb-3"><FaChartLine className="me-2" />Economic Projections</h6>
                                            <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-white shadow-sm rounded-3 border-bottom border-success border-3">
                                                <span className="text-muted">Est. Cultivation Cost</span>
                                                <strong className="fs-5 text-dark">{plan.economics?.estimated_cost}</strong>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-white shadow-sm rounded-3 border-bottom border-primary border-3">
                                                <span className="text-muted">Est. Yield / Acre</span>
                                                <strong className="fs-5 text-dark">{plan.economics?.estimated_yield}</strong>
                                            </div>
                                            <div className="alert alert-info border-0 small">
                                                {plan.economics?.market_outlook}
                                            </div>
                                        </div>
                                    </div>
                                </Accordion.Body>
                            </Accordion.Item>

                        </Accordion>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SeasonPlanner;

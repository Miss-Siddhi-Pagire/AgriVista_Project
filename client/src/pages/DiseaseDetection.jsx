import React, { useState } from 'react';
import { FaCloudUploadAlt, FaLeaf, FaMicroscope } from 'react-icons/fa';
import { Spinner } from 'react-bootstrap';

const DiseaseDetection = () => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleAnalyze = () => {
        if (!selectedImage) return;
        setAnalyzing(true);
        // Simulate analysis for UI demo
        setTimeout(() => {
            setAnalyzing(false);
            alert("Analysis feature coming soon! Backend integration required.");
        }, 2000);
    };

    const colors = {
        primaryGreen: "#6A8E23",
        deepGreen: "#4A6317",
        lightGreen: "#e9f5db",
        white: "#ffffff"
    };

    return (
        <div style={{ backgroundColor: "#f8f9fa", minHeight: '100vh', padding: '40px 20px', fontFamily: '"Poppins", sans-serif' }}>
            <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>

                {/* Header */}
                <div className="text-center mb-5">
                    <h1 style={{ color: colors.deepGreen, fontWeight: '800', fontSize: '2.5rem' }}>
                        🏥 Plant Doctor
                    </h1>
                    <p className="lead text-muted">
                        Upload a photo of your crop to detect diseases and get instant remedies.
                    </p>
                </div>

                {/* Main Card */}
                <div className="card shadow-lg border-0" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                    <div className="card-body p-5 bg-white">

                        {/* Drag & Drop Area */}
                        <div
                            className={`upload-area text-center p-5 mb-4 ${dragActive ? 'drag-active' : ''}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            style={{
                                border: `3px dashed ${dragActive ? colors.primaryGreen : '#cbd5e0'}`,
                                borderRadius: '15px',
                                backgroundColor: dragActive ? colors.lightGreen : '#f8f9fa',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                position: 'relative'
                            }}
                        >
                            <input
                                type="file"
                                id="file-upload"
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                                accept="image/*"
                            />

                            {!previewUrl ? (
                                <label htmlFor="file-upload" style={{ width: '100%', height: '100%', cursor: 'pointer' }}>
                                    <div className="mb-3">
                                        <FaCloudUploadAlt size={60} color={colors.primaryGreen} />
                                    </div>
                                    <h5 style={{ color: colors.deepGreen }}>Drag & Drop or Click to Upload</h5>
                                    <p className="text-muted small">Supports JPG, PNG, JPEG</p>
                                </label>
                            ) : (
                                <div className="position-relative">
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        style={{ maxHeight: '300px', maxWidth: '100%', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <button
                                        className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 rounded-circle"
                                        onClick={(e) => {
                                            e.preventDefault(); // Prevent triggering label
                                            setSelectedImage(null);
                                            setPreviewUrl(null);
                                        }}
                                        style={{ width: '30px', height: '30px', padding: 0 }}
                                    >
                                        ×
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="text-center">
                            <button
                                className="btn btn-lg px-5 py-3 rounded-pill"
                                onClick={handleAnalyze}
                                disabled={!selectedImage || analyzing}
                                style={{
                                    backgroundColor: colors.primaryGreen,
                                    color: 'white',
                                    fontWeight: '600',
                                    border: 'none',
                                    boxShadow: '0 4px 10px rgba(106, 142, 35, 0.3)',
                                    opacity: (!selectedImage || analyzing) ? 0.7 : 1
                                }}
                            >
                                {analyzing ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Analyzing Leaf...
                                    </>
                                ) : (
                                    <>
                                        <FaMicroscope className="me-2" /> Analyze Crop
                                    </>
                                )}
                            </button>
                        </div>

                    </div>

                    {/* Instructions Section */}
                    <div className="card-footer p-4" style={{ backgroundColor: colors.lightGreen }}>
                        <h6 className="fw-bold mb-3" style={{ color: colors.deepGreen }}>📸 Tips for Best Results:</h6>
                        <div className="row g-3">
                            <div className="col-md-4 d-flex align-items-center">
                                <FaLeaf className="me-2 text-success" /> Capture the infected leaf clearly in focus.
                            </div>
                            <div className="col-md-4 d-flex align-items-center">
                                <FaLeaf className="me-2 text-success" /> Avoid blurry or extremely dark images.
                            </div>
                            <div className="col-md-4 d-flex align-items-center">
                                <FaLeaf className="me-2 text-success" /> Keep the background neutral if possible.
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <style>{`
                .upload-area:hover {
                    border-color: ${colors.primaryGreen} !important;
                    background-color: ${colors.lightGreen} !important;
                }
            `}</style>
        </div>
    );
};

export default DiseaseDetection;

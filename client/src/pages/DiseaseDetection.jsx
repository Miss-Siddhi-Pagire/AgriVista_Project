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
    <div className="dash-wrap">
      {/* DASHBOARD SIDEBAR */}
      <div className="dash-sidebar">
        <div className="dash-sidebar-title">Menu</div>
        <div className="sidebar-item active">
          <FaMicroscope className="sidebar-icon" style={{color: "var(--leaf)"}}/> Disease Detection
        </div>
      </div>

      {/* DASHBOARD MAIN */}
      <div className="dash-main">
        {/* Header */}
        <div className="dash-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            🏥 Plant Doctor
          </h2>
          <p>Upload a photo of your crop to detect diseases and get instant remedies.</p>
        </div>

        {/* Main Card */}
        <div className="dash-card" style={{ maxWidth: '800px', margin: '0 auto', borderTop: '4px solid var(--leaf)', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '2.5rem' }}>
            {/* Drag & Drop Area */}
            <div
              className={`upload-area ${dragActive ? 'active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragActive ? 'var(--leaf)' : 'rgba(74,222,128,0.4)'}`,
                borderRadius: '16px',
                backgroundColor: dragActive ? 'var(--mint)' : '#f9fef9',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                position: 'relative',
                textAlign: 'center',
                padding: '3rem 2rem'
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
                <label htmlFor="file-upload" style={{ width: '100%', height: '100%', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(74,222,128,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.2rem' }}>
                    <FaCloudUploadAlt size={40} color="var(--leaf)" />
                  </div>
                  <h5 style={{ fontFamily: 'var(--ff-head)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--forest)', marginBottom: '5px' }}>
                    Drag & Drop or Click to Upload
                  </h5>
                  <p style={{ fontFamily: 'var(--ff-body)', fontSize: '0.8rem', color: 'var(--text-light)', margin: 0 }}>
                    Supports JPG, PNG, JPEG
                  </p>
                </label>
              ) : (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={{ maxHeight: '300px', maxWidth: '100%', borderRadius: '12px', boxShadow: '0 8px 24px rgba(5,46,22,0.12)', border: '2px solid var(--card-border)' }}
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedImage(null);
                      setPreviewUrl(null);
                    }}
                    style={{
                      position: 'absolute',
                      top: '-12px',
                      right: '-12px',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: '2px solid white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '16px',
                      boxShadow: '0 4px 8px rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button
                className="btn-primary"
                onClick={handleAnalyze}
                disabled={!selectedImage || analyzing}
                style={{
                  padding: '12px 36px',
                  fontSize: '1rem',
                  opacity: (!selectedImage || analyzing) ? 0.7 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                {analyzing ? (
                  <>
                    <Spinner animation="border" size="sm" />
                    Analyzing Sample...
                  </>
                ) : (
                  <>
                    <FaMicroscope /> Analyze Crop
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Instructions Section */}
          <div style={{ backgroundColor: 'var(--mint-light)', borderTop: '1px solid rgba(74,222,128,0.15)', padding: '1.5rem 2.5rem' }}>
            <h6 style={{ fontFamily: 'var(--ff-head)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--forest)', marginBottom: '1rem' }}>
              📸 Tips for Best Results:
            </h6>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <FaLeaf color="var(--leaf)" style={{ marginTop: '3px', flexShrink: 0 }} />
                <span>Capture the infected leaf clearly in focus.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <FaLeaf color="var(--leaf)" style={{ marginTop: '3px', flexShrink: 0 }} />
                <span>Avoid blurry or extremely dark images.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <FaLeaf color="var(--leaf)" style={{ marginTop: '3px', flexShrink: 0 }} />
                <span>Keep the background neutral if possible.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiseaseDetection;

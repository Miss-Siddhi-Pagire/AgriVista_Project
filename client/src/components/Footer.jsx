import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const colors = {
    deepGreen: "#4A6317", // Deep Moss Green from UI
    primaryGreen: "#6A8E23", // Olive Green
    creamBg: "#F9F8F3",
    textLight: "#FFFFFF",
    textMuted: "#D1D5DB"
  };

  return (
    <footer className="w-100 mt-auto" style={{ backgroundColor: colors.deepGreen, color: colors.textLight }}>
      <div className="container-fluid px-5 py-5">
        <div className="row g-5 justify-content-between">
          
          {/* Brand Section */}
          <div className="col-lg-4 col-md-12">
            <div className="d-flex align-items-center mb-4">
              {/* SVG Logo Matching Navbar */}
              <div className="me-3" style={{
                width: "40px",
                height: "40px",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(4px)"
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={colors.primaryGreen} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8a8 8 0 0 1-8 8Z" />
                  <path d="M13 22c0-3 0-4-3-6" />
                </svg>
              </div>
              <h3 className="mb-0" style={{ fontFamily: 'serif', fontWeight: '700', letterSpacing: '0.5px' }}>AgriVista</h3>
            </div>
            <p className="small opacity-75" style={{ maxWidth: '320px', lineHeight: '1.6' }}>
              "Empowering the agricultural community with precision data and AI-driven 
              insights for sustainable crop management and higher yields."
            </p>
            {/* Social Icons Style from UI */}
            <div className="d-flex gap-3 mt-4">
               {['facebook', 'twitter', 'instagram', 'linkedin'].map(social => (
                 <i key={social} className={`bi bi-${social} opacity-50 hover-opacity-100`} style={{ cursor: 'pointer', transition: '0.3s' }}></i>
               ))}
            </div>
          </div>

          {/* Links Group */}
          <div className="col-lg-4 col-md-12">
            <div className="row">
              <div className="col-6">
                <h6 className="text-uppercase small fw-bold mb-4" style={{ letterSpacing: '1px', color: colors.primaryGreen }}>Services</h6>
                <ul className="list-unstyled small">
                  <li className="mb-3"><Link to="/update" className="text-decoration-none text-white opacity-75 hover-link">Crop Recommendation</Link></li>
                  <li className="mb-3"><Link to="/update" className="text-decoration-none text-white opacity-75 hover-link">Yield Prediction</Link></li>
                  <li className="mb-3"><Link to="/update" className="text-decoration-none text-white opacity-75 hover-link">Fertilizer Insights</Link></li>
                </ul>
              </div>
              <div className="col-6">
                <h6 className="text-uppercase small fw-bold mb-4" style={{ letterSpacing: '1px', color: colors.primaryGreen }}>Community</h6>
                <ul className="list-unstyled small">
                  <li className="mb-3"><Link to="/forum" className="text-decoration-none text-white opacity-75 hover-link">Farmer's Forum</Link></li>
                  <li className="mb-3"><Link to="/your-data" className="text-decoration-none text-white opacity-75 hover-link">Insight History</Link></li>
                  <li className="mb-3"><Link to="#" className="text-decoration-none text-white opacity-75 hover-link">Success Stories</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Newsletter Section */}
          <div className="col-lg-3 col-md-12">
            <h6 className="text-uppercase small fw-bold mb-4" style={{ letterSpacing: '1px', color: colors.primaryGreen }}>Stay Cultivated</h6>
            <div className="d-flex flex-column gap-3">
              <div className="position-relative">
                <input 
                  type="email" 
                  className="form-control border-0 px-3 py-2" 
                  placeholder="Enter your email" 
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', borderRadius: '8px' }}
                />
              </div>
              <button 
                className="btn w-100 py-2 fw-bold transition-all" 
                type="button" 
                style={{ backgroundColor: colors.primaryGreen, color: '#fff', border: 'none', borderRadius: '8px' }}
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-5 mt-5 border-top border-white border-opacity-10">
          <div className="row align-items-center">
            <div className="col-md-6 text-center text-md-start">
              <p className="small mb-0 opacity-50">
                &copy; {new Date().getFullYear()} AgriVista. All rights reserved. Harvested with care in India.
              </p>
            </div>
            <div className="col-md-6 text-center text-md-end mt-3 mt-md-0">
              <div className="d-flex justify-content-center justify-content-md-end gap-4 opacity-50 small">
                <Link to="#" className="text-decoration-none text-white hover-opacity-100">Privacy Policy</Link>
                <Link to="#" className="text-decoration-none text-white hover-opacity-100">Terms of Service</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .hover-link:hover {
          opacity: 1 !important;
          padding-left: 5px;
          transition: 0.3s ease;
          color: ${colors.primaryGreen} !important;
        }
        .hover-opacity-100:hover {
          opacity: 1 !important;
        }
        input::placeholder {
          color: rgba(255,255,255,0.3) !important;
        }
      `}</style>
    </footer>
  );
};

export default Footer;
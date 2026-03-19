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
    <footer className="footer">
      <div className="footer-top">
        <div>
          <div className="nav-logo" style={{ marginBottom: '.5rem' }}>
            <div className="nav-logo-dot">🌿</div>
            <span style={{ color: '#fff' }}>AgriVista</span>
          </div>
          <p className="footer-brand-desc">Empowering farmers with AI-driven precision agriculture tools.</p>
        </div>
        <div>
          <div className="footer-col-title">Product</div>
          <ul className="footer-links">
            <li><Link to="/season-planner">Season Planner</Link></li>
            <li><Link to="/disease-detection">Disease Detect</Link></li>
            <li><Link to="/update">Predictions</Link></li>
            <li><Link to="/forum">Community</Link></li>
          </ul>
        </div>
        <div>
          <div className="footer-col-title">Company</div>
          <ul className="footer-links">
            <li><Link to="/">About Us</Link></li>
            <li><Link to="/">Blog</Link></li>
            <li><Link to="/">Careers</Link></li>
          </ul>
        </div>
        <div>
          <div className="footer-col-title">Legal</div>
          <ul className="footer-links">
            <li><Link to="/">Privacy Policy</Link></li>
            <li><Link to="/">Terms of Service</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p className="footer-copy">© 2026 AgriVista Technologies Pvt. Ltd. All rights reserved.</p>
        <div className="footer-badges">
          <span className="footer-badge">ISO 27001</span>
          <span className="footer-badge">GDPR</span>
          <span className="footer-badge">SOC 2</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
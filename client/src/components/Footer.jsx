import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="w-100 mt-auto" style={{ backgroundColor: '#d5eeff', borderTop: '1px solid #c3e2f2' }}>
      <div className="container-fluid px-4 py-3">
        <div className="row g-4 justify-content-between">
          
          {/* Brand Section */}
          <div className="col-lg-4 col-md-12">
            <div className="d-flex align-items-center mb-3">
              <h4 className="fw-bold mb-0" style={{ color: '#000' }}>AgriVista</h4>
            </div>
            <p className="text-muted small" style={{ maxWidth: '350px' }}>
              Empowering the agricultural community with precision data and AI-driven 
              insights for sustainable crop management and higher yields.
            </p>
          </div>

          {/* Links Group */}
          <div className="col-lg-4 col-md-12">
            <div className="row">
              <div className="col-6">
                <h6 className="fw-bold mb-3">Services</h6>
                <ul className="list-unstyled small">
                  <li className="mb-2"><Link to="/update" className="text-decoration-none text-dark">Crop Recommendation</Link></li>
                  <li className="mb-2"><Link to="/update" className="text-decoration-none text-dark">Yield Prediction</Link></li>
                  <li className="mb-2"><Link to="/update" className="text-decoration-none text-dark">Fertilizer Insights</Link></li>
                </ul>
              </div>
              <div className="col-6">
                <h6 className="fw-bold mb-3">Community</h6>
                <ul className="list-unstyled small">
                  <li className="mb-2"><Link to="/forum" className="text-decoration-none text-dark">Forum</Link></li>
                  <li className="mb-2"><Link to="/your-data" className="text-decoration-none text-dark">Your Insights</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Newsletter Section */}
          <div className="col-lg-3 col-md-12">
            <h6 className="fw-bold mb-3">Stay Informed</h6>
            <div className="d-flex flex-column gap-2">
              <input 
                type="email" 
                className="form-control border-0" 
                placeholder="Farmer's Email" 
                style={{ backgroundColor: '#fff' }}
              />
              <button 
                className="btn btn-dark w-100" 
                type="button" 
                style={{ backgroundColor: '#2d3748', border: 'none' }}
              >
                Join
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center pt-4 mt-2 border-top border-secondary border-opacity-10">
          <p className="text-muted small mb-0">
            &copy; {new Date().getFullYear()} AgriVista. Harvested with care.
          </p>
          <div className="d-flex gap-4 mt-2 mt-sm-0">
            <Link to="#" className="text-decoration-none text-muted small">Privacy Policy</Link>
            <Link to="#" className="text-decoration-none text-muted small">Terms of Use</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
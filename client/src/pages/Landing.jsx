import React from 'react';
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Search, Sprout, Leaf, Droplets, Target, Shield, Zap } from 'lucide-react';
import Cookies from 'js-cookie';
import { FaMicrophone } from 'react-icons/fa';

const Landing = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isLoggedIn = !!Cookies.get('token');
  const username = Cookies.get('username');

  const Start = () => {
    // If already logged in, go to /update (AI Insights); else go to /signup
    navigate(isLoggedIn ? "/update" : "/signup");
  };

  return (
    <div>
      {/* ── LANDING NAVBAR ── */}
      <nav className="navbar" style={{ paddingLeft: '4rem', paddingRight: '4rem' }}>
        <div className="nav-logo" style={{ textDecoration: 'none' }}>
          <div className="nav-logo-dot">🌿</div>AgriVista
        </div>
        <ul className="nav-links"></ul>
        <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isLoggedIn ? (
            <>
              <button className="nav-btn-ghost" onClick={() => navigate('/home')}>
                Dashboard
              </button>
              <button className="nav-btn-solid" onClick={() => navigate('/update')}>
                AI Insights
              </button>
            </>
          ) : (
            <>
              <button className="nav-btn-ghost" onClick={() => navigate('/login')}>
                Sign In
              </button>
              <button className="nav-btn-solid" onClick={() => navigate('/signup')}>
                Get Started Free
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── HOME HERO ── */}
      <section className="home-hero">
        <div className="home-hero-lines"></div>
        <div className="home-hero-inner">
          
          <div>
            <span className="hero-badge">
              <div className="badge-dot"></div>
              AI-Powered Agriculture
            </span>
            <h1 className="hero-title">Precision Farming for a <span className="h1-accent">Smarter Harvest</span></h1>
            <p className="hero-sub">
              Leverage advanced machine learning to optimize your crop yield, detect diseases early, and maximize your farm's efficiency.
            </p>
            <div className="hero-btns">
              <button className="btn-primary" onClick={Start}>
                {isLoggedIn ? 'Open AI Insights' : 'Get Started Free'}
              </button>
              <button className="btn-outline" onClick={() => navigate('/season-planner')}>Explore Features</button>
            </div>
          </div>

          <div className="hero-metrics">
            <div className="metric-card">
              <div className="metric-icon"><Target size={22} color="var(--forest)" /></div>
              <div>
                <div className="metric-val">98%</div>
                <div className="metric-lbl">Prediction Accuracy</div>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon"><Sprout size={22} color="var(--forest)" /></div>
              <div>
                <div className="metric-val">10k+</div>
                <div className="metric-lbl">Farmers Empowered</div>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon"><Leaf size={22} color="var(--forest)" /></div>
              <div>
                <div className="metric-val">50+</div>
                <div className="metric-lbl">Crop Models</div>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon"><Zap size={22} color="var(--forest)" /></div>
              <div>
                <div className="metric-val">24/7</div>
                <div className="metric-lbl">AI Assistance</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── HOME FEATURES ── */}
      <section className="home-features">
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div className="section-tag" style={{ textAlign: 'center' }}>Features</div>
          <h2 className="section-title" style={{ textAlign: 'center' }}>Everything you need to grow better</h2>
          <p className="hero-sub" style={{ margin: "0 auto", textAlign: 'center' }}>Our comprehensive suite of tools helps you make data-driven decisions throughout the entire farming cycle.</p>
        </div>
        
        <div className="feat-grid">
          <div className="feat-card" onClick={() => navigate(isLoggedIn ? '/update' : '/signup')} style={{ cursor: 'pointer' }}>
            <Search className="feat-icon" style={{color: "var(--leaf)"}} />
            <h3>Crop Recommendation</h3>
            <p>Discover the most profitable crops for your specific soil composition and local climate data.</p>
          </div>
          
          <div className="feat-card" onClick={() => navigate(isLoggedIn ? '/update' : '/signup')} style={{ cursor: 'pointer' }}>
            <Target className="feat-icon" style={{color: "var(--leaf)"}} />
            <h3>Yield Prediction</h3>
            <p>Accurately forecast your harvest volumes to negotiate better prices and plan logistics.</p>
          </div>
          
          <div className="feat-card" onClick={() => navigate(isLoggedIn ? '/update' : '/signup')} style={{ cursor: 'pointer' }}>
            <Sprout className="feat-icon" style={{color: "var(--leaf)"}} />
            <h3>Fertilizer Guide</h3>
            <p>Optimize nutrient application. Stop wasting money on excess fertilizer while protecting the soil.</p>
          </div>
          
          <div className="feat-card" onClick={() => navigate(isLoggedIn ? '/disease-detection' : '/signup')} style={{ cursor: 'pointer' }}>
            <Shield className="feat-icon" style={{color: "var(--leaf)"}} />
            <h3>Disease Detection</h3>
            <p>Instantly identify plant diseases by snapping a photo. Get immediate, actionable treatment plans.</p>
          </div>
          
          <div className="feat-card" onClick={() => navigate(isLoggedIn ? '/season-planner' : '/signup')} style={{ cursor: 'pointer' }}>
            <Droplets className="feat-icon" style={{color: "var(--leaf)"}} />
            <h3>Irrigation AI</h3>
            <p>Smart watering schedules based on real-time weather forecasts and soil moisture models.</p>
          </div>

          <div className="feat-card" onClick={() => navigate(isLoggedIn ? '/market' : '/signup')} style={{ cursor: 'pointer' }}>
            <Zap className="feat-icon" style={{color: "var(--leaf)"}} />
            <h3>Market Insights</h3>
            <p>Track real-time commodity prices and get suggestions on the best time to sell your produce.</p>
          </div>
        </div>
      </section>

      {/* ── HOME HOW IT WORKS ── */}
      <section className="home-how">
        <div style={{ textAlign: "center", position: "relative", zIndex: 2 }}>
          <div className="section-tag" style={{ textAlign: 'center' }}>Process</div>
          <h2 className="section-title" style={{ textAlign: 'center' }}>How AgriVista Works</h2>
        </div>
        <div className="steps-row">
          <div className="step">
            <div className="step-num">1</div>
            <h3>Input Your Data</h3>
            <p>Enter your soil NPK values, pH, and location details into our secure platform.</p>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <h3>AI Analysis</h3>
            <p>Our machine learning models process your data against thousands of agricultural data points.</p>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <h3>Get Actionable Insights</h3>
            <p>Receive precise recommendations on what to plant, how to fertilize, and when to harvest.</p>
          </div>
          <div className="step">
            <div className="step-num">4</div>
            <h3>Maximize Yield</h3>
            <p>Follow the actionable guidelines and see a significant increase in your farming efficiency & profits.</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
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
    </div>
  );
};

export default Landing;
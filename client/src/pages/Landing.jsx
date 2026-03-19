import React from 'react';
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Search, Sprout, Leaf, Droplets, Target, Shield, Zap } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const Start = () => {
    navigate("/update");
  };

  return (
    <div>
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
              <button className="btn-primary" onClick={Start}>Get Started</button>
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
          <div className="feat-card">
            <Search className="feat-icon" style={{color: "var(--leaf)"}} />
            <h3>Crop Recommendation</h3>
            <p>Discover the most profitable crops for your specific soil composition and local climate data.</p>
          </div>
          
          <div className="feat-card">
            <Target className="feat-icon" style={{color: "var(--leaf)"}} />
            <h3>Yield Prediction</h3>
            <p>Accurately forecast your harvest volumes to negotiate better prices and plan logistics.</p>
          </div>
          
          <div className="feat-card">
            <Sprout className="feat-icon" style={{color: "var(--leaf)"}} />
            <h3>Fertilizer Guide</h3>
            <p>Optimize nutrient application. Stop wasting money on excess fertilizer while protecting the soil.</p>
          </div>
          
          <div className="feat-card">
            <Shield className="feat-icon" style={{color: "var(--leaf)"}} />
            <h3>Disease Detection</h3>
            <p>Instantly identify plant diseases by snapping a photo. Get immediate, actionable treatment plans.</p>
          </div>
          
          <div className="feat-card">
            <Droplets className="feat-icon" style={{color: "var(--leaf)"}} />
            <h3>Irrigation AI</h3>
            <p>Smart watering schedules based on real-time weather forecasts and soil moisture models.</p>
          </div>

          <div className="feat-card">
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
    </div>
  );
};

export default Landing;
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Cookies from "js-cookie";
import axios from "axios";
import { ToastContainer } from "react-toastify";
import "../util/config";
import getCropDetails from "../util/CropDetails";
import { useTranslation } from "react-i18next";
import url from "../url";
import cropsData from "../data/data";

const FALLBACK_SVG_DATAURI =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'>
       <rect width='100%' height='100%' fill='#f0fdf4'/>
       <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
       fill='#16a34a' font-family='Arial' font-size='20'>Image not available</text>
     </svg>`
  );

const Home = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [crops, setCrops] = useState(cropsData);
  const [trends, setTrends] = useState([]);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const { data } = await axios.get(`${url}/trends/all`);
        if (data.success) setTrends(data.trends);
      } catch (error) {
        console.error("Failed to fetch trends", error);
      }
    };
    fetchTrends();
  }, []);

  const getCategoryClass = (category) => {
    switch(category?.toLowerCase()) {
      case 'risk': return 'pill-red';
      case 'opportunity': return 'pill-green';
      case 'neutral': return 'pill-blue';
      default: return 'pill-amber';
    }
  };

  const handleImgError = (e) => {
    e.target.src = FALLBACK_SVG_DATAURI;
  };

  return (
    <div style={{ backgroundColor: 'var(--mint-faint)', minHeight: '100vh', padding: '0' }}>
      {/* ── HERO BANNER ── */}
      <div className="home-hero" style={{ padding: '3rem 7.5vw 2rem 7.5vw', borderRadius: '0', marginBottom: '0' }}>
        <div className="home-hero-lines"></div>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div className="hero-badge"><div className="badge-dot"></div>Daily Insights</div>
          <h1 style={{ fontFamily: 'var(--ff-head)', fontSize: '2.5rem', fontWeight: '900', color: 'var(--forest)', marginBottom: '0.8rem' }}>
            Agricultural <span className="h1-accent">Library</span>
          </h1>
          <p className="hero-sub" style={{ margin: '0', maxWidth: '600px' }}>
            Stay updated with the latest market trends and explore our comprehensive intelligence database for precise farming.
          </p>
        </div>
      </div>

      <div style={{ padding: '0 0 4rem 0' }}>
        {/* ── MARKET TRENDS SECTION ── */}
        {trends.length > 0 && (
          <div style={{ 
            backgroundColor: '#ebfbf0', 
            padding: '2.5rem 7.5vw', 
            marginBottom: '4rem',
            borderTop: '1px solid rgba(74,222,128,0.2)',
            borderBottom: '1px solid rgba(74,222,128,0.2)'
          }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
              <div>
                <div className="section-tag">Market Updates</div>
                <h2 className="section-title">Latest Agricultural Trends</h2>
              </div>
            </div>

            {/* Featured Trend */}
            <div className="feat-card" style={{ 
              display: 'flex', gap: '2.5rem', padding: '2.5rem', alignItems: 'center', marginBottom: '3rem', 
              cursor: 'default', background: '#fff', border: '1px solid rgba(74,222,128,0.4)',
              boxShadow: '0 12px 30px rgba(34,197,94,0.08)'
            }}>
              <div style={{ flex: '1.2', borderRadius: '12px', overflow: 'hidden', height: '340px', boxShadow: '0 6px 16px rgba(0,0,0,0.1)' }}>
                <img 
                  src={trends[0].image} 
                  alt={trends[0].title}
                  onError={handleImgError}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              
              <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.2rem' }}>
                  <span className={`pill ${getCategoryClass(trends[0].category)}`}>
                    {trends[0].category}
                  </span>
                  <span style={{ fontFamily: 'var(--ff-body)', fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: '600' }}>
                    {new Date(trends[0].createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 style={{ fontFamily: 'var(--ff-head)', fontSize: '2rem', color: 'var(--forest)', marginBottom: '1.2rem', lineHeight: '1.2' }}>
                  {trends[0].title}
                </h3>
                
                <p style={{ fontFamily: 'var(--ff-body)', fontSize: '0.98rem', color: 'var(--text-muted)', lineHeight: '1.7', marginBottom: '2rem' }}>
                  {trends[0].description}
                </p>
                
                <button className="btn-primary" style={{ width: 'fit-content', backgroundColor: '#0f4d27' }}>
                  Read Full Report →
                </button>
              </div>
            </div>

            {/* More Trends Grid */}
            {trends.length > 1 && (
              <div className="dash-grid3">
                {trends.slice(1).map((trend) => (
                  <div key={trend._id} className="feat-card" style={{ 
                    padding: '0', display: 'flex', flexDirection: 'column',
                    background: '#fff', border: '1px solid var(--card-border)', boxShadow: '0 8px 20px rgba(0,0,0,0.03)'
                  }}>
                    <div style={{ height: '200px', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
                      <img 
                        src={trend.image} 
                        alt={trend.title}
                        onError={handleImgError}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.08)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                      />
                    </div>
                    <div style={{ padding: '1.8rem', display: 'flex', flexDirection: 'column', flex: '1', zIndex: 2 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span className={`pill ${getCategoryClass(trend.category)}`}>
                          {trend.category}
                        </span>
                        <span style={{ fontFamily: 'var(--ff-body)', fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: '600' }}>
                          {new Date(trend.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <h4 style={{ fontFamily: 'var(--ff-head)', fontSize: '1.2rem', color: 'var(--forest)', marginBottom: '1rem', lineHeight: '1.3' }}>
                        {trend.title}
                      </h4>
                      
                      <p style={{ fontFamily: 'var(--ff-body)', fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6', flex: '1' }}>
                        {trend.description.length > 120 ? trend.description.substring(0, 120) + "..." : trend.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CROP LIBRARY GRID ── */}
        <div style={{ padding: '0 7.5vw' }}>
          <div style={{ marginBottom: '2rem' }}>
            <div className="section-tag">Crop Database</div>
            <h2 className="section-title">Explore Crop Varieties</h2>
          </div>
          
          <div className="feat-grid">
            {crops.map((crop, index) => (
              <div key={index} className="metric-card" style={{ flexDirection: 'column', padding: '0', overflow: 'hidden', alignItems: 'stretch' }}>
                <div style={{ height: '160px', width: '100%', overflow: 'hidden' }}>
                  <img
                    src={`/images/${crop.image}`}
                    alt={t(crop.name)}
                    onError={handleImgError}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                  />
                </div>
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: '1', background: '#fff' }}>
                  <h4 style={{ fontFamily: 'var(--ff-head)', fontSize: '1.1rem', color: 'var(--forest)', marginBottom: '0.6rem' }}>
                    {t(crop.name)}
                  </h4>
                  <p style={{ fontFamily: 'var(--ff-body)', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', flex: '1', marginBottom: '1.2rem' }}>
                    {t(crop.description)}
                  </p>
                <div style={{ paddingTop: '1rem', marginTop: 'auto' }}>
                  <button style={{ 
                    width: '100%', 
                    padding: '8px 16px', 
                    backgroundColor: 'var(--leaf)', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '8px', 
                    fontFamily: 'var(--ff-body)', 
                    fontSize: '0.85rem', 
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--leaf-bright)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--leaf)'}
                  >
                    View Guide <span>→</span>
                  </button>
                </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
      <ToastContainer />
    </div>
  );
};

export default Home;
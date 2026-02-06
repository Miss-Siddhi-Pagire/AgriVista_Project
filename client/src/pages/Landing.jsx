import React from 'react';
import "../assets/Button.css";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Search, Sprout, Leaf, Droplets } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const colors = {
    primaryGreen: "#6A8E23", // Olive Green
    deepGreen: "#4A6317",
    creamBg: "#F9F8F3",
    textDark: "#2C3322",
    white: "#ffffff"
  };

  const Start = () => {
    navigate("/update");
  };

  return (
    <div style={{ backgroundColor: colors.creamBg }}>
      {/* Hero Section */}
      <section style={styles.heroSection}>
        <div style={styles.heroOverlay}>
          <div style={styles.heroContent}>
            <div style={styles.textSide}>
              <h1 style={styles.heroTitle}>{t('Title')}</h1>
              <p style={styles.heroSubtitle}>{t('LSlogan')}</p>
              <p style={styles.heroDescription}>{t('LDesc')}</p>
              <button 
                className="btnu-hover" 
                style={styles.mainButton} 
                onClick={Start}
              >
                {t('LButton')}
              </button>
            </div>

            {/* Floating Inquiry Card (Inspired by UI Reference) */}
            
          </div>
        </div>
      </section>

      {/* Services Section (Matching the icon grid in UI) */}
      <section style={styles.servicesSection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.serifHeading}>Let's grow together</h2>
          <div style={styles.underline}></div>
        </div>

        <div style={styles.grid}>
          {[
            { title: "Crop Recommendation", icon: <Sprout size={32} />, desc: "AI-driven selection based on soil health." },
            { title: "Yield Prediction", icon: <Leaf size={32} />, desc: "Forecast your harvest based on climate data." },
            { title: "Fertilizer Insights", icon: <Droplets size={32} />, desc: "Optimize nutrients for sustainable growth." }
          ].map((service, i) => (
            <div key={i} style={styles.serviceCard}>
              <div style={styles.iconCircle}>{service.icon}</div>
              <h4 style={styles.cardTitle}>{service.title}</h4>
              <p style={styles.cardDesc}>{service.desc}</p>
              <button style={styles.textButton} onClick={Start}>Learn More →</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const styles = {
  heroSection: {
    height: '85vh',
    backgroundImage: 'url("https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=2000")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
  },
  heroOverlay: {
    height: '100%',
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 50px',
  },
  heroContent: {
    width: '100%',
    maxWidth: '1200px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '40px',
  },
  textSide: {
    flex: '1',
    minWidth: '300px',
    color: '#fff',
  },
  heroTitle: {
    fontFamily: 'serif',
    fontSize: '5rem',
    fontWeight: '700',
    marginBottom: '10px',
  },
  heroSubtitle: {
    fontSize: '1.8rem',
    fontWeight: '300',
    marginBottom: '20px',
    opacity: '0.9',
  },
  heroDescription: {
    fontSize: '1.1rem',
    maxWidth: '500px',
    marginBottom: '30px',
    lineHeight: '1.6',
    opacity: '0.8',
  },
  mainButton: {
    backgroundColor: '#6A8E23',
    color: '#fff',
    padding: '12px 35px',
    border: 'none',
    borderRadius: '50px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  inquiryCard: {
    backgroundColor: '#F9F8F3',
    padding: '40px',
    borderRadius: '15px',
    width: '380px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
  },
  cardHeader: {
    fontFamily: 'serif',
    color: '#2C3322',
    fontSize: '1.5rem',
    marginBottom: '25px',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    fontSize: '0.8rem',
    color: '#6A8E23',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: '5px',
  },
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '0.9rem',
  },
  cardButton: {
    width: '100%',
    backgroundColor: '#4A6317',
    color: '#fff',
    padding: '12px',
    border: 'none',
    borderRadius: '8px',
    marginTop: '10px',
    fontWeight: '600',
  },
  servicesSection: {
    padding: '80px 50px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  sectionHeader: {
    textAlign: 'center',
    marginBottom: '60px',
  },
  serifHeading: {
    fontFamily: 'serif',
    fontSize: '2.5rem',
    color: '#2C3322',
  },
  underline: {
    width: '60px',
    height: '3px',
    backgroundColor: '#6A8E23',
    margin: '10px auto',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '30px',
  },
  serviceCard: {
    backgroundColor: '#fff',
    padding: '40px',
    borderRadius: '12px',
    textAlign: 'center',
    transition: 'transform 0.3s ease',
    borderBottom: '4px solid #6A8E23',
  },
  iconCircle: {
    width: '70px',
    height: '70px',
    backgroundColor: '#F9F8F3',
    color: '#6A8E23',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },
  cardTitle: {
    fontSize: '1.25rem',
    color: '#2C3322',
    marginBottom: '10px',
  },
  cardDesc: {
    fontSize: '0.95rem',
    color: '#666',
    lineHeight: '1.5',
    marginBottom: '20px',
  },
  textButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#6A8E23',
    fontWeight: '700',
    cursor: 'pointer',
  }
};

export default Landing;
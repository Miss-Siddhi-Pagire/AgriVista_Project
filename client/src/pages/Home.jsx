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
       <rect width='100%' height='100%' fill='#F9F8F3'/>
       <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
       fill='#6A8E23' font-family='Arial' font-size='20'>Image not available</text>
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

  // Theme colors derived from the Agrivista landscape UI
  const colors = {
    primaryGreen: "#6A8E23", // Olive Green
    deepGreen: "#4A6317",
    creamBg: "#F9F8F3", // Light Cream
    white: "#ffffff",
    textDark: "#2C3322"
  };

  useEffect(() => {
    const verifyCookie = async () => {
      const token = Cookies.get("token");
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        const { data } = await axios.post(`${url}`, { tok: token }, { withCredentials: true });
        const { status, user, id, language } = data;

        Cookies.set("id", id);
        Cookies.set("language", language);
        Cookies.set("username", user);
        window.config.id = id;
        window.config.name = user;

        if (!status) {
          Cookies.remove("token");
          Cookies.remove("id");
          navigate("/login");
        }
      } catch (err) {
        console.error("Error verifying cookie:", err);
        // Only redirect on specific auth errors (401/403) or clear bad state
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          Cookies.remove("token");
          navigate("/login");
        } else {
          // For network errors, maybe don't logout immediately, or show a toast
          toast.error("Network error verifying session. Please refresh.");
        }
      }
    };
    verifyCookie();
  }, [navigate]);

  const handleImgError = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = FALLBACK_SVG_DATAURI;
  };

  return (
    <div style={{ backgroundColor: colors.creamBg, minHeight: "100vh" }}>
      {/* Header Section */}
      <div style={styles.header}>
        <h2 style={styles.headerTitle}>Agricultural Library</h2>
        <div style={styles.underline}></div>
        <p style={styles.headerSubtitle}>Discover the best practices for your specific crops</p>
      </div>

      {/* MARKET TRENDS SECTION UI OVERHAUL */}
      {trends.length > 0 && (
        <div style={{ padding: '0 0 60px 0' }}>

          {/* HERO BANNER - LATEST TREND */}
          <div style={{
            position: 'relative',
            height: '500px',
            width: '100%',
            marginBottom: '40px',
            overflow: 'hidden'
          }}>
            <img
              src={trends[0].image}
              alt={trends[0].title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.7)' }}
              onError={handleImgError}
            />
            <div style={{
              position: 'absolute',
              bottom: '0',
              left: '0',
              width: '100%',
              padding: '40px 50px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
              color: '#fff'
            }}>
              <span style={{
                backgroundColor: trends[0].category === 'Risk' ? '#d32f2f' : '#6A8E23',
                padding: '5px 10px',
                borderRadius: '4px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                marginBottom: '10px',
                display: 'inline-block'
              }}>
                {trends[0].category}
              </span>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '3rem',
                margin: '10px 0',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                {trends[0].title}
              </h2>
              <p style={{
                maxWidth: '800px',
                fontSize: '1.2rem',
                lineHeight: '1.6',
                opacity: 0.9,
                marginBottom: '20px'
              }}>
                {trends[0].description}
              </p>
              <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                {new Date(trends[0].createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* REMAINING TRENDS GRID */}
          {trends.length > 1 && (
            <div style={{ padding: '0 50px' }}>
              <h3 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '2rem',
                color: '#2C3322',
                marginBottom: '30px',
                borderLeft: '5px solid #6A8E23',
                paddingLeft: '15px'
              }}>
                More Market Updates
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '30px'
              }}>
                {trends.slice(1).map((trend) => (
                  <div key={trend._id} style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{ height: '200px', overflow: 'hidden' }}>
                      <img
                        src={trend.image}
                        alt={trend.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                        onError={handleImgError}
                      />
                    </div>
                    <div style={{ padding: '25px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ marginBottom: '10px' }}>
                        <span style={{
                          color: trend.category === 'Risk' ? '#d32f2f' : '#6A8E23',
                          fontWeight: 'bold',
                          fontSize: '0.8rem',
                          textTransform: 'uppercase'
                        }}>
                          {trend.category}
                        </span>
                      </div>
                      <h4 style={{
                        margin: '0 0 10px 0',
                        fontSize: '1.4rem',
                        fontFamily: "'Playfair Display', serif",
                        color: '#2C3322'
                      }}>
                        {trend.title}
                      </h4>
                      <p style={{
                        fontSize: '0.95rem',
                        color: '#666',
                        lineHeight: '1.6',
                        flexGrow: 1
                      }}>
                        {trend.description.length > 100 ? trend.description.substring(0, 100) + "..." : trend.description}
                      </p>
                      <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #f0f0f0', fontSize: '0.85rem', color: '#999' }}>
                        {new Date(trend.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={styles.container}>
        {crops.map((crop, index) => (
          <div key={index} style={styles.card}>
            <div style={styles.imageWrapper}>
              <img
                src={`/images/${crop.image}`}
                alt={t(crop.name)}
                style={styles.image}
                onError={handleImgError}
              />
            </div>
            <div style={styles.cardBody}>
              <h3 style={styles.name}>{t(crop.name)}</h3>
              <p style={styles.desc}>{t(crop.description)}</p>
              <div style={styles.cardFooter}>
                <span style={styles.learnMore}>Learn Technical Details →</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <ToastContainer />
    </div>
  );
};

const styles = {
  header: {
    padding: "60px 30px 20px 30px",
    textAlign: "center",
  },
  headerTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "2.8rem",
    color: "#4A6317",
    fontWeight: "700",
    marginBottom: "10px",
  },
  headerSubtitle: {
    color: "#666",
    fontSize: "1.1rem",
  },
  underline: {
    width: "60px",
    height: "3px",
    backgroundColor: "#6A8E23",
    margin: "10px auto",
  },
  container: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "30px",
    padding: "30px 50px 80px 50px",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(74, 99, 23, 0.08)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    transition: "transform 0.3s ease",
    border: "1px solid rgba(106, 142, 35, 0.1)",
  },
  imageWrapper: {
    width: "100%",
    height: "200px",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  cardBody: {
    padding: "20px",
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
  },
  name: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "1.3rem",
    margin: "0 0 10px 0",
    color: "#2C3322",
    fontWeight: "700",
  },
  desc: {
    fontSize: "0.95rem",
    margin: "0 0 20px 0",
    color: "#555",
    lineHeight: "1.5",
    flexGrow: 1,
  },
  cardFooter: {
    borderTop: "1px solid #f0f0f0",
    paddingTop: "15px",
  },
  learnMore: {
    fontSize: "0.85rem",
    fontWeight: "700",
    color: "#6A8E23",
    textTransform: "uppercase",
    letterSpacing: "1px",
    cursor: "pointer",
  }
};

export default Home;
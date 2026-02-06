import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
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
  const [cookies, removeCookie] = useCookies();
  const { t } = useTranslation();
  const [crops, setCrops] = useState(cropsData);

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
      if (!cookies.token) return;
      try {
        const { data } = await axios.post(`${url}`, { tok: cookies.token }, { withCredentials: true });
        const { status, user, id, language } = data;

        Cookies.set("id", id);
        Cookies.set("language", language);
        Cookies.set("username", user);
        window.config.id = id;
        window.config.name = user;

        if (!status) {
          removeCookie("token");
          Cookies.remove("id");
          navigate("/login");
        }
      } catch (err) {
        console.error("Error verifying cookie:", err);
      }
    };
    verifyCookie();
  }, [cookies, navigate, removeCookie]);

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
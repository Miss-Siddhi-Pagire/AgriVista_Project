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
import cropsData from "../data/data"; // Local default crops

// Fallback for broken images
const FALLBACK_SVG_DATAURI =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'>
       <rect width='100%' height='100%' fill='#e6eefc'/>
       <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
       fill='#9aaedc' font-family='Arial' font-size='20'>Image not available</text>
     </svg>`
  );

const Home = () => {
  const navigate = useNavigate();
  const [cookies, removeCookie] = useCookies();
  const { t } = useTranslation();
  const [crops, setCrops] = useState(cropsData); // Default local crops

  // Verify login
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

  // Handle broken images
  const handleImgError = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = FALLBACK_SVG_DATAURI;
  };

  return (
    <>
      <div style={styles.container}>
        {crops.map((crop, index) => (
          <div key={index} style={styles.card}>
            <div style={styles.imageWrapper}>
              <img
                src={`/images/${crop.image}`} // ✅ loads from public/images
                alt={t(crop.name)}
                style={styles.image}
                onError={handleImgError}
              />
            </div>
            <div style={styles.cardBody}>
              <h3 style={styles.name}>{t(crop.name)}</h3>
              <p style={styles.desc}>{t(crop.description)}</p>
            </div>
          </div>
        ))}
      </div>
      <ToastContainer />
    </>
  );
};

// 4-column responsive grid
const styles = {
  container: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
    padding: "30px",
    backgroundColor:"#c9d4f8"
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 6px 16px rgba(20,30,80,0.08)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  imageWrapper: {
    width: "100%",
    height: "180px",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  cardBody: {
    padding: "12px 14px",
  },
  name: {
    fontSize: "1.05rem",
    margin: "0 0 6px 0",
    color: "#1b5e20",
  },
  desc: {
    fontSize: "0.9rem",
    margin: 0,
    color: "#444",
  },
};

export default Home;

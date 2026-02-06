import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from 'react-hot-toast';
import Cookies from 'js-cookie';
import url from '../url';

const Signup = () => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState({
    email: "",
    name: "",
    password: "",
  });
  const { email, password, name } = inputValue;

  // AgriVista Premium Palette
  const colors = {
    primaryGreen: "#6A8E23", // Olive Green
    deepGreen: "#4A6317",
    creamBg: "#F9F8F3", 
    white: "#ffffff",
    textDark: "#2C3322"
  };

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setInputValue({
      ...inputValue,
      [name]: value,
    });
  };

  const handleError = (err) =>
    toast.error(err, {
      position: "bottom-left",
    });

  const handleSuccess = (msg) =>
    toast.success(msg, {
      position: "top-center",
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(
        `${url}/signup`,
        {
          ...inputValue,
        },
        { withCredentials: true }
      );
      const { success, message, token } = data;
      if (token) {
        Cookies.set('token', token);
      }
      if (success) {
        handleSuccess(message);
        setTimeout(() => {
          navigate("/Landing");
        }, 1000);
      } else {
        handleError(message);
      }
    } catch (error) {
      console.error("Signup error:", error);
    }
    setInputValue({
      ...inputValue,
      email: "",
      password: "",
      name: "",
    });
  };

  return (
    <div style={styles.signupWrapper}>
      <div style={styles.formCard}>
        {/* Branding matching the platform theme */}
        <h1 style={styles.brandTitle}>AgriVista</h1>
        <div style={styles.underline}></div>
        
        <h2 style={styles.formHeader}>Create Account</h2>
        <p style={styles.subtitle}>Join the community of smart farmers today.</p>

        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label htmlFor="name" style={styles.label}>Full Name</label>
            <input
              type="text"
              name="name"
              value={name}
              placeholder="Enter your Name"
              onChange={handleOnChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="email" style={styles.label}>Email Address</label>
            <input
              type="email"
              name="email"
              value={email}
              placeholder="Enter your email"
              onChange={handleOnChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={password}
              placeholder="Create a password"
              onChange={handleOnChange}
              style={styles.input}
              required
            />
          </div>

          <button type="submit" style={styles.submitBtn}>
            Create Account
          </button>

          <div style={styles.footerText}>
            Already have an account? <Link to={"/login"} style={{ color: colors.primaryGreen, fontWeight: '700', textDecoration: 'none' }}>Login</Link>
          </div>
        </form>
        <Toaster />
      </div>
    </div>
  );
};

const styles = {
  signupWrapper: {
    minHeight: "100vh",
    // Matches the professional farm background from the Login/Landing updates
    backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url("https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=2000&auto=format&fit=crop")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px"
  },
  formCard: {
    backgroundColor: "#F9F8F3", // Cream-toned background
    padding: "50px 40px",
    borderRadius: "24px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
    width: "100%",
    maxWidth: "480px",
    textAlign: "center"
  },
  brandTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "3.5rem",
    color: "#4A6317", // Deep Green
    fontWeight: "800",
    marginBottom: "5px"
  },
  underline: {
    width: "60px",
    height: "3px",
    backgroundColor: "#6A8E23", // Olive Green
    margin: "0 auto 20px auto"
  },
  formHeader: {
    fontSize: "1.6rem",
    color: "#2C3322",
    fontWeight: "700",
    marginBottom: "8px"
  },
  subtitle: {
    color: "#666",
    fontSize: "0.95rem",
    marginBottom: "35px"
  },
  inputGroup: {
    textAlign: "left",
    marginBottom: "20px"
  },
  label: {
    display: "block",
    fontSize: "0.85rem",
    fontWeight: "700",
    color: "#4A6317",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  input: {
    width: "100%",
    padding: "12px 15px",
    borderRadius: "12px",
    border: "1px solid #ddd",
    backgroundColor: "#ffffff",
    fontSize: "0.95rem",
    outline: "none"
  },
  submitBtn: {
    width: "100%",
    backgroundColor: "#6A8E23", // Olive Green
    color: "#fff",
    padding: "14px",
    border: "none",
    borderRadius: "50px",
    fontWeight: "700",
    fontSize: "1.1rem",
    cursor: "pointer",
    marginTop: "10px",
    transition: "transform 0.2s ease, background 0.3s ease",
    boxShadow: "0 6px 20px rgba(106, 142, 35, 0.3)"
  },
  footerText: {
    marginTop: "25px",
    fontSize: "0.95rem",
    color: "#555"
  }
};

export default Signup;
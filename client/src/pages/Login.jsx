import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from 'react-hot-toast';
import Cookies from 'js-cookie';
import url from '../url'

const Login = () => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState({
    email: "",
    password: "",
  });
  const { email, password } = inputValue;

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
      position: 'top-right',
    });

  const handleSuccess = (msg) =>
    toast.success('User Logged in Successfully')

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(
        `${url}/login`,
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
          navigate("/");
        }, 1000);
      } else {
        handleError(message);
      }
    } catch (error) {
      console.error("Login Error:", error);
    }
    setInputValue({
      ...inputValue,
      email: "",
      password: "",
    });
  };

  return (
    <div style={styles.loginWrapper}>
      <div style={styles.formCard}>
        {/* Branding matching the Landing Page */}
        <h1 style={styles.brandTitle}>AgriVista</h1>
        <div style={styles.underline}></div>
        
        <h2 style={styles.formHeader}>Login Account</h2>
        <p style={styles.subtitle}>Welcome back to your digital farm advisor.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-floating mb-3">
            <input
              type="email"
              className="form-control"
              id="email"
              name="email"
              value={email}
              placeholder="Enter your email"
              onChange={handleOnChange}
              style={styles.input}
            />
            <label htmlFor="email">Email Address</label>
          </div>
          
          <div className="form-floating mb-4">
            <input
              type="password"
              className="form-control"
              name="password"
              value={password}
              placeholder="Enter your password"
              onChange={handleOnChange}
              style={styles.input}
            />
            <label htmlFor="password">Password</label>
          </div>

          <button type="submit" style={styles.submitBtn}>
            Sign In
          </button>

          <div style={styles.footerText}>
            Don't have an account? <Link to={"/signup"} style={{ color: colors.primaryGreen, fontWeight: '700', textDecoration: 'none' }}>Signup</Link>
          </div>
        </form>
        <Toaster />
      </div>

      <style>{`
        .form-control:focus {
          border-color: ${colors.primaryGreen} !important;
          box-shadow: 0 0 0 0.25rem rgba(106, 142, 35, 0.1) !important;
        }
        @font-face {
          font-family: 'Playfair Display';
          src: url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');
        }
      `}</style>
    </div>
  );
};

const styles = {
  loginWrapper: {
    minHeight: "100vh",
    // Professional background of an Indian farm landscape
    backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url("https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=2000&auto=format&fit=crop")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px"
  },
  formCard: {
    backgroundColor: "#F9F8F3", // Cream-toned background
    padding: "50px 40px",
    borderRadius: "24px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
    width: "100%",
    maxWidth: "460px",
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
  input: {
    borderRadius: "12px",
    border: "1px solid #ddd",
    backgroundColor: "#ffffff"
  },
  submitBtn: {
    width: "100%",
    backgroundColor: "#6A8E23", // Matches primary project green
    color: "#fff",
    padding: "14px",
    border: "none",
    borderRadius: "50px",
    fontWeight: "700",
    fontSize: "1.1rem",
    cursor: "pointer",
    transition: "transform 0.2s ease, background 0.3s ease",
    boxShadow: "0 6px 20px rgba(106, 142, 35, 0.3)"
  },
  footerText: {
    marginTop: "25px",
    fontSize: "0.95rem",
    color: "#555"
  }
};

export default Login;
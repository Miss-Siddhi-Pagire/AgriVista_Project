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
        { ...inputValue },
        { withCredentials: true }
      );

      const { success, message, token, user } = data;

      if (success) {
        handleUserLoginSuccess(token, user, message);
      } else {
        if (message === "Invalid email" || message === "User not found" || message === "Incorrect password") {
          const adminRes = await axios.post(
            `${url}/api/admin/login`,
            { ...inputValue },
            { withCredentials: true }
          );

          if (adminRes.data.success) {
            handleAdminLoginSuccess(adminRes.data.token, adminRes.data.admin, adminRes.data.message);
            return;
          }
        }
        handleError(message);
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.success) {
        handleAdminLoginSuccess(error.response.data.token, error.response.data.admin, error.response.data.message);
        return;
      }
      if (error.response && error.response.status === 401) {
        handleError("Invalid Credentials");
        return;
      }
      console.error("Login Error:", error);
      handleError("Login failed");
    }

    setInputValue({
      ...inputValue,
      password: "",
    });
  };

  const handleUserLoginSuccess = (token, user, message) => {
    if (token) Cookies.set('token', token, { path: '/' });
    if (user) {
      Cookies.set("username", user.name, { path: '/' });
      Cookies.set("id", user._id, { path: '/' });
      Cookies.set("language", user.language || "deff", { path: '/' });
      Cookies.set("profilePhoto", user.profilePhoto || "", { path: '/' });
    }
    handleSuccess(message);
    setTimeout(() => navigate("/home"), 1000);
  };

  const handleAdminLoginSuccess = (token, admin, message) => {
    if (token) {
      Cookies.set('token', token, { path: '/' });
      Cookies.set('admin_token', token, { path: '/' });
    }
    if (admin) {
      Cookies.set("username", admin.name, { path: '/' });
      Cookies.set("id", admin.id, { path: '/' });
      Cookies.set("role", "admin", { path: '/' });
    }
    handleSuccess("Welcome Admin!");
    setTimeout(() => navigate("/admin"), 1000);
  };

  return (
    <>
      <nav className="navbar">
        <div className="nav-logo">
          <div className="nav-logo-dot">🌿</div>AgriVista
        </div>
        <ul className="nav-links"></ul>
        <div className="nav-right">
          <button className="nav-btn-ghost" onClick={() => navigate('/signup')}>
            Create Account
          </button>
        </div>
      </nav>
      <div className="auth-page">
        <div className="auth-left">
          <div className="auth-left-content">
            <div className="hero-badge" style={{background: 'rgba(74,222,128,.12)', borderColor: 'rgba(74,222,128,.3)', color: 'var(--leaf-pale)', marginBottom: '1.5rem'}}>
              <div className="badge-dot"></div>Welcome back
            </div>
            <h2>Your farm is <span style={{color: "var(--leaf-pale)", fontStyle: "italic"}}>waiting</span> for you</h2>
            <p style={{marginTop: '.8rem'}}>Sign in to access your personalised crop plans, disease scans, yield predictions and farmer community.</p>
            <div className="auth-benefits">
              <div className="auth-benefit">
                 <div className="auth-benefit-icon">🌾</div>
                 <div className="auth-benefit-text"><h4>Personalised recommendations</h4><p>AI picks the right crop for your exact soil and season.</p></div>
              </div>
              <div className="auth-benefit">
                 <div className="auth-benefit-icon">🔬</div>
                 <div className="auth-benefit-text"><h4>Disease history saved</h4><p>All your scans and alerts in one place.</p></div>
              </div>
              <div className="auth-benefit">
                 <div className="auth-benefit-icon">📈</div>
                 <div className="auth-benefit-text"><h4>Season-over-season tracking</h4><p>Watch your yield improve each season.</p></div>
              </div>
            </div>
          </div>
          <div className="auth-left-footer">© 2026 AgriVista Technologies Pvt. Ltd.</div>
        </div>
        
        <div className="auth-right">
          <div className="auth-right-inner">
            <h3>Sign in</h3>
            <p className="auth-sub">New to AgriVista? <Link to="/signup">Create a free account →</Link></p>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                 <label className="form-lbl">Email or Phone</label>
                 <input
                   type="email"
                   className="form-input"
                   name="email"
                   value={email}
                   placeholder="rajesh@example.com"
                   onChange={handleOnChange}
                   required
                 />
              </div>
              
              <div className="form-group">
                 <label className="form-lbl" style={{display: 'flex', justifyContent: 'space-between'}}>
                   Password <span className="auth-forgot">Forgot password?</span>
                 </label>
                 <input
                   type="password"
                   className="form-input"
                   name="password"
                   value={password}
                   placeholder="Enter your password"
                   onChange={handleOnChange}
                   required
                 />
              </div>
              
              <button type="submit" className="auth-submit">
                Sign In →
              </button>
            </form>
            
            <div className="auth-divider"><span>or continue with</span></div>
            <div className="auth-social">
              <button type="button" className="auth-social-btn">🇬 Google</button>
              <button type="button" className="auth-social-btn">📱 OTP Login</button>
            </div>
            <p className="auth-terms">By signing in you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.</p>
          </div>
        </div>
        <Toaster />
      </div>
    </>
  );
};

export default Login;
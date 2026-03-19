import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from 'react-hot-toast';
import Cookies from 'js-cookie';
import url from '../url';

const Signup = () => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    farmSize: "1-5 acres",
    address: {
      state: "Maharashtra"
    }
  });

  const { firstName, lastName, email, phone, password, address, farmSize } = inputValue;

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    if (['state'].includes(name)) {
      setInputValue({
        ...inputValue,
        address: { ...inputValue.address, [name]: value }
      });
    } else {
      setInputValue({
        ...inputValue,
        [name]: value,
      });
    }
  };

  const handleError = (err) =>
    toast.error(err, { position: "top-right" });

  const handleSuccess = (msg) =>
    toast.success(msg, { position: "top-center" });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fullName = `${firstName} ${lastName}`.trim();

    const formData = new FormData();
    formData.append("name", fullName);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("phone", phone);
    formData.append("address", JSON.stringify({ ...address, farmSize }));
    // We omit ProfilePhoto as per new UI

    try {
      const { data } = await axios.post(
        `${url}/signup`,
        formData,
        {
          withCredentials: true,
          // IMPORTANT: Do NOT set Content-Type header manually for FormData, axios/browser correctly sets the boundary
        }
      );
      
      const { success, message, token, user } = data;
      
      if (token) Cookies.set('token', token, { path: '/' });
      
      if (success) {
        if (user) {
          Cookies.set("username", user.name, { path: '/' });
          Cookies.set("id", user._id, { path: '/' });
          Cookies.set("language", user.preferredLanguage || user.language || "deff", { path: '/' });
          Cookies.set("profilePhoto", user.profilePhoto || "", { path: '/' });
        }
        handleSuccess(message);
        setTimeout(() => navigate("/home"), 1000);
      } else {
        handleError(message);
      }
    } catch (error) {
      console.error("Signup error:", error);
      handleError("Signup failed. Please try again.");
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="nav-logo">
          <div className="nav-logo-dot">🌿</div>AgriVista
        </div>
        <ul className="nav-links"></ul>
        <div className="nav-right">
          <button className="nav-btn-ghost" onClick={() => navigate('/login')}>
            Sign In
          </button>
        </div>
      </nav>
      <div className="auth-page">
        <div className="auth-left">
          <div className="auth-left-content">
            <div className="hero-badge" style={{background: 'rgba(74,222,128,.12)', borderColor: 'rgba(74,222,128,.3)', color: 'var(--leaf-pale)', marginBottom: '1.5rem'}}>
               <div className="badge-dot"></div>Join 50,000+ farmers
            </div>
            <h2>Grow <span style={{color: "var(--leaf-pale)", fontStyle: "italic"}}>smarter</span> from day one</h2>
            <p style={{marginTop: '.8rem'}}>Create your free AgriVista account and get instant access to AI crop recommendations, disease detection and yield forecasting.</p>
            <div className="auth-benefits">
              <div className="auth-benefit">
                 <div className="auth-benefit-icon">✅</div>
                 <div className="auth-benefit-text"><h4>Free forever plan</h4><p>Core features at no cost. Upgrade anytime.</p></div>
              </div>
              <div className="auth-benefit">
                 <div className="auth-benefit-icon">🛡️</div>
                 <div className="auth-benefit-text"><h4>Your data is private</h4><p>We never sell your farm data. ISO 27001 certified.</p></div>
              </div>
              <div className="auth-benefit">
                 <div className="auth-benefit-icon">🌍</div>
                 <div className="auth-benefit-text"><h4>18 states supported</h4><p>Localised recommendations for every region of India.</p></div>
              </div>
            </div>
          </div>
          <div className="auth-left-footer">© 2026 AgriVista Technologies Pvt. Ltd.</div>
        </div>

        <div className="auth-right">
          <div className="auth-right-inner">
            <h3>Create account</h3>
            <p className="auth-sub">Already have an account? <Link to="/login">Sign in →</Link></p>
            
            <form onSubmit={handleSubmit}>
              <div className="form-row2">
                <div className="form-group">
                   <label className="form-lbl">First Name</label>
                   <input type="text" className="form-input" name="firstName" value={firstName} onChange={handleOnChange} placeholder="Rajesh" required />
                </div>
                <div className="form-group">
                   <label className="form-lbl">Last Name</label>
                   <input type="text" className="form-input" name="lastName" value={lastName} onChange={handleOnChange} placeholder="Kumar" required />
                </div>
              </div>
              
              <div className="form-group">
                 <label className="form-lbl">Email Address</label>
                 <input type="email" className="form-input" name="email" value={email} onChange={handleOnChange} placeholder="rajesh@example.com" required />
              </div>
              <div className="form-group">
                 <label className="form-lbl">Phone Number</label>
                 <input type="tel" className="form-input" name="phone" value={phone} onChange={handleOnChange} placeholder="+91 98765 43210" required />
              </div>
              
              <div className="form-row2">
                <div className="form-group">
                   <label className="form-lbl">State</label>
                   <select className="form-input" name="state" value={address.state} onChange={handleOnChange}>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Punjab">Punjab</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                      <option value="Madhya Pradesh">Madhya Pradesh</option>
                      <option value="Rajasthan">Rajasthan</option>
                   </select>
                </div>
                <div className="form-group">
                   <label className="form-lbl">Farm Size</label>
                   <select className="form-input" name="farmSize" value={farmSize} onChange={handleOnChange}>
                      <option value="1-5 acres">1–5 acres</option>
                      <option value="<1 acre">&lt;1 acre</option>
                      <option value="5-20 acres">5–20 acres</option>
                      <option value=">20 acres">&gt;20 acres</option>
                   </select>
                </div>
              </div>
              
              <div className="form-group">
                  <label className="form-lbl">Password</label>
                  <input type="password" className="form-input" name="password" value={password} onChange={handleOnChange} placeholder="Min. 8 characters" required />
                  <div className="pass-strength">
                     <div className="ps-bar s1"></div><div className="ps-bar s2"></div><div className="ps-bar s3"></div><div className="ps-bar"></div>
                  </div>
                  <div className="form-hint">Use 8+ characters with a mix of letters and numbers.</div>
              </div>
              
              <button type="submit" className="auth-submit">Create Free Account →</button>
            </form>
            
            <div className="auth-divider"><span>or sign up with</span></div>
            <div className="auth-social">
              <button type="button" className="auth-social-btn">🇬 Google</button>
              <button type="button" className="auth-social-btn">📱 OTP Signup</button>
            </div>
            <p className="auth-terms">By creating an account you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.</p>
          </div>
        </div>
        <Toaster />
      </div>
    </>
  );
};

export default Signup;
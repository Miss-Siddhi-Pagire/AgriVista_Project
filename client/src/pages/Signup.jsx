import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from 'react-hot-toast';
import Cookies from 'js-cookie';
import url from '../url';
import { User, Mail, Lock, Phone, MapPin, Globe } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState({
    email: "",
    name: "",
    password: "",
    phone: "",
    age: "",
    gender: "Male",
    preferredLanguage: "en",
    address: {
      village: "",
      taluka: "",
      district: "",
      state: "",
      pincode: ""
    }
  });

  const [profilePhoto, setProfilePhoto] = useState(null);

  // Extract nested values for easier access in render, but state update needs care
  const { email, password, name, phone, age, gender, preferredLanguage, address } = inputValue;

  // AgriVista Premium Palette
  const colors = {
    primaryGreen: "#6A8E23", // Olive Green
    deepGreen: "#4A6317",
    creamBg: "#F9F8F3",
    white: "#ffffff",
    textDark: "#2C3322",
    accent: "#E8F5E9"
  };

  const handleOnChange = (e) => {
    const { name, value } = e.target;

    // Check if the field belongs to address
    if (['village', 'taluka', 'district', 'state', 'pincode'].includes(name)) {
      setInputValue({
        ...inputValue,
        address: {
          ...inputValue.address,
          [name]: value
        }
      });
    } else {
      setInputValue({
        ...inputValue,
        [name]: value,
      });
    }
  };

  const handleError = (err) =>
    toast.error(err, {
      position: "top-right",
    });

  const handleSuccess = (msg) =>
    toast.success(msg, {
      position: "top-center",
    });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("email", email);
    formData.append("name", name);
    formData.append("password", password);
    formData.append("phone", phone);
    formData.append("age", age);
    formData.append("gender", gender);
    formData.append("preferredLanguage", preferredLanguage);
    formData.append("address", JSON.stringify(address)); // Send address as JSON string

    if (profilePhoto) {
      formData.append("profilePhoto", profilePhoto);
    }

    try {
      const { data } = await axios.post(
        `${url}/signup`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" }
        }
      );
      const { success, message, token, user } = data;
      if (token) {
        Cookies.set('token', token, { path: '/' });
      }
      if (success) {
        if (user) {
          Cookies.set("username", user.name, { path: '/' });
          Cookies.set("id", user._id, { path: '/' });
          Cookies.set("language", user.preferredLanguage || user.language || "deff", { path: '/' });
          Cookies.set("profilePhoto", user.profilePhoto || "", { path: '/' });
        }
        handleSuccess(message);
        setTimeout(() => {
          navigate("/home");
        }, 1000);
      } else {
        handleError(message);
      }
    } catch (error) {
      console.error("Signup error:", error);
      handleError("Signup failed. Please try again.");
    }
  };

  return (
    <div style={styles.signupWrapper}>
      <div style={styles.formCard}>
        {/* Branding */}
        <div style={styles.headerSection}>
          <h1 style={styles.brandTitle}>AgriVista</h1>
          <p style={styles.subtitle}>Join the community of smart farmers.</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.formGrid}>

          {/* --- Personal Details --- */}
          <div style={styles.sectionTitle}>Personal Details</div>

          {/* Profile Photo Upload */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <div style={{ position: 'relative', width: '100px', height: '100px' }}>
              <label htmlFor="profilePhotoInput" style={{ cursor: 'pointer' }}>
                {profilePhoto ? (
                  <img
                    src={URL.createObjectURL(profilePhoto)}
                    alt="Profile Preview"
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${colors.primaryGreen}` }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    backgroundColor: '#e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `2px dashed ${colors.primaryGreen}`,
                    color: colors.deepGreen
                  }}>
                    <User size={40} />
                  </div>
                )}
                <div style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  backgroundColor: colors.primaryGreen,
                  borderRadius: '50%',
                  padding: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ color: '#fff', fontSize: '12px' }}>+</span>
                </div>
              </label>
              <input
                id="profilePhotoInput"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => setProfilePhoto(e.target.files[0])}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}><User size={16} /> Full Name</label>
            <input type="text" name="name" value={name} placeholder="e.g. Rahul Kumar" onChange={handleOnChange} style={styles.input} required />
          </div>

          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}><Mail size={16} /> Email</label>
              <input type="email" name="email" value={email} placeholder="rahul@example.com" onChange={handleOnChange} style={styles.input} required />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}><Phone size={16} /> Phone</label>
              <input type="tel" name="phone" value={phone} placeholder="+91 9876543210" onChange={handleOnChange} style={styles.input} required />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Age</label>
              <input type="number" name="age" value={age} placeholder="Age" min="18" onChange={handleOnChange} style={styles.input} required />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Gender</label>
              <select name="gender" value={gender} onChange={handleOnChange} style={styles.select}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* --- Address Details --- */}
          <div style={{ ...styles.sectionTitle, marginTop: '10px' }}>Farm Location</div>

          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Village</label>
              <input type="text" name="village" value={address.village} placeholder="Village Name" onChange={handleOnChange} style={styles.input} required />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Taluka</label>
              <input type="text" name="taluka" value={address.taluka} placeholder="Taluka" onChange={handleOnChange} style={styles.input} required />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>District</label>
              <input type="text" name="district" value={address.district} placeholder="District" onChange={handleOnChange} style={styles.input} required />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>State</label>
              <input type="text" name="state" value={address.state} placeholder="State" onChange={handleOnChange} style={styles.input} required />
            </div>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Pincode</label>
            <input type="text" name="pincode" value={address.pincode} placeholder="Pincode" onChange={handleOnChange} style={styles.input} required />
          </div>

          {/* --- Review & Security --- */}
          <div style={{ ...styles.sectionTitle, marginTop: '10px' }}>Account Security</div>

          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}><Globe size={16} /> Language</label>
              <select name="preferredLanguage" value={preferredLanguage} onChange={handleOnChange} style={styles.select}>
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="mr">Marathi</option>
                <option value="gu">Gujarati</option>
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}><Lock size={16} /> Password</label>
              <input type="password" name="password" value={password} placeholder="••••••••" onChange={handleOnChange} style={styles.input} required />
            </div>
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
    backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url("https://images.unsplash.com/photo-1625246333195-09d9b630dc0a?q=80&w=2000&auto=format&fit=crop")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px"
  },
  formCard: {
    backgroundColor: "rgba(249, 248, 243, 0.95)", // Cream-toned background with slight transparency
    backdropFilter: "blur(10px)",
    padding: "40px",
    borderRadius: "24px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    width: "100%",
    maxWidth: "600px",
  },
  headerSection: {
    textAlign: "center",
    marginBottom: "30px"
  },
  brandTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "2.5rem",
    color: "#4A6317",
    fontWeight: "800",
    marginBottom: "5px"
  },
  subtitle: {
    color: "#4A6317",
    fontSize: "0.95rem",
    fontWeight: "500"
  },
  formGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "15px"
  },
  sectionTitle: {
    fontSize: "0.85rem",
    color: "#6A8E23",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "1px",
    borderBottom: "1px solid #e0e0e0",
    paddingBottom: "5px",
    marginBottom: "10px"
  },
  row: {
    display: "flex",
    gap: "15px"
  },
  inputGroup: {
    flex: 1,
    display: "flex", // Keep display flex
    flexDirection: "column", // Explicitly set column direction
    gap: "5px",
    marginBottom: "5px"
  },
  label: {
    fontSize: "0.85rem",
    fontWeight: "600",
    color: "#4A6317",
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    backgroundColor: "#ffffff",
    fontSize: "0.95rem",
    outline: "none",
    transition: "border-color 0.2s"
  },
  select: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    backgroundColor: "#ffffff",
    fontSize: "0.95rem",
    outline: "none",
    cursor: "pointer"
  },
  submitBtn: {
    width: "100%",
    backgroundColor: "#6A8E23",
    color: "#fff",
    padding: "14px",
    border: "none",
    borderRadius: "50px",
    fontWeight: "700",
    fontSize: "1.1rem",
    cursor: "pointer",
    marginTop: "20px",
    boxShadow: "0 10px 20px rgba(106, 142, 35, 0.3)",
    transition: "transform 0.2s"
  },
  footerText: {
    marginTop: "20px",
    fontSize: "0.9rem",
    color: "#555",
    textAlign: "center"
  }
};

export default Signup;
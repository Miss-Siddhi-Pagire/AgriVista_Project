import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { User, Phone, MapPin, Globe, Save } from "lucide-react";
import { useCookies } from "react-cookie";
import url from "../url";

const UpdateProfile = () => {
  const userId = Cookies.get("id");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    age: "",
    gender: "",
    preferredLanguage: "",
    address: {
      village: "",
      taluka: "",
      district: "",
      state: "",
      pincode: "",
    },
    profilePhoto: "" // URL handling
  });
  const [newPhoto, setNewPhoto] = useState(null); // File object for upload
  const [cookies, setCookie] = useCookies(["profilePhoto"]);

  const [loading, setLoading] = useState(true);

  const colors = {
    primaryGreen: "#6A8E23",
    deepGreen: "#4A6317",
    creamBg: "#F9F8F3",
    textDark: "#2C3322",
    white: "#ffffff"
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await axios.get(`${url}/getFarmerDetails/${userId}`);
        const data = res.data;
        setFormData({
          name: data.name || "",
          phone: data.phone || "",
          age: data.age || "",
          gender: data.gender || "",
          preferredLanguage: data.preferredLanguage || "",
          address: {
            village: data.address?.village || "",
            taluka: data.address?.taluka || "",
            district: data.address?.district || "",
            state: data.address?.state || "",
            pincode: data.address?.pincode || "",
          },
          profilePhoto: data.profilePhoto || ""
        });
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name in formData.address) {
      setFormData({ ...formData, address: { ...formData.address, [name]: value } });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append("userId", userId);
    data.append("name", formData.name);
    data.append("phone", formData.phone);
    data.append("age", formData.age);
    data.append("gender", formData.gender);
    data.append("preferredLanguage", formData.preferredLanguage);
    data.append("address", JSON.stringify(formData.address));

    if (newPhoto) {
      data.append("profilePhoto", newPhoto);
    }

    try {
      const res = await axios.post(`${url}/updateFarmerDetails`, data, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      // Update local view if new photo uploaded
      if (newPhoto && res.data.user && res.data.user.profilePhoto) {
        setFormData({ ...formData, profilePhoto: res.data.user.profilePhoto });
        setNewPhoto(null);
        setCookie("profilePhoto", res.data.user.profilePhoto, { path: '/' });
      }

      Cookies.set("username", formData.name);
      alert("Profile updated successfully");
      // navigate("/Landing"); // Optional: stay on page to see changes
    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  };

  if (loading) return (
    <div className="dash-wrap" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
        <div className="spinner-border text-success" role="status" style={{ width: '3rem', height: '3rem' }}></div>
        <h4 style={{ color: 'var(--forest)', fontFamily: 'var(--ff-head)' }}>Loading profile...</h4>
      </div>
    </div>
  );

  return (
    <div className="dash-wrap">
      {/* DASHBOARD SIDEBAR */}
      <div className="dash-sidebar">
        <div className="dash-sidebar-title">Settings</div>
        
        <div className="sidebar-item active">
          <span style={{ marginRight: '10px' }}>👤</span> Edit Profile
        </div>
        
        <div 
          className="sidebar-item"
          onClick={() => navigate('/user')}
        >
          <span style={{ marginRight: '10px' }}>📊</span> Data Insights
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
          <button 
            onClick={() => navigate("/Landing")}
            className="btn-secondary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* DASHBOARD MAIN */}
      <div className="dash-main">
        {/* Header */}
        <div className="dash-header">
          <h2 style={{ display: 'flex', alignItems: 'center' }}>
            <User className="sidebar-icon" style={{color: "var(--leaf)", marginRight: "10px"}} /> 
            Profile Settings
          </h2>
          <p>Manage your personal information, contact details, and field coordinates.</p>
        </div>

        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div className="dash-card">
            <h3 style={{ fontFamily: 'var(--ff-head)', color: 'var(--forest)', fontSize: '1.4rem', fontWeight: 700, marginBottom: '2rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem' }}>
              Welcome back, {formData.name || "Farmer"}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '3rem' }}>
              <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <div style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', border: '4px solid var(--mint-light)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  {newPhoto ? (
                    <img src={URL.createObjectURL(newPhoto)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : formData.profilePhoto ? (
                    <img src={formData.profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--mint)' }}>
                      <User size={50} color="var(--forest)" />
                    </div>
                  )}
                </div>
                <label htmlFor="updatePhotoInput" style={{ position: 'absolute', bottom: '0', right: '0', backgroundColor: 'var(--leaf)', color: 'white', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', transition: 'transform 0.2s', ':hover': { transform: 'scale(1.1)' } }}>
                  <Save size={18} />
                </label>
                <input
                  id="updatePhotoInput"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => setNewPhoto(e.target.files[0])}
                />
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Click the icon to update your photo</p>
            </div>

            <form onSubmit={handleSubmit}>
              <h4 style={{ fontSize: '1.1rem', color: 'var(--forest)', fontWeight: 600, marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Personal Identity</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '2.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-lbl">Full Name</label>
                  <input
                    name="name"
                    className="form-input"
                    onChange={handleChange}
                    value={formData.name}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-lbl">Phone Number</label>
                  <input
                    name="phone"
                    className="form-input"
                    onChange={handleChange}
                    value={formData.phone}
                    placeholder="Enter phone"
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-lbl">Age</label>
                  <input
                    name="age"
                    type="number"
                    className="form-input"
                    onChange={handleChange}
                    value={formData.age}
                    placeholder="Enter age"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-lbl">Gender</label>
                  <select
                    name="gender"
                    className="form-input"
                    onChange={handleChange}
                    value={formData.gender}
                  >
                    <option value="">Select</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-lbl">Preferred Language</label>
                  <input
                    name="preferredLanguage"
                    className="form-input"
                    onChange={handleChange}
                    value={formData.preferredLanguage}
                    placeholder="e.g. Marathi"
                  />
                </div>
              </div>

              <h4 style={{ fontSize: '1.1rem', color: 'var(--forest)', fontWeight: 600, marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Field & Location Details</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '2.5rem' }}>
                {["village", "taluka", "district", "state", "pincode"].map((field) => (
                  <div className="form-group" key={field} style={{ marginBottom: 0 }}>
                    <label className="form-lbl" style={{ textTransform: 'capitalize' }}>{field}</label>
                    <input
                      name={field}
                      className="form-input"
                      onChange={handleChange}
                      value={formData.address[field]}
                      placeholder={`Enter ${field}`}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--card-border)' }}>
                <button type="submit" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 30px', fontSize: '1.1rem' }}>
                  <Save size={20} /> Update Agrivista Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateProfile;
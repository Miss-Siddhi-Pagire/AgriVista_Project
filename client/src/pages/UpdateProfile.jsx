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
    <div className="min-h-screen d-flex align-items-center justify-content-center" style={{ backgroundColor: colors.creamBg }}>
      <div className="spinner-border" style={{ color: colors.primaryGreen }} role="status"></div>
    </div>
  );

  return (
    <div
      className="d-flex justify-content-center align-items-center py-5"
      style={{ backgroundColor: colors.creamBg, minHeight: "100vh" }}
    >
      <div
        className="card border-0 shadow-lg overflow-hidden rounded-4"
        style={{
          width: "95%",
          maxWidth: "1100px" // INCREASED: Changed from 850px to 1100px for a wider look
        }}
      >
        <div className="row g-0">
          {/* Left Decorative Sidebar - Adjusted ratio for wider box */}
          <div className="col-md-3 d-none d-md-flex flex-column justify-content-center p-5 text-white text-center"
            style={{
              background: `linear-gradient(rgba(74, 99, 23, 0.85), rgba(74, 99, 23, 0.85)), url('https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=1000')`,
              backgroundSize: 'cover'
            }}>
            <div className="mb-4 d-flex flex-column align-items-center">
              <div className="position-relative mb-3">
                <div className="bg-white rounded-circle d-inline-flex p-1 shadow overflow-hidden" style={{ width: '120px', height: '120px' }}>
                  {newPhoto ? (
                    <img src={URL.createObjectURL(newPhoto)} alt="Preview" className="w-100 h-100 rounded-circle object-fit-cover" />
                  ) : formData.profilePhoto ? (
                    <img src={formData.profilePhoto} alt="Profile" className="w-100 h-100 rounded-circle object-fit-cover" />
                  ) : (
                    <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-light rounded-circle">
                      <User size={60} color={colors.primaryGreen} />
                    </div>
                  )}
                </div>
                <label htmlFor="updatePhotoInput" className="position-absolute bottom-0 end-0 bg-white rounded-circle p-2 shadow" style={{ cursor: 'pointer', transform: 'translate(10%, 10%)' }}>
                  <Save size={16} color={colors.primaryGreen} />
                </label>
                <input
                  id="updatePhotoInput"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => setNewPhoto(e.target.files[0])}
                />
              </div>

              <h4 className="fw-bold font-serif">{formData.name || "Gardener"}</h4>
              <p className="small opacity-75">Update your details to receive precise agricultural advice.</p>
            </div>
          </div>

          {/* Right Form Section - Wider space for inputs */}
          <div className="col-md-9 p-4 p-md-5 bg-white">
            <header className="mb-5 border-bottom pb-3">
              <h3 className="fw-bold font-serif" style={{ color: colors.textDark, fontSize: '2rem' }}>
                Welcome back, {formData.name || "Farmer"}
              </h3>
              <p className="text-muted">Manage your personal information and field coordinates.</p>
            </header>

            <form onSubmit={handleSubmit}>
              <h6 className="text-uppercase small fw-bold mb-4" style={{ color: colors.primaryGreen, letterSpacing: '2px' }}>Personal Identity</h6>
              <div className="row g-4 mb-5">
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">Full Name</label>
                  <input
                    name="name"
                    className="form-control border-light bg-light py-2"
                    onChange={handleChange}
                    value={formData.name}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">Phone Number</label>
                  <input
                    name="phone"
                    className="form-control border-light bg-light py-2"
                    onChange={handleChange}
                    value={formData.phone}
                    placeholder="Enter phone"
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold text-secondary">Age</label>
                  <input
                    name="age"
                    type="number"
                    className="form-control border-light bg-light py-2"
                    onChange={handleChange}
                    value={formData.age}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold text-secondary">Gender</label>
                  <select
                    name="gender"
                    className="form-select border-light bg-light py-2"
                    onChange={handleChange}
                    value={formData.gender}
                  >
                    <option value="">Select</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold text-secondary">Preferred Language</label>
                  <input
                    name="preferredLanguage"
                    className="form-control border-light bg-light py-2"
                    onChange={handleChange}
                    value={formData.preferredLanguage}
                    placeholder="e.g. Marathi"
                  />
                </div>
              </div>

              <h6 className="text-uppercase small fw-bold mb-4" style={{ color: colors.primaryGreen, letterSpacing: '2px' }}>Field & Location Details</h6>
              <div className="row g-4">
                {["village", "taluka", "district", "state", "pincode"].map((field) => (
                  <div className={field === "state" || field === "pincode" ? "col-md-6" : "col-md-4"} key={field}>
                    <label className="form-label small fw-bold text-capitalize text-secondary">{field}</label>
                    <input
                      name={field}
                      className="form-control border-light bg-light py-2"
                      onChange={handleChange}
                      value={formData.address[field]}
                      placeholder={`Enter ${field}`}
                    />
                  </div>
                ))}
              </div>

              <div className="d-flex justify-content-end mt-5">
                <button type="submit"
                  className="btn px-5 py-3 fw-bold d-flex align-items-center gap-2 shadow-sm rounded-pill"
                  style={{ backgroundColor: colors.primaryGreen, color: colors.white, border: 'none', transition: '0.3s' }}>
                  <Save size={18} /> Update Agrivista Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        .font-serif { font-family: 'Playfair Display', serif; }
        .form-control:focus, .form-select:focus {
          border-color: ${colors.primaryGreen};
          box-shadow: 0 0 0 0.25rem rgba(106, 142, 35, 0.1);
          background-color: #fff;
        }
        .btn:hover {
          filter: brightness(1.1);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
};

export default UpdateProfile;
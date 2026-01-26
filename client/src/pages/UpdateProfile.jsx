import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom"; // <-- import useNavigate

const UpdateProfile = () => {
  const userId = Cookies.get("id");
  const navigate = useNavigate(); // <-- initialize navigate

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
  });

  const [loading, setLoading] = useState(true);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await axios.get(`http://localhost:7000/getFarmerDetails/${userId}`);
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
    try {
      await axios.post("http://localhost:7000/updateFarmerDetails", { userId, ...formData });
      Cookies.set("username", formData.name);
      alert("Profile updated successfully");
      navigate("/Landing"); // <-- redirect to /Landing page
    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  };

  if (loading) return <div className="text-center mt-5">Loading...</div>;

  return (
    <div
      className="d-flex justify-content-center align-items-start py-3"
      style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}
    >
      <div
        className="card shadow-sm p-3"
        style={{
          width: "95%",
          maxWidth: "900px",
          fontSize: "0.9rem",
        }}
      >
        {/* Personalized Heading */}
        <h3 className="mb-3 text-center" style={{ fontSize: "1.4rem" }}>
          Hello, {formData.name || "Farmer"}! <br />
          "Let's keep your profile up-to-date 🌱"
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6 mb-2">
              <label htmlFor="name" className="form-label">Full Name</label>
              <input
                id="name"
                name="name"
                className="form-control form-control-sm"
                onChange={handleChange}
                value={formData.name}
                placeholder="Enter full name"
                required
              />
            </div>
            <div className="col-md-6 mb-2">
              <label htmlFor="phone" className="form-label">Phone Number</label>
              <input
                id="phone"
                name="phone"
                className="form-control form-control-sm"
                onChange={handleChange}
                value={formData.phone}
                placeholder="Enter phone"
                required
              />
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-2">
              <label htmlFor="age" className="form-label">Age</label>
              <input
                id="age"
                name="age"
                type="number"
                className="form-control form-control-sm"
                onChange={handleChange}
                value={formData.age}
              />
            </div>
            <div className="col-md-6 mb-2">
              <label htmlFor="gender" className="form-label">Gender</label>
              <select
                id="gender"
                name="gender"
                className="form-select form-select-sm"
                onChange={handleChange}
                value={formData.gender}
              >
                <option value="">Select</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div className="mb-2">
            <label htmlFor="preferredLanguage" className="form-label">Preferred Language</label>
            <input
              id="preferredLanguage"
              name="preferredLanguage"
              className="form-control form-control-sm"
              onChange={handleChange}
              value={formData.preferredLanguage}
            />
          </div>

          <h5 className="mt-3 mb-2">Address</h5>
          <div className="row">
            {["village", "taluka", "district", "state", "pincode"].map((field, idx) => (
              <div className="col-md-6 mb-2" key={idx}>
                <label htmlFor={field} className="form-label">
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  id={field}
                  name={field}
                  className="form-control form-control-sm"
                  onChange={handleChange}
                  value={formData.address[field]}
                  placeholder={`Enter ${field}`}
                />
              </div>
            ))}
          </div>

          <button type="submit" className="btn btn-success w-100 mt-2 btn-sm">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateProfile;

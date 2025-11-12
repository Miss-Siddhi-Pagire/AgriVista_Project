import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import url from "../url";
import "./Update.css"; // 👈 Add CSS file

const Update = () => {
  const navigate = useNavigate();
  const id = Cookies.get("id");

  const [fetchedFormData, setFetchedFormData] = useState({});
  const [formData, setFormData] = useState({
    id: id || "",
    Nitrogen: "",
    Phosphorus: "",
    Potassium: "",
    Temperature: "",
    Humidity: "",
    pH: "",
    Rainfall: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) navigate("/login");
  }, [id, navigate]);

  useEffect(() => {
  const fetchFormData = async () => {
    try {
      const response = await axios.get(`${url}/get-form/${id}`);
      if (response.data && Object.keys(response.data).length > 0) {
        setFetchedFormData(response.data);
        setFormData({
          id,
          Nitrogen: response.data.Nitrogen || "",
          Phosphorus: response.data.Phosphorus || "",
          Potassium: response.data.Potassium || "",
          Temperature: response.data.Temperature || "",
          Humidity: response.data.Humidity || "",
          pH: response.data.pH || "",
          Rainfall: response.data.Rainfall || "",
        });
      }
    } catch (error) {
      console.warn("⚠️ No form data found — showing empty form");
      setFetchedFormData({});
      // formData remains empty but form still displays
    } finally {
      setLoading(false);
    }
  };

  if (id) fetchFormData();
}, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${url}/update-form/${id}`, formData);
      alert("Form updated successfully!");
      navigate("/home");
    } catch (error) {
      console.error("Error updating form:", error);
      alert("Failed to update form");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="update-container">
      <div className="update-card">
        <h2 className="update-title">
          Crop Recommendation System 🌱
        </h2>

        <form onSubmit={handleSubmit} className="update-form">
          <div className="form-row">
            <input
              type="number"
              name="Nitrogen"
              placeholder="Nitrogen"
              value={formData.Nitrogen}
              onChange={handleChange}
            />
            <input
              type="number"
              name="Phosphorus"
              placeholder="Phosphorus"
              value={formData.Phosphorus}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <input
              type="number"
              name="Potassium"
              placeholder="Potassium"
              value={formData.Potassium}
              onChange={handleChange}
            />
            <input
              type="number"
              name="Temperature"
              placeholder="Temperature"
              value={formData.Temperature}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <input
              type="number"
              name="Humidity"
              placeholder="Humidity"
              value={formData.Humidity}
              onChange={handleChange}
            />
            <input
              type="number"
              name="pH"
              placeholder="pH"
              value={formData.pH}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <input
              type="number"
              name="Rainfall"
              placeholder="Rainfall"
              value={formData.Rainfall}
              onChange={handleChange}
            />
            <button type="submit" className="update-btn">
              Update Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Update;

const express = require("express");
const axios = require("axios");

const router = express.Router();

const ML_API = process.env.ML_API_URL || "http://127.0.0.1:8000";

router.post("/predict-crop", async (req, res) => {
  try {
    const response = await axios.post(
      `${ML_API}/predict-crop`,
      req.body
    );
    res.status(200).json(response.data);
  } catch (err) {
    console.error("ML API ERROR:", err.message);
    if (err.response) {
      res.status(err.response.status).json(err.response.data);
    } else {
      res.status(500).json({ error: "ML server connection failed" });
    }
  }
});

// ✅ New Routes for Season-wise Recommendation

router.get("/locations", async (req, res) => {
  try {
    const response = await axios.get(`${ML_API}/locations`);
    res.status(200).json(response.data);
  } catch (err) {
    console.error("ML API ERROR:", err.message);
    if (err.response) {
      res.status(err.response.status).json(err.response.data);
    } else {
      res.status(500).json({ error: "ML server connection failed" });
    }
  }
});

router.get("/seasons", async (req, res) => {
  try {
    const response = await axios.get(`${ML_API}/seasons`);
    res.status(200).json(response.data);
  } catch (err) {
    console.error("ML API ERROR:", err.message);
    if (err.response) {
      res.status(err.response.status).json(err.response.data);
    } else {
      res.status(500).json({ error: "ML server connection failed" });
    }
  }
});

router.post("/recommend-season-commodity", async (req, res) => {
  try {
    const response = await axios.post(
      `${ML_API}/recommend-season-commodity`,
      req.body
    );
    res.status(200).json(response.data);
  } catch (err) {
    console.error("ML API ERROR:", err.message);
    if (err.response) {
      res.status(err.response.status).json(err.response.data);
    } else {
      res.status(500).json({ error: "ML server connection failed" });
    }
  }
});

module.exports = router;

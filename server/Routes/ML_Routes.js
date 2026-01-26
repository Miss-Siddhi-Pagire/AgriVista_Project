const express = require("express");
const axios = require("axios");

const router = express.Router();

const ML_API = "http://127.0.0.1:8000";

router.post("/predict-crop", async (req, res) => {
  try {
    const response = await axios.post(
      `${ML_API}/predict-crop`,
      req.body
    );
    res.status(200).json(response.data);
  } catch (err) {
    console.error("ML API ERROR:", err.message);
    res.status(500).json({ error: "ML server not reachable" });
  }
});

module.exports = router;

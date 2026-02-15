const { Data, DatafetchById, updateFormById, dataToML, getAllTrends, deleteDataById } = require('../Controllers/DataController');
const { getAdvisory } = require('../Controllers/AdvisoryController');
const router = require("express").Router();

// Existing POST routes
router.post("/data", Data);
router.post("/datafetch", DatafetchById); // optional if you still use POST
router.post("/datatoml", dataToML);

// ✅ New routes for Update.jsx
router.get("/get-form/:id", DatafetchById);
router.put("/update-form/:id", updateFormById);
router.delete("/delete-form/:id", deleteDataById); // New DELETE Route
router.get("/trends/all", getAllTrends); // New Public Route
router.post("/api/advisory", getAdvisory); // New AI Advisory Route

module.exports = router;

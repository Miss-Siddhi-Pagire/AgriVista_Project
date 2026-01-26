const { Data, DatafetchById, updateFormById, dataToML } = require('../Controllers/DataController');
const router = require("express").Router();

// Existing POST routes
router.post("/data", Data);
router.post("/datafetch", DatafetchById); // optional if you still use POST
router.post("/datatoml", dataToML);

// ✅ New routes for Update.jsx
router.get("/get-form/:id", DatafetchById);
router.put("/update-form/:id", updateFormById);

module.exports = router;

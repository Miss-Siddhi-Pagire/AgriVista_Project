const router = require("express").Router();

const {
    FertilizerData,
    getFertilizerById,
    updateFertilizerById
} = require("../Controllers/FertilizerController");

router.post("/", FertilizerData);
router.get("/:id", getFertilizerById);
router.put("/:id", updateFertilizerById);

module.exports = router;

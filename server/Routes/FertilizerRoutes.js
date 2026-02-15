const router = require("express").Router();

const {
    FertilizerData,
    getFertilizerById,
    updateFertilizerById,
    deleteFertilizerById
} = require("../Controllers/FertilizerController");

router.post("/", FertilizerData);
router.get("/:id", getFertilizerById);
router.put("/:id", updateFertilizerById);
router.delete("/:id", deleteFertilizerById);

module.exports = router;

const { getSeasonPlan, getCropCalendar, getRotationPlan } = require("../Controllers/PlannerController");
const router = require("express").Router();

router.post("/", getSeasonPlan);
router.post("/calendar", getCropCalendar);
router.post("/rotation", getRotationPlan);

module.exports = router;

const { getSeasonPlan } = require("../Controllers/PlannerController");
const router = require("express").Router();

router.post("/", getSeasonPlan);

module.exports = router;

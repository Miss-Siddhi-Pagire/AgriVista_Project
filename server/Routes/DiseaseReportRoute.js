const router = require("express").Router();
const {
  submitReport,
  getReports,
  deleteReport,
  upvoteReport,
  getDistrictCoords
} = require("../Controllers/DiseaseReportController");

router.get("/", getReports);
router.post("/", submitReport);
router.delete("/:id", deleteReport);
router.patch("/:id/upvote", upvoteReport);
router.get("/coords", getDistrictCoords);

module.exports = router;

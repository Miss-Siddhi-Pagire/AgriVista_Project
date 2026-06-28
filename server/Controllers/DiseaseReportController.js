const DiseaseReport = require("../Models/DiseaseReportModel");
const User = require("../Models/UserModel");

// Indian states → approximate district-level coordinates for the heatmap pins
const DISTRICT_COORDS = {
  "Punjab": {
    "Ludhiana": [30.9010, 75.8573], "Amritsar": [31.6340, 74.8723],
    "Jalandhar": [31.3260, 75.5762], "Patiala": [30.3398, 76.3869],
    "Bathinda": [30.2110, 74.9455], "Gurdaspur": [32.0396, 75.4044]
  },
  "Maharashtra": {
    "Pune": [18.5204, 73.8567], "Nashik": [19.9975, 73.7898],
    "Nagpur": [21.1458, 79.0882], "Aurangabad": [19.8762, 75.3433],
    "Solapur": [17.6868, 75.9064], "Kolhapur": [16.7050, 74.2433]
  },
  "Gujarat": {
    "Ahmedabad": [23.0225, 72.5714], "Surat": [21.1702, 72.8311],
    "Rajkot": [22.3039, 70.8022], "Vadodara": [22.3072, 73.1812],
    "Junagadh": [21.5222, 70.4579], "Anand": [22.5645, 72.9289]
  },
  "Madhya Pradesh": {
    "Indore": [22.7196, 75.8577], "Bhopal": [23.2599, 77.4126],
    "Ujjain": [23.1765, 75.7885], "Gwalior": [26.2183, 78.1828],
    "Jabalpur": [23.1815, 79.9864], "Sagar": [23.8388, 78.7378]
  },
  "Uttar Pradesh": {
    "Lucknow": [26.8467, 80.9462], "Agra": [27.1767, 78.0081],
    "Kanpur": [26.4499, 80.3319], "Varanasi": [25.3176, 82.9739],
    "Meerut": [28.9845, 77.7064], "Allahabad": [25.4358, 81.8463]
  },
  "Haryana": {
    "Karnal": [29.6857, 76.9905], "Panipat": [29.3909, 76.9635],
    "Rohtak": [28.8955, 76.6066], "Hisar": [29.1492, 75.7217],
    "Sirsa": [29.5334, 75.0280], "Ambala": [30.3782, 76.7767]
  }
};

// POST /api/disease-reports — Submit a new report
module.exports.submitReport = async (req, res) => {
  try {
    const { userId, username, cropName, diseaseName, severity, description, state, district, latitude, longitude } = req.body;

    if (!userId || !cropName || !diseaseName || !severity || !state || !district) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    // Auto-fill lat/lng from lookup table if not provided
    let lat = latitude, lng = longitude;
    if (!lat && DISTRICT_COORDS[state]?.[district]) {
      [lat, lng] = DISTRICT_COORDS[state][district];
      // Add tiny random offset so pins don't stack exactly
      lat += (Math.random() - 0.5) * 0.15;
      lng += (Math.random() - 0.5) * 0.15;
    }

    const report = await DiseaseReport.create({
      userId, username, cropName, diseaseName, severity, description, state, district,
      latitude: lat, longitude: lng
    });

    res.status(201).json({ success: true, report });
  } catch (err) {
    console.error("Disease report submit error:", err);
    res.status(500).json({ success: false, message: "Failed to submit report." });
  }
};

// GET /api/disease-reports — Fetch all reports (with optional filter)
module.exports.getReports = async (req, res) => {
  try {
    const { state, disease, severity } = req.query;
    const filter = {};
    if (state) filter.state = state;
    if (disease) filter.diseaseName = new RegExp(disease, "i");
    if (severity) filter.severity = severity;

    const reports = await DiseaseReport.find(filter).sort({ createdAt: -1 }).limit(200);

    // Aggregate disease stats for sidebar
    const stats = {};
    reports.forEach(r => {
      const key = r.diseaseName;
      if (!stats[key]) stats[key] = { count: 0, severity: {} };
      stats[key].count++;
      stats[key].severity[r.severity] = (stats[key].severity[r.severity] || 0) + 1;
    });

    res.status(200).json({ success: true, reports, stats });
  } catch (err) {
    console.error("Fetch reports error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch reports." });
  }
};

// DELETE /api/disease-reports/:id
module.exports.deleteReport = async (req, res) => {
  try {
    await DiseaseReport.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete." });
  }
};

// PATCH /api/disease-reports/:id/upvote
module.exports.upvoteReport = async (req, res) => {
  try {
    const report = await DiseaseReport.findByIdAndUpdate(
      req.params.id, { $inc: { upvotes: 1 } }, { new: true }
    );
    res.status(200).json({ success: true, upvotes: report.upvotes });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to upvote." });
  }
};

module.exports.getDistrictCoords = (req, res) => {
  res.json({ success: true, coords: DISTRICT_COORDS });
};

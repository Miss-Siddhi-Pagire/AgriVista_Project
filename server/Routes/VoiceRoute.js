const express = require("express");
const router = express.Router();
const { voiceQuery } = require("../Controllers/VoiceController");

router.post("/query", voiceQuery);

module.exports = router;

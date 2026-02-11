const { getWeatherByLocation } = require('../Controllers/WeatherController');
const router = require("express").Router();

router.get("/:userId", getWeatherByLocation);

module.exports = router;

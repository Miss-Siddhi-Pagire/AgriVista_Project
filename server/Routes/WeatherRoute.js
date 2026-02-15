const { getWeatherByLocation, getWeatherByRegion } = require('../Controllers/WeatherController');
const router = require("express").Router();

router.get("/region", getWeatherByRegion);
router.get("/:userId", getWeatherByLocation);

module.exports = router;

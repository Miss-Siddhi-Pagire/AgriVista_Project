const axios = require('axios');
const User = require('../Models/UserModel');
require('dotenv').config();

// Average Seasonal Rainfall Map (in mm) for Indian States
// Used as a fallback when live weather API returns 0 (dry day)
const STATE_RAINFALL_AVERAGE = {
    "andhra pradesh": 900,
    "arunachal pradesh": 2500,
    "assam": 2000,
    "bihar": 1000,
    "chhattisgarh": 1200,
    "goa": 3000,
    "gujarat": 700,
    "haryana": 500,
    "himachal pradesh": 1200,
    "jharkhand": 1200,
    "karnataka": 1000,
    "kerala": 2500,
    "madhya pradesh": 1000,
    "maharashtra": 1000, // Varies widely (Konkan vs Vidarbha), but 1000 is a safe median for crop prediction input
    "manipur": 1500,
    "meghalaya": 2500,
    "mizoram": 2000,
    "nagaland": 1500,
    "odisha": 1400,
    "punjab": 500,
    "rajasthan": 400,
    "sikkim": 2000,
    "tamil nadu": 900,
    "telangana": 900,
    "tripura": 2000,
    "uttar pradesh": 900,
    "uttarakhand": 1500,
    "west bengal": 1500,
    "delhi": 700,
    "chandigarh": 1000,
    "default": 1000
};

// Fetch Weather Data based on User's Location
module.exports.getWeatherByLocation = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        console.log(`[WeatherAPI] Received request for UserId: ${userId}`);

        // 1. Fetch User Details to get Location (Village -> Taluka -> District)
        const user = await User.findById(userId);

        if (!user) {
            console.log(`[WeatherAPI] User not found in DB with ID: ${userId}`);
            return res.status(404).json({ message: "User not found" });
        }

        console.log(`[WeatherAPI] User Found: ${user.name}, Address: ${JSON.stringify(user.address)}`);

        // 2. Determine Location Query
        // Prefer Village, falling back to Taluka, then District
        let locationQuery = '';
        if (user.address) {
            if (user.address.village) locationQuery = user.address.village;
            else if (user.address.taluka) locationQuery = user.address.taluka;
            else if (user.address.district) locationQuery = user.address.district;
        }

        if (!locationQuery) {
            console.log(`[WeatherAPI] No address found for user: ${userId}`);
            return res.status(400).json({ message: "User address not found or incomplete. Please update your profile." });
        }

        // Append ",IN" for India context if not present, to improve accuracy
        if (!locationQuery.includes(",")) {
            locationQuery += ",IN";
        }

        const apiKey = process.env.WEATHER_API_KEY;
        if (!apiKey) {
            console.error("WEATHER_API_KEY is missing in .env");
            return res.status(500).json({ message: "Server configuration error (API Key missing)" });
        }

        // 3. Call WeatherAPI.com
        const weatherUrl = `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(locationQuery)}`;

        console.log(`[WeatherAPI] Fetching external API for: ${locationQuery}`);

        const response = await axios.get(weatherUrl);
        const data = response.data;

        // ... rest of logic ...
        let estimatedRainfall = data.current.precip_mm;

        if (estimatedRainfall === 0) {
            // Try to find state rainfall
            let userState = user.address && user.address.state ? user.address.state.toLowerCase().trim() : "";

            // If state is missing in DB, try to infer from API 'region' field (often contains State name)
            if (!userState && data.location.region) {
                userState = data.location.region.toLowerCase().trim();
            }

            if (userState && STATE_RAINFALL_AVERAGE[userState]) {
                estimatedRainfall = STATE_RAINFALL_AVERAGE[userState];
                console.log(`[WeatherAPI] Live rain 0mm. Using average for ${userState}: ${estimatedRainfall}mm`);
            } else {
                estimatedRainfall = STATE_RAINFALL_AVERAGE["default"]; // Default fallback
                console.log(`[WeatherAPI] Live rain 0mm. Using default average: ${estimatedRainfall}mm`);
            }
        }

        // 5. Extract Relevant Data
        const weatherData = {
            location: data.location.name,
            temperature: data.current.temp_c,       // Celsius
            humidity: data.current.humidity,        // %
            rainfall: estimatedRainfall             // mm (Live or Seasonal Average)
        };

        res.status(200).json({
            success: true,
            data: weatherData
        });

    } catch (error) {
        console.error("Weather API Error:", error.message);
        if (error.response) {
            console.error("External API Response Data:", error.response.data);
            if (error.response.status === 404) {
                return res.status(404).json({ message: `Location '${locationQuery}' not found in Weather Database` });
            }
            return res.status(error.response.status).json({ message: error.response.data.message || "Weather Service Error" });
        }
        res.status(500).json({ message: "Internal server error fetching weather" });
    }
};

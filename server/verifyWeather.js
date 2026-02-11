const mongoose = require("mongoose");
const axios = require("axios");
const User = require("./Models/UserModel");
require("dotenv").config();

const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/AgriVista";
const BASE_URL = "http://localhost:7000";

async function verifyWeather() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(MONGO_URL);
        console.log("Connected.");

        // Find a user with an address
        const user = await User.findOne({
            "address.village": { $exists: true, $ne: "" }
        });

        if (!user) {
            console.log("No user with village address found. Trying any user...");
            const anyUser = await User.findOne();
            if (!anyUser) {
                console.error("No users found in DB.");
                process.exit(1);
            }
            console.log("Found user (no specific address):", anyUser.name, anyUser._id);
            console.log("Validation might fail if address is missing.");
            await testApi(anyUser._id);
        } else {
            console.log(`Found User: ${user.name} | Village: ${user.address.village}`);
            await testApi(user._id);
        }

    } catch (err) {
        console.error("DB Connection Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

async function testApi(userId) {
    try {
        console.log(`\nTesting API: GET ${BASE_URL}/api/weather/${userId}`);
        const response = await axios.get(`${BASE_URL}/api/weather/${userId}`);

        console.log("\n--- API RESPONSE ---");
        console.log("Status:", response.status);
        console.log("Data:", response.data);

        if (response.data.success && response.data.data.temperature) {
            console.log("\n✅ SUCCESS: Weather data fetched correctly.");
        } else {
            console.log("\n❌ FAILURE: Unexpected response structure.");
        }
    } catch (error) {
        console.error("\n❌ API Call Failed:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Message:", error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

verifyWeather();

const axios = require('axios');

async function testFertilizer() {
    console.log("Testing Fertilizer Prediction...");

    // 1. Mock Input
    const input = {
        Nitrogen: 50,
        Phosphorus: 50,
        Potassium: 50,
        SoilType: "Clayey",
        Crop: "Rice"
    };

    try {
        // 2. Call ML API
        console.log("1. Calling ML API...");
        const mlRes = await axios.post("http://127.0.0.1:8000/predict-fertilizer", {
            Nitrogen: input.Nitrogen,
            Phosphorus: input.Phosphorus,
            Potassium: input.Potassium,
            soil_type: input.SoilType,
            crop_type: input.Crop
        });

        console.log("ML Response:", JSON.stringify(mlRes.data, null, 2));

        if (!mlRes.data.alternatives) {
            console.error("❌ ML API did not return alternatives!");
            return;
        }

        // 3. Call Node Backend (to save)
        console.log("\n2. Calling Node Backend...");
        // Simulate Update.jsx behavior: passing the result in RecommendedFertilizer
        const backendRes = await axios.post("http://localhost:7000/api/fertilizer", {
            id: "verify_script_test_user", // Dummy ID
            ...input,
            RecommendedFertilizer: mlRes.data
        });

        console.log("Backend Response:", JSON.stringify(backendRes.data, null, 2));

        // Check if saved data has alternatives
        if (typeof backendRes.data.data.RecommendedFertilizer === 'object' && backendRes.data.data.RecommendedFertilizer.alternatives) {
            console.log("✅ Backend saved full object correctly!");
        } else {
            console.error("❌ Backend did not save full object!");
            console.log("Saved value:", backendRes.data.data.RecommendedFertilizer);
        }

    } catch (error) {
        console.error("Error:", error.message);
        if (error.response) {
            console.error("Response data:", error.response.data);
        }
    }
}

testFertilizer();

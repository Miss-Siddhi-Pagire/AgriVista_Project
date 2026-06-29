const { Groq } = require("groq-sdk");
require('dotenv').config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

module.exports.getAdvisory = async (req, res) => {
    try {
        const { inputs, prediction, target_crop, mode } = req.body;

        if (!inputs || !prediction) {
            console.error("Advisory Error: Missing inputs or prediction");
            return res.status(400).json({ message: "Missing inputs or prediction data" });
        }

        const cropToAnalyze = target_crop || inputs.Crop || prediction.recommended_crop || prediction;

        if (!process.env.GROQ_API_KEY) {
            console.error("Advisory Error: GROQ_API_KEY is missing in .env");
            return res.status(500).json({ message: "Server Misconfiguration: No API Key" });
        }

        let prompt = "";

        if (mode === "fertilizer") {
            const crop = inputs.Crop || target_crop || "the crop";
            const recFert = typeof prediction === 'string' ? prediction : (prediction.recommended_fertilizer || prediction.Recommendation || JSON.stringify(prediction));
            prompt = `
            You are an expert soil fertility consultant for AgriVista.
            
            **Context:**
            A farmer is growing **${crop}** in **${inputs.SoilType || "Loamy"}** soil with current NPK levels:
            - Nitrogen (N): ${inputs.Nitrogen}
            - Phosphorus (P): ${inputs.Phosphorus}
            - Potassium (K): ${inputs.Potassium}
            
            AI Fertilizer Recommendation: **${recFert}**
            
            **Your Task:**
            Provide a specialized, detailed fertilizer advisory report in STRICT JSON format.
            
            **Required JSON Structure:**
            {
                "mode": "fertilizer",
                "soil_nutrient_analysis": "Detailed analysis of current NPK balance for growing ${crop} in ${inputs.SoilType || "Loamy"} soil.",
                "fertilizer_plan": [
                    {
                        "name": "Name (e.g., Urea, NPK 10-26-26, DAP, MOP)",
                        "action": "Specific nutrient provided & role in plant development",
                        "dosage": "Application rate per acre",
                        "timing": "When to apply (e.g., Basal application at sowing, Split dose at 30 days)",
                        "approx_price": "Estimated Indian market price (e.g., ₹266/45kg bag)",
                        "availability": "Where to purchase (e.g., Local Krishi Kendra, Cooperative Society)"
                    }
                ],
                "application_method": ["Step 1: Broadcast or fertigation guidance...", "Step 2: Soil moisture requirement during application..."],
                "soil_health_tips": ["Tip 1: Organic matter / bio-fertilizer integration...", "Tip 2: Soil pH or micronutrient maintenance..."]
            }
            DO NOT include any markdown formatting. Output ONLY the raw JSON object.
            `;
        } else if (mode === "yield") {
            const crop = inputs.Crop || target_crop || "the crop";
            const estYield = typeof prediction === 'number' || typeof prediction === 'string' ? prediction : (prediction.estimated_yield || prediction.PredictedYield || JSON.stringify(prediction));
            prompt = `
            You are an expert crop yield optimization consultant for AgriVista.
            
            **Context:**
            A farmer is cultivating **${crop}** over **${inputs.TotalDays || 120} days** with conditions:
            - Soil Moisture: ${inputs.SoilMoisture}%
            - pH Level: ${inputs.pH}
            - Temperature: ${inputs.Temperature}°C
            - Rainfall: ${inputs.Rainfall}mm
            - Humidity: ${inputs.Humidity}%
            
            Predicted Yield Outcome: **${estYield}**
            
            **Your Task:**
            Provide a dedicated yield maximization report in STRICT JSON format.
            
            **Required JSON Structure:**
            {
                "mode": "yield",
                "yield_analysis": "Expert evaluation of the predicted yield (${estYield}) relative to regional crop potential.",
                "yield_enhancers": ["High-impact management practice 1 to maximize output...", "Practice 2..."],
                "irrigation_and_climate_tips": ["Water management recommendation to prevent stress...", "Temperature/weather coping strategy..."],
                "harvest_and_post_harvest": ["Optimal harvesting indicators & technique...", "Post-harvest handling to avoid losses..."],
                "market_realization": "Strategic advice on selling timing, grading, or storage to get peak market price for ${crop}."
            }
            DO NOT include any markdown formatting. Output ONLY the raw JSON object.
            `;
        } else {
            // Default: Crop recommendation advisory
            prompt = `
            You are an expert agricultural consultant for AgriVista.
            
            **Context:**
            A farmer is considering growing **${cropToAnalyze}** based on the following soil and weather conditions:
            - Nitrogen: ${inputs.Nitrogen}
            - Phosphorus: ${inputs.Phosphorus}
            - Potassium: ${inputs.Potassium}
            - pH Level: ${inputs.pH}
            - Rainfall: ${inputs.Rainfall} mm
            - Temperature: ${inputs.Temperature} °C
            - Humidity: ${inputs.Humidity} %
            
            **Your Task:**
            Provide a detailed, professional, and actionable advisory report for **${cropToAnalyze}** in STRICT JSON format.
            
            **Required JSON Structure:**
            {
                "mode": "crop",
                "why_this_crop": "Briefly explain why ${cropToAnalyze} is suitable here.",
                "monthly_schedule": ["Month 1 (Days 1-15): Task...", "Month 1 (Days 16-30): Task...", "Month 2..."],
                "care_maintenance": ["Tip 1...", "Tip 2..."],
                "disease_management": [
                    { "disease": "Name", "symptoms": "...", "solution": "..." },
                    { "disease": "Name", "symptoms": "...", "solution": "..." }
                ],
                "fertilizer_recommendations": [
                    {
                        "name": "Name (e.g., Urea, NPK 10-26-26)",
                        "action": "Why it is needed / What it does",
                        "dosage": "Application rate per acre",
                        "approx_price": "Estimated Price in INR (e.g., ₹266/45kg bag)",
                        "availability": "Where to buy (e.g., Local Krishi Kendra, IFFCO Center)"
                    }
                ]
            }
            DO NOT include any markdown formatting. Output ONLY the raw JSON object.
            `;
        }

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a helpful and expert agricultural AI assistant that outputs only valid JSON."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
            max_tokens: 1024,
            response_format: { type: "json_object" }
        });

        const advisoryContent = completion.choices[0]?.message?.content;
        let advisoryData = {};

        try {
            advisoryData = JSON.parse(advisoryContent);
        } catch (e) {
            console.error("Failed to parse AI JSON:", e);
            advisoryData = { error: "Could not parse advisory data." };
        }

        res.status(200).json({
            success: true,
            advisory: advisoryData
        });

    } catch (error) {
        console.error("Groq API Error Details:", error);
        res.status(500).json({
            message: "Failed to generate AI advisory",
            error: error.message,
            stack: error.stack
        });
    }
};


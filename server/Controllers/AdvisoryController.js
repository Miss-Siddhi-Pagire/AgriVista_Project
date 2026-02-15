const { Groq } = require("groq-sdk");
require('dotenv').config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

module.exports.getAdvisory = async (req, res) => {
    try {
        const { inputs, prediction, target_crop } = req.body;

        if (!inputs || !prediction) {
            console.error("Advisory Error: Missing inputs or prediction");
            return res.status(400).json({ message: "Missing inputs or prediction data" });
        }

        // Determine which crop to analyze (target_crop takes priority for alternatives)
        const cropToAnalyze = target_crop || prediction.recommended_crop || prediction;

        if (!process.env.GROQ_API_KEY) {
            console.error("Advisory Error: GROQ_API_KEY is missing in .env");
            return res.status(500).json({ message: "Server Misconfiguration: No API Key" });
        }

        // Construct a detailed prompt
        const prompt = `
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
                },
                {
                    "name": "...",
                    "action": "...",
                    "dosage": "...",
                    "approx_price": "...",
                    "availability": "..."
                }
            ]
        }
        
        DO NOT include any markdown formatting (like \`\`\`json). Just the raw JSON object.
        For "monthly_schedule", provide a detailed timeline from sowing to harvesting, broken down by 15-day intervals if possible.
        For "disease_management", list 2-3 common diseases for ${cropToAnalyze} in these conditions.
        For "fertilizer_recommendations", provide 2-3 specific fertilizer suggestions with realistic Indian market prices and common availability sources.
        Keep the content encouraging, premium, and expert-level.
        `;

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
            // Fallback if JSON fails
            advisoryData = { error: "Could not parse advisory data." };
        }

        res.status(200).json({
            success: true,
            advisory: advisoryData
        });

    } catch (error) {
        console.error("Groq API Error Details:", error);
        // Respond with more detail if possible
        res.status(500).json({
            message: "Failed to generate AI advisory",
            error: error.message,
            stack: error.stack
        });
    }
};

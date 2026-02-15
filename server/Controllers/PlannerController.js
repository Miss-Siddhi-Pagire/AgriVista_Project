const { Groq } = require("groq-sdk");
require('dotenv').config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

module.exports.getSeasonPlan = async (req, res) => {
    try {
        const { crop, season, state, district, taluka } = req.body;

        if (!crop || !season || !state || !district) {
            return res.status(400).json({ message: "Missing required fields: crop, season, state, district" });
        }

        const location = `${taluka ? taluka + ", " : ""}${district}, ${state}`;

        const prompt = `
        You are an expert senior agronomist specializing in Indian agriculture.
        
        **Client Request:**
        A farmer in **${location}** wants to grow **${crop}** during the **${season}** season.
        
        **Your Task:**
        Provide a comprehensive, structured farming plan specifically tailored to this region's soil, climate, and agricultural practices for the ${season} season.
        
        **Required Output Format:**
        STRICT JSON. Do not include markdown formatting like \`\`\`json.
        
        **JSON Structure:**
        {
            "suitability": {
                "is_suitable": true/false,
                "analysis": "Brief analysis of temperature/rainfall vs requirements.",
                "recommendation": "Go ahead / Proceed with caution / Not recommended"
            },
            "soil_preparation": {
                "title": "Land Preparation",
                "steps": ["Step 1...", "Step 2..."],
                "key_tip": "One crucial tip for soil health."
            },
            "sowing": {
                "title": "Seed Selection & Sowing",
                "varieties": [
                    { "name": "Variety 1", "details": "High yield, resistant to...", "approx_price": "₹.../kg" },
                    { "name": "Variety 2", "details": "...", "approx_price": "..." }
                ],
                "seed_rate": "e.g., 40-50 kg/acre",
                "spacing": "e.g., 22.5 cm x 10 cm",
                "treatment": "Seed treatment details",
                "method": "Sowing method details"
            },
            "fertilizer": {
                "title": "Nutrient Management",
                "schedule": [
                    { "stage": "Basal", "fertilizer": "DAP + MOP", "dose": "50kg + 20kg", "approx_price": "₹1350 + ₹900" },
                    { "stage": "Vegetative", "fertilizer": "Urea", "dose": "45kg", "approx_price": "₹266" }
                ]
            },
            "irrigation": {
                "title": "Water Management",
                "schedule": "General irrigation advice based on soil/season.",
                "critical_stages": ["Stage 1", "Stage 2"]
            },
            "protection": {
                "title": "Weed, Pest & Disease Control",
                "weeds": ["Common weed 1", "Control measure"],
                "pests": ["Pest 1", "Control measure"],
                "diseases": ["Disease 1", "Control measure"]
            },
            "harvest": {
                "title": "Harvesting & Post-Harvest",
                "signs_of_maturity": ["Sign 1", "Sign 2"],
                "harvesting_method": "Method details",
                "storage": "Storage advice"
            },
            "economics": {
                "title": "Economic Estimates",
                "estimated_cost": "₹...",
                "estimated_yield": "... quintals/acre",
                "market_outlook": "Current trend in ${state}"
            }
        }
        
        **Tone:** Professional, encouraging, and practical. Use local terminology where appropriate.
        `;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an expert Indian agricultural consultant. Output ONLY valid JSON."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
            max_tokens: 2048,
            response_format: { type: "json_object" }
        });

        const planContent = completion.choices[0]?.message?.content;
        let plan = {};

        try {
            plan = JSON.parse(planContent);
        } catch (e) {
            console.error("JSON Parse Error:", e);
            plan = { error: "Failed to parse plan data." };
        }

        res.status(200).json({
            success: true,
            plan: plan
        });

    } catch (error) {
        console.error("Planner Error:", error);
        res.status(500).json({
            message: "Failed to generate season plan",
            error: error.message
        });
    }
};

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
            "crop_name_english": "English name of the crop (e.g. Onion for Kanda)",
            "inputs_required": {
                "title": "Required Farm Inputs",
                "seeds": ["Variety name 1 (Qty)", "Variety name 2 (Qty)"],
                "fertilizers": ["Fertilizer 1 (Qty/Acre)", "Fertilizer 2 (Qty/Acre)"],
                "pesticides": ["Pesticide 1 (Target)", "Fungicide 1 (Target)"]
            },
            "soil_preparation": {
                "title": "Land Preparation",
                "steps": ["Detailed step 1 explaining the 'why' and 'how'...", "Detailed step 2 with specific measurements..."],
                "key_tip": "One crucial tip for soil health."
            },
            "sowing": {
                "title": "Seed Selection & Sowing",
                "varieties": [
                    { "name": "Variety 1", "details": "High yield potential, disease resistance details...", "approx_price": "₹.../kg" },
                    { "name": "Variety 2", "details": "...", "approx_price": "..." }
                ],
                "seed_rate": "e.g., 40-50 kg/acre",
                "spacing": "e.g., 22.5 cm x 10 cm",
                "treatment": "Comprehensive seed treatment procedure",
                "method": "Detailed sowing method description"
            },
            "fertilizer": {
                "title": "Nutrient Management",
                "schedule": [
                    { "stage": "Basal Application", "fertilizer": "DAP + MOP", "dose": "50kg + 20kg", "approx_price": "₹1350" },
                    { "stage": "Vegetative Growth (20-25 DAS)", "fertilizer": "Urea", "dose": "45kg", "approx_price": "₹266" }
                ]
            },
            "irrigation": {
                "title": "Water Management",
                "schedule": "Detailed irrigation schedule explaining critical moisture periods.",
                "critical_stages": ["Crown Root Initiation", "Flowering", "Grain Filling"]
            },
            "protection": {
                "title": "Weed, Pest & Disease Control",
                "weeds": ["Common weed 1", "Control measure"],
                "pests": ["Pest 1", "Control measure"],
                "diseases": ["Disease 1", "Control measure"]
            },
            "harvest": {
                "title": "Harvesting & Post-Harvest",
                "signs_of_maturity": ["Visual sign 1", "Moisture content check"],
                "harvesting_method": "Recommended method (manual/mechanical) and timing",
                "storage": "Detailed storage advice (temperature, humidity, duration)"
            },
            "economics": {
                "title": "Economic Estimates",
                "estimated_cost": "₹... per acre",
                "estimated_yield": "... quintals/acre",
                "market_outlook": "Detailed market trend analysis for ${state}"
            }
        }
        
        **Tone:** Professional, authoritative, and deeply educational. Provide specific, actionable details.
        
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

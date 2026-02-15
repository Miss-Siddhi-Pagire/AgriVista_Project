const Groq = require("groq-sdk");
require("dotenv").config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

module.exports.voiceQuery = async (req, res) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({ success: false, message: "Voice query is required" });
        }

        const prompt = `
        You are AgriVoice, an expert agricultural assistant for Indian farmers.
        User Query: "${query}"

        Instructions:
        1. Identify the language of the user's query (English, Hindi, Marathi, etc.).
        2. Respond IN THE SAME LANGUAGE as the user's query.
        3. Keep the response concise, helpful, and easy to understand (spoken friendly).
        4. Focus on practical farming advice.
        5. Do not use complex formatting like tables or markdown bolding as this will be spoken out loud (Text-to-Speech). Use natural punctuation.
        `;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a helpful agricultural voice assistant. Respond in the same language as the user. Keep it brief and spoken-friendly."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.6,
            max_tokens: 250
        });

        const responseText = completion.choices[0]?.message?.content;

        res.status(200).json({
            success: true,
            response: responseText
        });

    } catch (error) {
        console.error("Voice Query Error:", error);
        res.status(500).json({ success: false, message: "Failed to process voice query" });
    }
};

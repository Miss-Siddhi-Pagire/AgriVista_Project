// A simulator mapping base Indian Mandi wholesale prices (varies by commodity and state logic)
const COMMODITY_BASES = {
  Wheat: 2275, // Govt MSP roughly
  Paddy: 2183,
  Cotton: 6620,
  Soybean: 4600,
  Onion: 1650,
  Tomato: 1400,
  Potato: 1050,
  Maize: 1962,
  Sugarcane: 315,
  Mustard: 5450,
  Chickpea: 5335,
  Groundnut: 5850
};

const MARKETS = {
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"],
  "Maharashtra": ["Pune", "Nashik", "Nagpur", "APMC Vashi (Mumbai)", "Lasalgaon"],
  "Gujarat": ["Ahmedabad", "Surat", "Rajkot", "Gondal", "Unjha"],
  "Madhya Pradesh": ["Indore", "Bhopal", "Ujjain", "Neemuch", "Khandwa"],
  "Uttar Pradesh": ["Lucknow", "Agra", "Kanpur", "Varanasi", "Meerut"],
  "Haryana": ["Karnal", "Panipat", "Rohtak", "Hisar", "Sirsa"]
};

// Extremely simple pseudo-random generator seeded by string
function seededRandom(seedStr) {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(31, h) + seedStr.charCodeAt(i) | 0;
  }
  const result = ((h ^ (h >>> 15)) * 2654435761) | 0;
  return ((((result ^ (result >>> 15)) >>> 0) / 4294967296) * 2) - 1; // Returns -1.0 to 1.0
}

module.exports.getStatesAndMarkets = (req, res) => {
  try {
    res.status(200).json({ success: true, markets: MARKETS });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching markets." });
  }
};

module.exports.getLivePrices = (req, res) => {
  try {
    const { state, market } = req.query;
    
    // For a real-time feel, we base prices on the CURRENT day.
    const today = new Date().toLocaleDateString("en-IN");
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-IN");
    
    const commodities = Object.keys(COMMODITY_BASES);
    
    // Generate simulated data per commodity
    const pricingData = commodities.map(commodity => {
      const basePrice = COMMODITY_BASES[commodity];
      
      // Regional modifier based strictly on State (some states grow things better)
      const stateModifier = seededRandom(`${state}-${commodity}`) * 0.08; // +/- 8% depending on state
      
      // Daily volatility
      const todayVol = seededRandom(`${market}-${commodity}-${today}`) * 0.04; // +/- 4% daily shift
      const yestVol = seededRandom(`${market}-${commodity}-${yesterday}`) * 0.04;

      const baseToday = basePrice + (basePrice * stateModifier);
      const todayTotal = baseToday + (baseToday * todayVol);
      const yesterdayTotal = baseToday + (baseToday * yestVol);

      // Generating min/max/modal spreads
      const modal = Math.round(todayTotal);
      const min = Math.round(modal * 0.92); // Lowest bid is around -8%
      const max = Math.round(modal * 1.05); // Highest bid is +5%
      
      const yesterdayModal = Math.round(yesterdayTotal);
      const trendDiff = modal - yesterdayModal;
      let trend = "stable";
      if (trendDiff > (basePrice * 0.005)) trend = "up";
      if (trendDiff < -(basePrice * 0.005)) trend = "down";

      return {
        commodity,
        min_price: min,
        max_price: max,
        modal_price: modal,
        unit: "Quintal",
        trend: trend,
        change: Math.abs(trendDiff)
      };
    });

    res.status(200).json({
      success: true,
      data: pricingData,
      date: today,
      state: state || "All",
      market: market || "Wholesale Average"
    });
    
  } catch (err) {
    console.error("Market Price simulation failed", err);
    res.status(500).json({ success: false, message: "Error fetching live prices." });
  }
};

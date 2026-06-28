const { getLivePrices, getStatesAndMarkets } = require("../Controllers/MarketController");
const router = require("express").Router();

router.get("/prices", getLivePrices);
router.get("/states", getStatesAndMarkets);

module.exports = router;

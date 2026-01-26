const router = require("express").Router();

const {
    YieldData,
    getYieldById,
    updateYieldById
} = require("../Controllers/YieldController");

// POST  /api/yield
router.post("/", YieldData);

// GET   /api/yield/:id
router.get("/:id", getYieldById);

// PUT   /api/yield/:id
router.put("/:id", updateYieldById);

module.exports = router;

const router = require("express").Router();

const {
    YieldData,
    getYieldById,
    updateYieldById,
    deleteYieldById
} = require("../Controllers/YieldController");

// POST  /api/yield
router.post("/", YieldData);

// GET   /api/yield/:id
router.get("/:id", getYieldById);

// PUT   /api/yield/:id
router.put("/:id", updateYieldById);

// DELETE /api/yield/:id
router.delete("/:id", deleteYieldById);

module.exports = router;

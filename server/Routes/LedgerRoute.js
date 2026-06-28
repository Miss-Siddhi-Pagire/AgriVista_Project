const { getTransactions, addTransaction, deleteTransaction } = require("../Controllers/LedgerController");
const router = require("express").Router();

router.get("/", getTransactions);
router.post("/", addTransaction);
router.delete("/:transactionId", deleteTransaction);

module.exports = router;

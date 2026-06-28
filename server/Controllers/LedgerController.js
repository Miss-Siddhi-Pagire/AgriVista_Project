const Ledger = require("../Models/LedgerModel");

// Get all transactions for a user
module.exports.getTransactions = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const transactions = await Ledger.find({ userId }).sort({ date: -1 });

    // Calculate Summary
    let totalIncome = 0;
    let totalExpense = 0;
    
    transactions.forEach(t => {
      if (t.transactionType === "income") {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
      }
    });

    res.status(200).json({
      success: true,
      transactions,
      summary: {
        totalIncome,
        totalExpense,
        netProfit: totalIncome - totalExpense
      }
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Add a transaction
module.exports.addTransaction = async (req, res) => {
  try {
    const { userId, transactionType, category, amount, date, description, relatedCrop } = req.body;
    
    if (!userId || !transactionType || !category || amount === undefined) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const newTransaction = new Ledger({
      userId,
      transactionType,
      category,
      amount: Number(amount),
      date: date || new Date(),
      description: description || "",
      relatedCrop: relatedCrop || ""
    });

    await newTransaction.save();
    
    res.status(201).json({ success: true, transaction: newTransaction });
  } catch (error) {
    console.error("Error adding transaction:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete a transaction
module.exports.deleteTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const deleted = await Ledger.findByIdAndDelete(transactionId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    res.status(200).json({ success: true, message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

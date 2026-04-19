const express = require("express");
const router = express.Router();
const Opportunity = require("../models/Opportunity");

// GET ALL
router.get("/", async (req, res) => {
  try {
    const data = await Opportunity.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch opportunities" });
  }
});

// DELETE BY ID
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Opportunity.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Opportunity not found" });
    res.json({ message: "Opportunity deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete opportunity" });
  }
});

module.exports = router;
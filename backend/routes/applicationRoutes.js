const express = require("express");
const router = express.Router();
const Application = require("../models/Application");

// APPLY
router.post("/", async (req, res) => {
  try {
    const app = await Application.create(req.body);
    res.json(app);
  } catch (err) {
    res.status(500).json({ message: "Failed to create application" });
  }
});

// GET APPLICATIONS BY STUDENT
router.get("/:studentId", async (req, res) => {
  try {
    const data = await Application.find({ studentId: req.params.studentId })
      .populate("opportunityId");
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch applications" });
  }
});

module.exports = router;
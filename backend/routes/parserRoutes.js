const express = require("express");
const router = express.Router();
const Opportunity = require("../models/Opportunity");

router.post("/parse", async (req, res) => {
  try {
    const emailText = req.body.email;
    if (!emailText) return res.status(400).json({ message: "Email text is required" });

    const extract = (regex) => {
      const match = emailText.match(regex);
      return match ? match[1].trim() : null;
    };

    const companyName = extract(/(?:Company Name|Company)\s*:\s*(.*)/i);
    const role        = extract(/(?:Role|Job Profile|Position)\s*:\s*(.*)/i);
    const stipend     = extract(/(?:Stipend|CTC|Salary|Package)\s*:\s*(.*)/i);
    const deadlineStr = extract(/(?:Deadline|Last Date|Date)\s*:\s*(.*)/i);

    // Required field validation — don't save garbage to DB
    if (!companyName || !role) {
      return res.status(422).json({
        message: "Could not parse Company Name or Role from email. Please check the format."
      });
    }

    const linkMatch = emailText.match(/(https?:\/\/[^\s]+)/g);

    const opportunity = new Opportunity({
      companyName,
      role,
      stipend:          stipend     || undefined,
      deadline:         deadlineStr ? new Date(deadlineStr) : undefined,
      registrationLink: linkMatch   ? linkMatch[0]          : "#",
      sourceEmail:      emailText.substring(0, 2000) // cap at 2000 chars (B-20)
    });

    await opportunity.save();
    res.json({ message: "Success", data: opportunity });
  } catch (err) {
    res.status(500).json({ message: "Server error while parsing email" });
  }
});

module.exports = router;
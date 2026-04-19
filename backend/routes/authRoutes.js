const express  = require("express");
const router   = express.Router();
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const Student  = require("../models/Student");

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, cgpa, branch, year, skills } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "Name, email and password are required" });

    const existing = await Student.findOne({ email });
    if (existing)
      return res.status(409).json({ message: "Email already registered" });

    const hashed  = await bcrypt.hash(password, 10);
    const student = await Student.create({
      name, email, password: hashed,
      cgpa: cgpa || 0,
      branch: branch || "",
      year:   year   || 1,
      skills: skills ? skills.split(",").map(s => s.trim()) : []
    });

    const token = jwt.sign(
      { id: student._id, role: student.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      student: { id: student._id, name: student.name, email: student.email, role: student.role }
    });
  } catch (err) {
    res.status(500).json({ message: "Registration failed" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const student = await Student.findOne({ email });
    if (!student)
      return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, student.password);
    if (!match)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: student._id, role: student.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      student: { id: student._id, name: student.name, email: student.email, role: student.role }
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
});

// GET /api/auth/profile  (protected)
router.get("/profile", require("../middleware/auth"), async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select("-password");
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// PUT /api/auth/profile  (protected)
router.put("/profile", require("../middleware/auth"), async (req, res) => {
  try {
    const { name, email, cgpa, branch, year, skills } = req.body;
    const updated = await Student.findByIdAndUpdate(
      req.user.id,
      {
        name, email, cgpa, branch, year,
        skills: typeof skills === "string"
          ? skills.split(",").map(s => s.trim())
          : skills
      },
      { new: true, runValidators: true }
    ).select("-password");

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile" });
  }
});

module.exports = router;
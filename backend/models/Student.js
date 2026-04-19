const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  cgpa: {
    type: Number,
    default: 0
  },

  skills: {
    type: [String],
    default: []
  },

  branch: {
    type: String
  },

  year: {
    type: Number
  },

  role: {
    type: String,
    enum: ["student", "admin"],
    default: "student"
  }
}, { timestamps: true });

module.exports = mongoose.model("Student", studentSchema);
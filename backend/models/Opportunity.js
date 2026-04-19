const mongoose = require("mongoose");

const opportunitySchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true
  },

  role: {
    type: String,
    required: true
  },

  description: {
    type: String
  },

  eligibilityCGPA: {
    type: Number
  },

  branchAllowed: {
    type: [String]
  },

  stipend: {
    type: String
  },

  duration: {
    type: String
  },

  deadline: {
    type: Date
  },

  registrationLink: {
    type: String
  },

  sourceEmail: {
    type: String
  }

}, { timestamps: true });

module.exports = mongoose.model("Opportunity", opportunitySchema);
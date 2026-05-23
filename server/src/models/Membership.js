const mongoose = require("mongoose");

const membershipSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    role: {
      type: String,
      enum: ["OWNER", "ADMIN", "MANAGER", "DEVELOPER", "VIEWER"],
      default: "VIEWER",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Membership", membershipSchema);
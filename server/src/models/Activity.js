const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    action: {
      type: String,
      required: true,
    }, // "TASK_CREATED", "TASK_MOVED", etc.

    entityType: {
      type: String,
      required: true,
    }, // "TASK", "PROJECT"

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    before: Object,
    after: Object,

    metadata: Object,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Activity", activitySchema);
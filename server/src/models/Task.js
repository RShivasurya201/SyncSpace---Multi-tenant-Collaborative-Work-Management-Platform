const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
      required: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: String,

    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    status: {
      type: String,
      enum: [
        "BACKLOG",
        "IN_PROGRESS",
        "REVIEW",
        "DONE",
      ],
      default: "BACKLOG",
    },

    priority: {
      type: String,
      enum: [
        "LOW",
        "MEDIUM",
        "HIGH",
      ],
      default: "MEDIUM",
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    dueDate: Date,

    isDeleted: {
      type: Boolean,
      default: false,
    },

    tags: [String],

    attachments: [String],

    // comments system

    comments: [commentSchema],

    // blocker intelligence

    isBlocked: {
      type: Boolean,
      default: false,
    },

    blockerSummary: {
      type: String,
      default: "",
    },

    blockerType: {
      type: String,

      enum: [
        "DEPENDENCY",
        "CLIENT",
        "RESOURCE",
        "UNCLEAR",
        "OTHER",
      ],

      default: "OTHER",
    },
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Task", taskSchema);
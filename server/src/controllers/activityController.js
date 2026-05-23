const Activity = require("../models/Activity");

// GET ACTIVITY LOGS FOR PROJECT
exports.getProjectActivity = async (req, res) => {
  try {
    const { projectId } = req.params;

    const activities = await Activity.find({
      project: projectId,
      organization: req.organizationId,
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(activities);

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch activity logs",
      error: error.message,
    });
  }
};
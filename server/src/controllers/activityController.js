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

exports.getActivitySummary = async (req, res) => {
  try {
    const now = new Date();
    const dayIndex = now.getDay();
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() - ((dayIndex + 6) % 7));

    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const counts = weekDays.map(() => 0);

    const activities = await Activity.find({
      organization: req.organizationId,
      createdAt: { $gte: monday },
    });

    activities.forEach((activity) => {
      const createdAt = new Date(activity.createdAt);
      const diff = Math.floor((createdAt - monday) / (1000 * 60 * 60 * 24));
      if (diff >= 0 && diff < 7) {
        counts[diff] += 1;
      }
    });

    const summary = weekDays.map((day, index) => ({
      day,
      count: counts[index],
    }));

    res.json(summary);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch activity summary",
      error: error.message,
    });
  }
};
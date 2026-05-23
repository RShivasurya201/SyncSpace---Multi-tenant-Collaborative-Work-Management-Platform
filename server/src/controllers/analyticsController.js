const Task = require("../models/Task");

exports.getProjectAnalytics = async (req, res) => {
  try {
    const { projectId } = req.params;

    const tasks = await Task.find({
      project: projectId,
      organization: req.organizationId,
      isDeleted: false,
    });

    const totalTasks = tasks.length;

    const completedTasks = tasks.filter(t => t.status === "DONE").length;

    const inProgressTasks = tasks.filter(
      t => t.status === "IN_PROGRESS"
    ).length;

    const backlogTasks = tasks.filter(
      t => t.status === "BACKLOG"
    ).length;

    const reviewTasks = tasks.filter(
      t => t.status === "REVIEW"
    ).length;

    const overdueTasks = tasks.filter(
      t => t.dueDate && new Date(t.dueDate) < new Date()
    ).length;

    res.json({
      totalTasks,
      completedTasks,
      inProgressTasks,
      backlogTasks,
      reviewTasks,
      overdueTasks,
    });

  } catch (error) {
    res.status(500).json({
      message: "Analytics fetch failed",
      error: error.message,
    });
  }
};
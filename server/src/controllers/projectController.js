const Project = require("../models/Project");
const Activity = require("../models/Activity");
const Task = require("../models/Task");

// CREATE PROJECT
exports.createProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    const project = await Project.create({
      name,
      description,
      organization: req.organizationId,
      createdBy: req.user._id,
      members: [req.user._id],
    });

    await Activity.create({
      organization: req.organizationId,
      project: project._id,
      user: req.user._id,
      action: "PROJECT_CREATED",
      entityType: "PROJECT",
      entityId: project._id,
      after: { name: project.name },
    });

    res.status(201).json(project);

  } catch (error) {
    res.status(500).json({ message: "Create project failed", error });
  }
};


// GET PROJECT SNAPSHOT (state as of a given time)
exports.getProjectSnapshot = async (req, res) => {
  try {
    const { projectId } = req.params;
    const asOfParam = req.query.asOf;

    const project = await Project.findOne({
      _id: projectId,
      organization: req.organizationId,
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // If no asOf provided, return live tasks
    if (!asOfParam) {
      const tasks = await Task.find({
        project: projectId,
        organization: req.organizationId,
        isDeleted: false,
      }).populate("assignedTo", "name email");

      return res.json({ projectCreatedAt: project.createdAt, tasks });
    }

    const asOf = new Date(asOfParam);
    if (isNaN(asOf.getTime())) {
      return res.status(400).json({ message: "Invalid asOf date" });
    }

    // Fetch all activities for the project up to the requested time
    const activities = await Activity.find({
      project: projectId,
      organization: req.organizationId,
      createdAt: { $lte: asOf },
    }).sort({ createdAt: 1 });

    // Reconstruct tasks by replaying activities
    const taskMap = new Map();

    for (const act of activities) {
      if (String(act.entityType).toUpperCase() !== "TASK") continue;

      const id = String(act.entityId);
      const action = (act.action || "").toUpperCase();

      if (action === "TASK_CREATED") {
        const after = act.after || {};
        taskMap.set(id, {
          _id: id,
          title: after.title || "Untitled",
          status: after.status || "BACKLOG",
          dueDate: after.dueDate || null,
          assignedTo: after.assignedTo || null,
          isBlocked: after.isBlocked || false,
        });
      }

      if (!taskMap.has(id)) {
        // If we haven't seen creation for this task within the timeframe, skip updates
        continue;
      }

      const task = taskMap.get(id);

      if (action === "TASK_STATUS_CHANGED") {
        if (act.after && act.after.status !== undefined) {
          task.status = act.after.status;
        }
      }

      if (action === "TASK_ASSIGNED") {
        if (act.after && act.after.assignedTo !== undefined) {
          task.assignedTo = act.after.assignedTo;
        }
      }

      if (action === "COMMENT_ADDED") {
        // Comments don't change kanban columns directly. ignore for now.
      }

      // store back
      taskMap.set(id, task);
    }

    // Convert to array and populate assigned user names
    const tasksArray = Array.from(taskMap.values());

    // Populate assignedTo user names when present
    const userIds = tasksArray
      .map((t) => t.assignedTo)
      .filter((v) => v)
      .map((v) => String(v));

    let users = [];
    if (userIds.length > 0) {
      const User = require("../models/User");
      users = await User.find({ _id: { $in: userIds } }).select("name");
    }

    const userMap = new Map(users.map((u) => [String(u._id), u]));

    const snapshotTasks = tasksArray.map((t) => ({
      ...t,
      assignedTo: t.assignedTo ? (userMap.get(String(t.assignedTo)) || t.assignedTo) : null,
    }));

    res.json({ projectCreatedAt: project.createdAt, tasks: snapshotTasks });

  } catch (error) {
    res.status(500).json({ message: "Failed to build project snapshot", error: error.message });
  }
};

// GET ALL PROJECTS (org scoped)
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      organization: req.organizationId,
    }).populate("createdBy", "name email");

    res.json(projects);

  } catch (error) {
    res.status(500).json({ message: "Fetch projects failed", error });
  }
};


// UPDATE PROJECT
exports.updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description } = req.body;

    const project = await Project.findOne({
      _id: projectId,
      organization: req.organizationId,
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const before = { name: project.name, description: project.description };

    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;

    await project.save();

    await Activity.create({
      organization: req.organizationId,
      project: project._id,
      user: req.user._id,
      action: "PROJECT_UPDATED",
      entityType: "PROJECT",
      entityId: project._id,
      before,
      after: { name: project.name, description: project.description },
    });

    res.json(project);

  } catch (error) {
    res.status(500).json({ message: "Update project failed", error });
  }
};


// DELETE PROJECT
exports.deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findOne({
      _id: projectId,
      organization: req.organizationId,
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    await Task.deleteMany({ project: projectId, organization: req.organizationId });
    await Activity.deleteMany({ project: projectId, organization: req.organizationId });
    await project.deleteOne();

    res.json({ message: "Project deleted" });

  } catch (error) {
    res.status(500).json({ message: "Delete project failed", error });
  }
};
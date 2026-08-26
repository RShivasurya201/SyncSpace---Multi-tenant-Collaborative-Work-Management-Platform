const Task = require("../models/Task");
const Project = require("../models/Project");
const Activity = require("../models/Activity");
const Membership = require("../models/Membership");
const Notification = require("../models/Notification");

// CREATE TASK
exports.createTask = async (req, res) => {
  try {
    const { title, description, projectId } = req.body;
    const dueDate = req.body.dueDate || req.body.due_date || req.body.deadline;
    const parsedDueDate = dueDate ? new Date(dueDate) : undefined;
    const dueDateValue = parsedDueDate instanceof Date && !isNaN(parsedDueDate)
      ? parsedDueDate
      : undefined;

    const project = await Project.findOne({
      _id: projectId,
      organization: req.organizationId,
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const task = await Task.create({
      title,
      description,
      project: projectId,
      organization: req.organizationId,
      createdBy: req.user._id,
      dueDate: dueDateValue,
    });

    // activity log
    await Activity.create({
      organization: req.organizationId,
      project: projectId,
      user: req.user._id,
      action: "TASK_CREATED",
      entityType: "TASK",
      entityId: task._id,
      after: {
        title: task.title,
        status: task.status,
        dueDate: task.dueDate,
      },
    });

    res.status(201).json(task);

  } catch (error) {
    res.status(500).json({ message: "Create task failed", error });
  }
};



// GET TASKS (per project)
exports.getTasks = async (req, res) => {
  try {
    const { projectId } = req.params;

    const tasks = await Task.find({
      project: projectId,
      organization: req.organizationId,
      isDeleted: false,
    }).populate("assignedTo", "name email")
     .populate("createdBy", "name email")
     .populate("comments.user", "name email");

    res.json(tasks);

  } catch (error) {
    res.status(500).json({ message: "Fetch tasks failed", error });
  }
};

// GET SINGLE TASK
exports.getTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findOne({
      _id: taskId,
      organization: req.organizationId,
      isDeleted: false,
    }).populate("assignedTo", "name email")
     .populate("createdBy", "name email")
     .populate("comments.user", "name email");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);

  } catch (error) {
    res.status(500).json({ message: "Fetch task failed", error });
  }
};



// UPDATE TASK STATUS (KANBAN)
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const task = await Task.findOne({
      _id: req.params.taskId,
      organization: req.organizationId,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const oldStatus = task.status;

    task.status = status;
    await task.save();

    // activity log
    await Activity.create({
      organization: req.organizationId,
      project: task.project,
      user: req.user._id,
      action: "TASK_STATUS_CHANGED",
      entityType: "TASK",
      entityId: task._id,
      before: { status: oldStatus },
      after: { status: task.status },
    });

    res.json(task);

  } catch (error) {
    res.status(500).json({ message: "Update status failed", error });
  }
};

// UPDATE TASK DETAILS
exports.updateTask = async (req, res) => {
  try {
    const { title, description, priority } = req.body;
    const task = await Task.findOne({
      _id: req.params.taskId,
      organization: req.organizationId,
      isDeleted: false,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (title !== undefined) {
      if (!String(title).trim()) {
        return res.status(400).json({ message: "Task title is required" });
      }
      task.title = String(title).trim();
    }
    if (description !== undefined) task.description = description;
    if (priority !== undefined) {
      const normalizedPriority = String(priority).trim().toUpperCase();
      if (!["LOW", "MEDIUM", "HIGH"].includes(normalizedPriority)) {
        return res.status(400).json({ message: "Invalid task priority" });
      }
      task.priority = normalizedPriority;
    }

    await task.save();

    await Activity.create({
      organization: req.organizationId,
      project: task.project,
      user: req.user._id,
      action: "TASK_UPDATED",
      entityType: "TASK",
      entityId: task._id,
      after: {
        title: task.title,
        description: task.description,
        priority: task.priority,
      },
    });

    const updatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("comments.user", "name email");

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: "Update task failed", error: error.message });
  }
};

// DELETE TASK
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.taskId,
      organization: req.organizationId,
      isDeleted: false,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.isDeleted = true;
    await task.save();

    await Activity.create({
      organization: req.organizationId,
      project: task.project,
      user: req.user._id,
      action: "TASK_DELETED",
      entityType: "TASK",
      entityId: task._id,
      before: { title: task.title, description: task.description },
    });

    res.json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ message: "Delete task failed", error: error.message });
  }
};





// ASSIGN TASK
exports.assignTask = async (req, res) => {
  try {
    const { userId } = req.body;

    // 1️⃣ Find task (org scoped)
    const task = await Task.findOne({
      _id: req.params.taskId,
      organization: req.organizationId,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // 2️⃣ Validate user belongs to same organization
    const membership = await Membership.findOne({
      user: userId,
      organization: req.organizationId,
    });

    if (!membership) {
      return res.status(400).json({
        message: "User is not part of this organization",
      });
    }

    // 3️⃣ Store old value (for activity log)
    const oldAssigned = task.assignedTo;

    // 4️⃣ Update assignment
    task.assignedTo = userId;
    await task.save();

    // 5️⃣ Activity log
    await Activity.create({
      organization: req.organizationId,
      project: task.project,
      user: req.user._id,
      action: "TASK_ASSIGNED",
      entityType: "TASK",
      entityId: task._id,
      before: { assignedTo: oldAssigned },
      after: { assignedTo: userId },
    });

    // 6️⃣ Create notification (DB)
    const notification = await Notification.create({
      user: userId,
      message: `You have been assigned a task: ${task.title}`,
      type: "TASK_ASSIGNED",
    });

    // 7️⃣ Emit real-time notification
    const io = req.app.get("io");

    if (io) {
      io.to(userId.toString()).emit("notification", {
        message: notification.message,
        type: notification.type,
      });
    }

    // 8️⃣ Return updated task
    res.json(task);

  } catch (error) {
    res.status(500).json({
      message: "Assign task failed",
      error: error.message,
    });
  }
};
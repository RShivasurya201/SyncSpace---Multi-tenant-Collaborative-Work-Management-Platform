const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");

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

// Get dashboard-wide analytics
exports.getDashboardAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const organizationId = req.organizationId;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all projects in organization
    const projects = await Project.find({ organization: organizationId });
    const projectIds = projects.map(p => p._id);

    // Get all tasks in organization
    const allTasks = await Task.find({
      organization: organizationId,
      isDeleted: false,
    }).populate('assignedTo', 'name');

    // Project Activity - Daily cumulative totals for projects and tasks
    const activityData = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      // total projects created up to this day
      const projectsUpToDay = projects.filter(p => new Date(p.createdAt) <= dayEnd).length;

      // total tasks created up to this day (exclude deleted)
      const tasksUpToDay = allTasks.filter(t => new Date(t.createdAt) <= dayEnd).length;

      activityData.push({
        date: date.toISOString().split('T')[0],
        totalProjects: projectsUpToDay,
        totalTasks: tasksUpToDay,
      });
    }

    const activityDataArray = activityData;

    // Projects by Status
    // Projects by Status: completed (all tasks DONE), blocked (any task isBlocked), inProgress (the rest)
    const projectsByStatus = {
      completed: 0,
      inProgress: 0,
      blocked: 0,
    };

    projects.forEach(project => {
      const projectTasks = allTasks.filter(t => t.project.toString() === project._id.toString());

      if (projectTasks.length === 0) {
        // no tasks -> consider inProgress (not completed nor blocked)
        projectsByStatus.inProgress++;
        return;
      }

      const hasBlocked = projectTasks.some(t => t.isBlocked === true);
      if (hasBlocked) {
        projectsByStatus.blocked++;
        return;
      }

      const allDone = projectTasks.every(t => t.status === 'DONE');
      if (allDone) {
        projectsByStatus.completed++;
      } else {
        projectsByStatus.inProgress++;
      }
    });

    // Tasks by Priority
    const tasksByPriority = {
      high: allTasks.filter(t => t.priority === "HIGH").length,
      medium: allTasks.filter(t => t.priority === "MEDIUM").length,
      low: allTasks.filter(t => t.priority === "LOW").length,
    };

    const totalTasks = tasksByPriority.high + tasksByPriority.medium + tasksByPriority.low;
    // if (totalTasks > 0) {
    //   tasksByPriority.high = Math.round(totalTasks * 0.30);
    //   tasksByPriority.medium = Math.round(totalTasks * 0.50);
    //   tasksByPriority.low = totalTasks - tasksByPriority.high - tasksByPriority.medium;
    // }

    // Top Projects
    const projectStats = projects.map(project => {
      const projectTasks = allTasks.filter(t => t.project.toString() === project._id.toString());
      return {
        name: project.name,
        taskCount: projectTasks.length,
      };
    }).sort((a, b) => b.taskCount - a.taskCount).slice(0, 4);

    // Tasks by Status for each assignee (team members)
    const tasksByMember = {};
    allTasks.forEach(task => {
      if (task.assignedTo) {
        const memberName = task.assignedTo.name;
        if (!tasksByMember[memberName]) {
          tasksByMember[memberName] = {
            name: memberName,
            toDo: 0,
            inProgress: 0,
            review: 0,
            done: 0,
          };
        }
        
        switch (task.status) {
          case 'BACKLOG':
            tasksByMember[memberName].toDo++;
            break;
          case 'IN_PROGRESS':
            tasksByMember[memberName].inProgress++;
            break;
          case 'REVIEW':
            tasksByMember[memberName].review++;
            break;
          case 'DONE':
            tasksByMember[memberName].done++;
            break;
          default:
            break;
        }
      }
    });

    const tasksByMemberArray = Object.values(tasksByMember).slice(0, 3);

    res.json({
      projectActivity: activityDataArray,
      projectsByStatus,
      tasksByPriority,
      topProjects: projectStats,
      tasksByMember: tasksByMemberArray,
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      message: "Analytics fetch failed",
      error: error.message,
    });
  }
};
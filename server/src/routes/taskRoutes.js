const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const orgMiddleware = require("../middleware/orgMiddleware");
const checkPermission = require("../middleware/checkPermission");

const {
  createTask,
  getTasks,
  getTask,
  updateTaskStatus,
  assignTask,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");


// CREATE TASK
router.post(
  "/",
  authMiddleware,
  orgMiddleware,
  checkPermission("CREATE_TASK"),
  createTask
);

// GET TASKS
router.get(
  "/:projectId",
  authMiddleware,
  orgMiddleware,
  getTasks
);

// GET SINGLE TASK
router.get(
  "/task/:taskId",
  authMiddleware,
  orgMiddleware,
  getTask
);

// UPDATE STATUS
router.patch(
  "/:taskId/status",
  authMiddleware,
  orgMiddleware,
  checkPermission("UPDATE_TASK"),
  updateTaskStatus
);

router.put(
  "/:taskId",
  authMiddleware,
  orgMiddleware,
  checkPermission("UPDATE_TASK"),
  updateTask
);

router.delete(
  "/:taskId",
  authMiddleware,
  orgMiddleware,
  checkPermission("MANAGE_PROJECT"),
  deleteTask
);

// ASSIGN TASK
router.patch(
  "/:taskId/assign",
  authMiddleware,
  orgMiddleware,
  checkPermission("ASSIGN_TASK"),
  assignTask
);

module.exports = router;
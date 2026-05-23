const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const orgMiddleware = require("../middleware/orgMiddleware");
const checkPermission = require("../middleware/checkPermission");

const {
  createTask,
  getTasks,
  updateTaskStatus,
  assignTask,
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

// UPDATE STATUS
router.patch(
  "/:taskId/status",
  authMiddleware,
  orgMiddleware,
  checkPermission("CREATE_TASK"),
  updateTaskStatus
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
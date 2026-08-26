const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const orgMiddleware = require("../middleware/orgMiddleware");
const checkPermission = require("../middleware/checkPermission");

const {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
  getProjectSnapshot,
} = require("../controllers/projectController");

// CREATE PROJECT
router.post(
  "/",
  authMiddleware,
  orgMiddleware,
  checkPermission("MANAGE_PROJECT"),
  createProject
);

// GET PROJECTS
router.get(
  "/",
  authMiddleware,
  orgMiddleware,
  getProjects
);

// GET PROJECT SNAPSHOT (time travel)
router.get(
  "/:projectId/snapshot",
  authMiddleware,
  orgMiddleware,
  getProjectSnapshot
);

// UPDATE PROJECT
router.put(
  "/:projectId",
  authMiddleware,
  orgMiddleware,
  checkPermission("MANAGE_PROJECT"),
  updateProject
);

// DELETE PROJECT
router.delete(
  "/:projectId",
  authMiddleware,
  orgMiddleware,
  checkPermission("MANAGE_PROJECT"),
  deleteProject
);

module.exports = router;
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const orgMiddleware = require("../middleware/orgMiddleware");
const checkPermission = require("../middleware/checkPermission");

const {
  createProject,
  getProjects,
} = require("../controllers/projectController");

// CREATE PROJECT
router.post(
  "/",
  authMiddleware,
  orgMiddleware,
  checkPermission("CREATE_PROJECT"),
  createProject
);

// GET PROJECTS
router.get(
  "/",
  authMiddleware,
  orgMiddleware,
  getProjects
);

module.exports = router;
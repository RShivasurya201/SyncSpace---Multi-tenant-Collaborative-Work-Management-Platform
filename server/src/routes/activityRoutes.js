const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const orgMiddleware = require("../middleware/orgMiddleware");

const {
  getProjectActivity,
  getActivitySummary,
} = require("../controllers/activityController");

router.get(
  "/summary",
  authMiddleware,
  orgMiddleware,
  getActivitySummary
);

router.get(
  "/:projectId",
  authMiddleware,
  orgMiddleware,
  getProjectActivity
);

module.exports = router;
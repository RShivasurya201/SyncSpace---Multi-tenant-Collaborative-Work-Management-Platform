const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const orgMiddleware = require("../middleware/orgMiddleware");

const {
  getProjectAnalytics,
} = require("../controllers/analyticsController");

router.get(
  "/:projectId",
  authMiddleware,
  orgMiddleware,
  getProjectAnalytics
);

module.exports = router;
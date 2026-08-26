const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const orgMiddleware = require("../middleware/orgMiddleware");
const checkPermission = require("../middleware/checkPermission");

const {
  getProjectAnalytics,
  getDashboardAnalytics,
} = require("../controllers/analyticsController");

router.get(
  "/dashboard/overview",
  authMiddleware,
  orgMiddleware,
  checkPermission("VIEW_ANALYTICS"),
  getDashboardAnalytics
);

router.get(
  "/:projectId",
  authMiddleware,
  orgMiddleware,
  checkPermission("VIEW_ANALYTICS"),
  getProjectAnalytics
);

module.exports = router;
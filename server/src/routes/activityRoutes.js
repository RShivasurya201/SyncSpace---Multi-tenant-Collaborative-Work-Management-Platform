const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const orgMiddleware = require("../middleware/orgMiddleware");

const {
  getProjectActivity,
} = require("../controllers/activityController");

router.get(
  "/:projectId",
  authMiddleware,
  orgMiddleware,
  getProjectActivity
);

module.exports = router;
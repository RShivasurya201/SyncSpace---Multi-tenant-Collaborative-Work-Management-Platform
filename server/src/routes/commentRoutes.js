const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const orgMiddleware = require("../middleware/orgMiddleware");
const checkPermission = require("../middleware/checkPermission");

const { addComment, toggleBlocked } = require("../controllers/commentController");

router.post(
  "/:taskId",
  authMiddleware,
  orgMiddleware,
  checkPermission("COMMENT_TASK"),
  addComment
);

router.patch(
  "/:taskId/block",
  authMiddleware,
  orgMiddleware,
  checkPermission("BLOCK_TASK"),
  toggleBlocked
);

module.exports = router;
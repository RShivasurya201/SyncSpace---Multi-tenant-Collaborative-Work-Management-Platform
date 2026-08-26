const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const orgMiddleware = require("../middleware/orgMiddleware");
const checkPermission = require("../middleware/checkPermission");

const {
  addMember,
  getMembers,
  updateMemberRole,
  removeMember,
} = require("../controllers/orgController");

router.post(
  "/add-member",
  authMiddleware,
  orgMiddleware,
  checkPermission("MANAGE_MEMBERS"),
  addMember
);

router.get(
  "/members",
  authMiddleware,
  orgMiddleware,
  checkPermission("VIEW"),
  getMembers
);

router.patch(
  "/members/:memberId/role",
  authMiddleware,
  orgMiddleware,
  checkPermission("MANAGE_MEMBERS"),
  updateMemberRole
);

router.delete(
  "/members/:memberId",
  authMiddleware,
  orgMiddleware,
  checkPermission("MANAGE_MEMBERS"),
  removeMember
);

module.exports = router;
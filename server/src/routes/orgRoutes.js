const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const orgMiddleware = require("../middleware/orgMiddleware");

const {
  addMember,
  getMembers,
  updateMemberRole,
  removeMember,
} = require("../controllers/orgController");

// existing route
router.post("/add-member", authMiddleware, orgMiddleware, addMember);

// ✅ NEW ROUTES
router.get("/members", authMiddleware, orgMiddleware, getMembers);

router.patch(
  "/members/:memberId/role",
  authMiddleware,
  orgMiddleware,
  updateMemberRole
);

router.delete(
  "/members/:memberId",
  authMiddleware,
  orgMiddleware,
  removeMember
);
module.exports = router;
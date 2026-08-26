const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const orgMiddleware = require("../middleware/orgMiddleware");
const checkPermission = require("../middleware/checkPermission");

const {
  createInvite,
  acceptInvite,
  getPendingInvites,
} = require("../controllers/inviteController");

router.get(
  "/pending",
  authMiddleware,
  orgMiddleware,
  checkPermission("INVITE_MEMBER"),
  getPendingInvites
);

router.post(
  "/",
  authMiddleware,
  orgMiddleware,
  checkPermission("INVITE_MEMBER"),
  createInvite
);

router.post(
  "/accept",
  authMiddleware,
  acceptInvite
);

module.exports = router;
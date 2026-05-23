const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const orgMiddleware = require("../middleware/orgMiddleware");

const {
  createInvite,
  acceptInvite,
} = require("../controllers/inviteController");


router.post(
  "/",
  authMiddleware,
  orgMiddleware,
  createInvite
);


router.post(
  "/accept",
  authMiddleware,
  acceptInvite
);

module.exports = router;
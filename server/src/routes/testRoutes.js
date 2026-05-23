const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const orgMiddleware = require("../middleware/orgMiddleware");
const checkPermission = require("../middleware/checkPermission");

router.get(
  "/test",
  authMiddleware,
  orgMiddleware,
  checkPermission("CREATE_PROJECT"),
  (req, res) => {
    res.json({
      message: "You are allowed",
      role: req.role,
      organization: req.organizationId,
    });
  }
);

module.exports = router;
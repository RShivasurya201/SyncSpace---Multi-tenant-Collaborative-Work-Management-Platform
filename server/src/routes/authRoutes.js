const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const Membership = require("../models/Membership");

const { signup, login } = require("../controllers/authController");

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const orgId = req.headers["x-organization-id"];
    let membership = null;

    if (orgId) {
      membership = await Membership.findOne({
        user: req.user._id,
        organization: orgId,
      }).populate("organization");
    }

    const user = req.user.toObject ? req.user.toObject() : req.user;

    res.json({
      user,
      membership: membership
        ? {
            role: membership.role,
            organization: {
              _id: membership.organization?._id,
              name: membership.organization?.name,
            },
          }
        : null,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load profile", error: error.message });
  }
});

module.exports = router;
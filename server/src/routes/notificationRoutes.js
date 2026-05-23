const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const Notification = require("../models/Notification");

// GET notifications
router.get("/", authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(notifications);

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notifications", error });
  }
});

module.exports = router;
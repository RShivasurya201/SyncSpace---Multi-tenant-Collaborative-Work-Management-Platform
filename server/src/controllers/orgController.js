const Membership = require("../models/Membership");
const User = require("../models/User");

exports.addMember = async (req, res) => {
  try {
    const { userId, role } = req.body;

    // 1️⃣ Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2️⃣ Check if already a member
    const existing = await Membership.findOne({
      user: userId,
      organization: req.organizationId,
    });

    if (existing) {
      return res.status(400).json({
        message: "User already part of this organization",
      });
    }

    // 3️⃣ Create membership
    const membership = await Membership.create({
      user: userId,
      organization: req.organizationId,
      role: role || "DEVELOPER",
    });

    res.status(201).json({
      message: "User added successfully",
      membership,
    });

  } catch (error) {
    res.status(500).json({
      message: "Add member failed",
      error: error.message,
    });
  }
};

//  GET ALL MEMBERS OF AN ORGANIZATION
exports.getMembers = async (req, res) => {
  try {
    const members = await Membership.find({
      organization: req.organizationId,
    })
      .populate("user", "name email")
      .select("user role");

    res.json(members);

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch members",
      error: error.message,
    });
  }
};



// UPDATE MEMBER ROLE
exports.updateMemberRole = async (req, res) => {
  try {
    const { role } = req.body;

    const membership = await Membership.findById(req.params.memberId);

    if (!membership) {
      return res.status(404).json({ message: "Membership not found" });
    }

    // ensure same organization
    if (membership.organization.toString() !== req.organizationId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    membership.role = role;
    await membership.save();

    res.json({ message: "Role updated", membership });

  } catch (error) {
    res.status(500).json({
      message: "Update role failed",
      error: error.message,
    });
  }
};



// REMOVE MEMBER
exports.removeMember = async (req, res) => {
  try {
    const membership = await Membership.findById(req.params.memberId);

    if (!membership) {
      return res.status(404).json({ message: "Membership not found" });
    }

    if (membership.organization.toString() !== req.organizationId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await membership.deleteOne();

    res.json({ message: "Member removed" });

  } catch (error) {
    res.status(500).json({
      message: "Remove member failed",
      error: error.message,
    });
  }
};
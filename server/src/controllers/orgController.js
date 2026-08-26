const Membership = require("../models/Membership");
const User = require("../models/User");
const Task = require("../models/Task");
const Organization = require("../models/Organization");
const { hasPermission, normalizeRoleName, ALLOWED_MEMBER_ROLES } = require("../rbac/permissions");

const isValidRole = (role) => {
  const normalized = normalizeRoleName(role);
  return normalized === "OWNER" || ALLOWED_MEMBER_ROLES.includes(normalized);
};

exports.addMember = async (req, res) => {
  try {
    const { userId, role } = req.body;

    if (!hasPermission(req.role, "MANAGE_MEMBERS")) {
      return res.status(403).json({ message: "Permission denied" });
    }

    const normalizedRole = normalizeRoleName(role || "VIEWER");
    if (normalizedRole === "OWNER" && req.role !== "OWNER") {
      return res.status(403).json({ message: "Only the owner can assign the OWNER role" });
    }

    if (!isValidRole(normalizedRole)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existing = await Membership.findOne({
      user: userId,
      organization: req.organizationId,
    });

    if (existing) {
      return res.status(400).json({
        message: "User already part of this organization",
      });
    }

    const membership = await Membership.create({
      user: userId,
      organization: req.organizationId,
      role: normalizedRole,
    });

    const org = await Organization.findById(req.organizationId).lean();
    if (!org?.owner && normalizedRole === "OWNER") {
      await Organization.findByIdAndUpdate(req.organizationId, { owner: userId });
    }

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

    const tasks = await Task.find({
      organization: req.organizationId,
      isDeleted: false,
      assignedTo: { $ne: null },
    }).select("assignedTo status isBlocked");

    const taskCounts = tasks.reduce((acc, task) => {
      const assignedToId = task.assignedTo?.toString();
      if (!assignedToId) return acc;

      const current = acc[assignedToId] || {
        active: 0,
        completed: 0,
        blocked: 0,
      };

      const isCompleted = task.status === "DONE";
      const isBlocked = Boolean(task.isBlocked);
      const isActive = !isCompleted && !isBlocked;

      if (isActive) current.active += 1;
      if (isCompleted) current.completed += 1;
      if (isBlocked) current.blocked += 1;

      acc[assignedToId] = current;
      return acc;
    }, {});

    const membersWithCounts = members.map((member) => {
      const memberId = member.user?._id?.toString();
      const counts = taskCounts[memberId] || {
        active: 0,
        completed: 0,
        blocked: 0,
      };
      return {
        ...member.toObject(),
        activeTasks: counts.active,
        completedTasks: counts.completed,
        blockedTasks: counts.blocked,
      };
    });

    res.json(membersWithCounts);

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

    if (!hasPermission(req.role, "MANAGE_MEMBERS")) {
      return res.status(403).json({ message: "Permission denied" });
    }

    const membership = await Membership.findById(req.params.memberId);

    if (!membership) {
      return res.status(404).json({ message: "Membership not found" });
    }

    if (membership.organization.toString() !== req.organizationId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (membership.role === "OWNER") {
      return res.status(403).json({ message: "The organization owner cannot be demoted or removed." });
    }

    const normalizedRole = normalizeRoleName(role);
    if (normalizedRole === "OWNER" && req.role !== "OWNER") {
      return res.status(403).json({ message: "Only the owner can assign the OWNER role." });
    }

    if (!isValidRole(normalizedRole)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    membership.role = normalizedRole;
    await membership.save();

    if (normalizedRole === "OWNER") {
      await Organization.findByIdAndUpdate(req.organizationId, { owner: membership.user });
    }

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
    if (!hasPermission(req.role, "MANAGE_MEMBERS")) {
      return res.status(403).json({ message: "Permission denied" });
    }

    const membership = await Membership.findById(req.params.memberId);

    if (!membership) {
      return res.status(404).json({ message: "Membership not found" });
    }

    if (membership.organization.toString() !== req.organizationId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (membership.role === "OWNER") {
      return res.status(403).json({ message: "The organization owner cannot be removed." });
    }

    const ownerCount = await Membership.countDocuments({
      organization: req.organizationId,
      role: "OWNER",
    });

    if (ownerCount === 0) {
      return res.status(400).json({ message: "Organization must have at least one owner." });
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
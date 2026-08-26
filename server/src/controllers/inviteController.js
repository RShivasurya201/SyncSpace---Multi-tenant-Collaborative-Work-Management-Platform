const crypto = require("crypto");

const Invite = require("../models/Invite");
const Membership = require("../models/Membership");
const Activity = require("../models/Activity");
const Organization = require("../models/Organization");
const { hasPermission, normalizeRoleName, ALLOWED_MEMBER_ROLES } = require("../rbac/permissions");
const { sendInviteEmail } = require("../services/mailService");

exports.createInvite = async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!hasPermission(req.role, "INVITE_MEMBER")) {
      return res.status(403).json({
        message: "Only owner/admin can invite",
      });
    }

    const normalizedRole = normalizeRoleName(role);
    if (!ALLOWED_MEMBER_ROLES.includes(normalizedRole)) {
      return res.status(400).json({
        message: "Invalid invite role",
      });
    }

    const duplicate = await Membership.findOne({
      organization: req.organizationId,
    }).populate({
      path: "user",
      match: { email },
    });

    if (duplicate?.user) {
      return res.status(400).json({
        message: "User already member",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    const invite = await Invite.create({
      email,
      organization: req.organizationId,
      role: normalizedRole,
      invitedBy: req.user._id,
      token,
      expiresAt: expires,
    });

    const organization = await Organization.findById(req.organizationId);

    try {
      await sendInviteEmail(
        email,
        organization?.name || "your workspace",
        req.user.name,
        token
      );
    } catch (error) {
      console.warn("Invite email delivery failed, continuing without email.", error.message);
    }
    await Activity.create({
      organization: req.organizationId,
      user: req.user._id,
      action: "INVITE_CREATED",
      entityType: "INVITE",
      entityId: invite._id,

      after: {
        email,
        role,
      },
    });

    res.json({
      message: "Invite created",
      invite,
    });

  } catch (error) {
    res.status(500).json({
      message: "Invite failed",
      error: error.message,
    });
  }
};

exports.getPendingInvites = async (req, res) => {
  try {
    const invites = await Invite.find({
      organization: req.organizationId,
      status: "PENDING",
    })
      .populate("invitedBy", "name email")
      .select("email role invitedBy createdAt expiresAt status");

    res.json(invites);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch pending invites",
      error: error.message,
    });
  }
};

exports.acceptInvite = async (req, res) => {
  try {
    const { token } = req.body;

    const invite = await Invite.findOne({
      token,
      status: "PENDING",
    });

    if (!invite) {
      return res.status(404).json({
        message: "Invite invalid",
      });
    }

    if (invite.expiresAt < new Date()) {
      invite.status = "EXPIRED";

      await invite.save();

      return res.status(400).json({
        message: "Invite expired",
      });
    }

    if (req.user.email !== invite.email) {
      return res.status(403).json({
        message: "Wrong account",
      });
    }

    const existing = await Membership.findOne({
      organization: invite.organization,
      user: req.user._id,
    });

    if (existing) {
      return res.status(400).json({
        message: "Already member",
      });
    }

    await Membership.create({
      organization: invite.organization,
      user: req.user._id,
      role: invite.role,
    });

    invite.status = "ACCEPTED";

    await invite.save();

    await Activity.create({
      organization: invite.organization,
      user: req.user._id,
      action: "INVITE_ACCEPTED",
      entityType: "INVITE",
      entityId: invite._id,

      after: {
        role: invite.role,
      },
    });

    res.json({
      message: "Joined organization",
    });

  } catch (error) {
    res.status(500).json({
      message: "Accept failed",
      error: error.message,
    });
  }
};
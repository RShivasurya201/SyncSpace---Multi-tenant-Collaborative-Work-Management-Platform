const Membership = require("../models/Membership");

async function orgMiddleware(req, res, next) {
  try {
    const orgId = req.headers["x-organization-id"];

    if (!orgId) {
      return res.status(400).json({ message: "Organization ID required" });
    }

    // check membership
    const membership = await Membership.findOne({
      user: req.user._id,
      organization: orgId,
    });

    if (!membership) {
      return res.status(403).json({ message: "Access denied to this organization" });
    }

    // attach to request
    req.organizationId = orgId;
    req.role = membership.role;

    next();

  } catch (error) {
    res.status(500).json({ message: "Organization middleware error", error });
  }
}

module.exports = orgMiddleware;
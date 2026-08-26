const { hasPermission, ROLE_PERMISSIONS, normalizeRoleName } = require("../rbac/permissions");

const PERMISSION_ALIASES = {
  CREATE_PROJECT: "MANAGE_PROJECT",
  UPDATE_PROJECT: "MANAGE_PROJECT",
  DELETE_PROJECT: "MANAGE_PROJECT",
  CREATE_TASK: "CREATE_TASK",
  UPDATE_TASK: "UPDATE_TASK",
  ASSIGN_TASK: "ASSIGN_TASK",
  VIEW_ANALYTICS: "VIEW_ANALYTICS",
  COMMENT_TASK: "COMMENT_TASK",
  BLOCK_TASK: "BLOCK_TASK",
  INVITE_MEMBER: "INVITE_MEMBER",
  MANAGE_MEMBERS: "MANAGE_MEMBERS",
  VIEW: "VIEW",
};

function checkPermission(permission) {
  return (req, res, next) => {
    const normalizedPermission = PERMISSION_ALIASES[permission] || permission;
    const role = normalizeRoleName(req.role);

    if (!hasPermission(role, normalizedPermission)) {
      return res.status(403).json({
        message: "Permission denied",
        requiredPermission: normalizedPermission,
        role,
      });
    }

    next();
  };
}

module.exports = checkPermission;
module.exports.ROLE_PERMISSIONS = ROLE_PERMISSIONS;
module.exports.hasPermission = hasPermission;
module.exports.normalizeRoleName = normalizeRoleName;
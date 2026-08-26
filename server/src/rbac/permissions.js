const ROLE_PERMISSIONS = {
  OWNER: [
    "VIEW",
    "MANAGE_PROJECT",
    "CREATE_TASK",
    "UPDATE_TASK",
    "ASSIGN_TASK",
    "COMMENT_TASK",
    "BLOCK_TASK",
    "VIEW_ANALYTICS",
    "INVITE_MEMBER",
    "MANAGE_MEMBERS",
  ],
  ADMIN: [
    "VIEW",
    "MANAGE_PROJECT",
    "CREATE_TASK",
    "UPDATE_TASK",
    "ASSIGN_TASK",
    "COMMENT_TASK",
    "BLOCK_TASK",
    "VIEW_ANALYTICS",
    "INVITE_MEMBER",
    "MANAGE_MEMBERS",
  ],
  MANAGER: [
    "VIEW",
    "MANAGE_PROJECT",
    "CREATE_TASK",
    "UPDATE_TASK",
    "ASSIGN_TASK",
    "COMMENT_TASK",
    "BLOCK_TASK",
    "VIEW_ANALYTICS",
  ],
  DEVELOPER: [
    "VIEW",
    "CREATE_TASK",
    "UPDATE_TASK",
    "COMMENT_TASK",
  ],
  VIEWER: ["VIEW"],
};

const ALLOWED_MEMBER_ROLES = ["ADMIN", "MANAGER", "DEVELOPER", "VIEWER"];
const ALL_ROLES = ["OWNER", ...ALLOWED_MEMBER_ROLES];

function hasPermission(role, permission) {
  if (!role) return false;
  const normalizedRole = String(role).toUpperCase();
  return Boolean(ROLE_PERMISSIONS[normalizedRole]?.includes(permission));
}

function normalizeRoleName(role) {
  if (!role) return "VIEWER";
  const normalized = String(role).trim().toUpperCase();
  if (normalized === "OWNER") return "OWNER";
  if (ALLOWED_MEMBER_ROLES.includes(normalized)) return normalized;
  return "VIEWER";
}

module.exports = {
  ROLE_PERMISSIONS,
  ALLOWED_MEMBER_ROLES,
  ALL_ROLES,
  hasPermission,
  normalizeRoleName,
};

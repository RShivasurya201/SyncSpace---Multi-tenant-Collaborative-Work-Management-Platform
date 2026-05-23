const rolePermissions = {
  OWNER: [
    "CREATE_PROJECT",
    "CREATE_TASK",
    "ASSIGN_TASK",
    "VIEW_ANALYTICS",
  ],
  ADMIN: [
    "CREATE_PROJECT",
    "CREATE_TASK",
    "ASSIGN_TASK",
    "VIEW_ANALYTICS",
  ],
  MANAGER: [
    "CREATE_PROJECT",
    "CREATE_TASK",
    "ASSIGN_TASK",
  ],
  DEVELOPER: [
    "CREATE_TASK",
  ],
  VIEWER: [],
};

function checkPermission(permission) {
  return (req, res, next) => {
    const role = req.role;

    if (!rolePermissions[role]?.includes(permission)) {
      return res.status(403).json({ message: "Permission denied" });
    }

    next();
  };
}

module.exports = checkPermission;
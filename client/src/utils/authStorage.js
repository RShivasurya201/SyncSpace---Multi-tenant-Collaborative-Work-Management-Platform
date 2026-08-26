const TOKEN_KEY = "token";
const USER_KEY = "user";
const ORGS_KEY = "organizations";
const ORG_ID_KEY = "organizationId";

const ROLE_PERMISSIONS = {
  OWNER: ["VIEW", "MANAGE_PROJECT", "CREATE_TASK", "UPDATE_TASK", "ASSIGN_TASK", "COMMENT_TASK", "BLOCK_TASK", "VIEW_ANALYTICS", "INVITE_MEMBER", "MANAGE_MEMBERS"],
  ADMIN: ["VIEW", "MANAGE_PROJECT", "CREATE_TASK", "UPDATE_TASK", "ASSIGN_TASK", "COMMENT_TASK", "BLOCK_TASK", "VIEW_ANALYTICS", "INVITE_MEMBER", "MANAGE_MEMBERS"],
  MANAGER: ["VIEW", "MANAGE_PROJECT", "CREATE_TASK", "UPDATE_TASK", "ASSIGN_TASK", "COMMENT_TASK", "BLOCK_TASK", "VIEW_ANALYTICS"],
  DEVELOPER: ["VIEW", "CREATE_TASK", "UPDATE_TASK", "COMMENT_TASK"],
  VIEWER: ["VIEW"],
};

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthSession({ token, user, organizations, organization }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  let orgs = Array.isArray(organizations) ? organizations : [];

  if (organization && !orgs.length) {
    orgs = [{
      organization: organization.organization || organization,
      role: organization.role || "VIEWER",
    }];
  }

  if (orgs?.length) {
    const normalizedOrgs = orgs.map((entry) => ({
      ...entry,
      organization: entry.organization?.organization || entry.organization,
      role: entry.role || "VIEWER",
    }));

    localStorage.setItem(ORGS_KEY, JSON.stringify(normalizedOrgs));
    const firstOrgId = normalizedOrgs[0].organization?._id || normalizedOrgs[0].organization;
    if (firstOrgId) {
      localStorage.setItem(ORG_ID_KEY, firstOrgId);
    }
  } else {
    localStorage.removeItem(ORGS_KEY);
    localStorage.removeItem(ORG_ID_KEY);
  }
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ORGS_KEY);
  localStorage.removeItem(ORG_ID_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getStoredOrganizations() {
  const raw = localStorage.getItem(ORGS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getOrganizationId() {
  return localStorage.getItem(ORG_ID_KEY);
}

export function setOrganizationId(orgId) {
  if (orgId) {
    localStorage.setItem(ORG_ID_KEY, orgId);
  } else {
    localStorage.removeItem(ORG_ID_KEY);
  }
}

export function getCurrentMembership() {
  const orgId = getOrganizationId();
  if (!orgId) return null;
  return getStoredOrganizations().find((m) => {
    const id = m.organization?._id || m.organization;
    return id === orgId;
  });
}

export function hasCurrentPermission(permission) {
  const membership = getCurrentMembership();
  const role = String(membership?.role || "").toUpperCase();
  return Boolean(ROLE_PERMISSIONS[role]?.includes(permission));
}

export function isAuthenticated() {
  return Boolean(getToken());
}

import api from "./client";

export async function login({ email, password }) {
  const { data } = await api.post("/auth/login", { email, password });
  return data;
}

export async function signup({ name, email, password, organizationName }) {
  const { data } = await api.post("/auth/signup", {
    name,
    email,
    password,
    organizationName,
  });
  return data;
}
export async function getProfile() {
  const { data } = await api.get("/auth/me");
  return data;
}


export async function getMembers() {
  const { data } = await api.get("/org/members");
  return data;
}

export async function getPendingInvites() {
  const { data } = await api.get("/invites/pending");
  return data;
}

export async function createInvite({ email, role }) {
  const { data } = await api.post("/invites", { email, role });
  return data;
}

export async function updateMemberRole(memberId, role) {
  const { data } = await api.patch(`/org/members/${memberId}/role`, { role });
  return data;
}

export async function removeMember(memberId) {
  const { data } = await api.delete(`/org/members/${memberId}`);
  return data;
}

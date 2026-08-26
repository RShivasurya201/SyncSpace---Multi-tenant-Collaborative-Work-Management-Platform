import api from "./client";

export async function getProjects() {
  const { data } = await api.get("/projects");
  return data;
}

export async function createProject(payload) {
  const { data } = await api.post("/projects", payload);
  return data;
}

export async function updateProject(projectId, payload) {
  const { data } = await api.put(`/projects/${projectId}`, payload);
  return data;
}

export async function deleteProject(projectId) {
  const { data } = await api.delete(`/projects/${projectId}`);
  return data;
}

export async function getProjectSnapshot(projectId, asOf) {
  const params = asOf ? { params: { asOf } } : {};
  const { data } = await api.get(`/projects/${projectId}/snapshot`, params);
  return data;
}

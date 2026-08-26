import api from "./client";

export async function getActivity(projectId) {
  const { data } = await api.get(`/activities/${projectId}`);
  return data;
}

export async function getProjectActivity(projectId) {
  const { data } = await api.get(`/activities/${projectId}`);
  return data;
}

export async function getActivitySummary() {
  const { data } = await api.get("/activities/summary");
  return data;
}

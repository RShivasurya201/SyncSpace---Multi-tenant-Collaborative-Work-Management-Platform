import api from "./client";

export async function getDashboardAnalytics(days = 30) {
  const { data } = await api.get("/analytics/dashboard/overview", {
    params: { days },
  });
  return data;
}

export async function getProjectAnalytics(projectId) {
  const { data } = await api.get(`/analytics/${projectId}`);
  return data;
}

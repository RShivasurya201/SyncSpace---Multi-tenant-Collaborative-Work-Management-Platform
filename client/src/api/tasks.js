import api from "./client";

export async function getTasks(projectId) {
  const { data } = await api.get(`/tasks/${projectId}`);
  return data;
}

export async function getTask(taskId) {
  const { data } = await api.get(`/tasks/task/${taskId}`);
  return data;
}

export async function createTask(projectId, payload) {
  const { data } = await api.post(`/tasks`, {
    projectId,
    ...payload,
  });
  return data;
}

export async function addComment(taskId, text) {
  const { data } = await api.post(`/comments/${taskId}`, {
    text,
  });
  return data;
}

export async function assignTask(taskId, userId) {
  const { data } = await api.patch(`/tasks/${taskId}/assign`, {
    userId,
  });
  return data;
}

export async function toggleTaskBlocked(taskId) {
  const { data } = await api.patch(`/comments/${taskId}/block`);
  return data;
}

export async function updateTaskStatus(taskId, status) {
  const { data } = await api.patch(`/tasks/${taskId}/status`, { status });
  return data;
}

export async function updateTask(taskId, payload) {
  const { data } = await api.put(`/tasks/${taskId}`, payload);
  return data;
}

export async function deleteTask(taskId) {
  const { data } = await api.delete(`/tasks/${taskId}`);
  return data;
}

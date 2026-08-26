import axios from "axios";
import { getOrganizationId, getToken } from "../utils/authStorage";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const orgId = getOrganizationId();
  if (orgId) {
    config.headers["x-organization-id"] = orgId;
  }

  return config;
});

export default api;
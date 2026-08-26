export function getErrorMessage(error, fallback = "Something went wrong.") {
  const message = error?.response?.data?.message;
  if (message) return message;
  if (error?.message === "Network Error") {
    return "Unable to reach the server. Make sure the backend is running.";
  }
  return fallback;
}

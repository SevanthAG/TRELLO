import axios from "axios";

const DEFAULT_ERROR = "Something went wrong. Please try again.";
const NETWORK_ERROR = "Can't reach the server. Please check your connection.";

export function getAuthErrorMessage(error: unknown): string {
  if (!axios.isAxiosError<{ message?: string }>(error)) return DEFAULT_ERROR;

  const message = error.response?.data?.message;
  if (message) return message;
  if (error.code === "ERR_NETWORK") return NETWORK_ERROR;

  return DEFAULT_ERROR;
}

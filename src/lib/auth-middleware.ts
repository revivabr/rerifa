import { createMiddleware } from "@tanstack/react-start";
import { projectAuthHeaders } from "@/lib/auth-session";

// Admin sign-in uses this project's client and its reviva-rifa-auth session.
// The generated attacher reads a different client's storage key.
export const attachProjectAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    return next({ headers: await projectAuthHeaders() });
  },
);
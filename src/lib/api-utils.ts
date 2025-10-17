/**
 * API Error Handling Utilities
 *
 * Helper functions for consistent error handling across API endpoints
 */

import type { APIContext } from "astro";

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

/**
 * Creates a standardized JSON error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  status: number,
  details?: Record<string, string>
): Response {
  const body: ErrorResponse = {
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * Creates a standardized JSON success response
 */
export function createSuccessResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * Sets session cookies for authenticated user
 */
export function setSessionCookies(context: APIContext, accessToken: string, refreshToken: string): void {
  context.cookies.set("sb-access-token", accessToken, {
    path: "/",
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  context.cookies.set("sb-refresh-token", refreshToken, {
    path: "/",
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

/**
 * Clears session cookies
 */
export function clearSessionCookies(context: APIContext): void {
  context.cookies.delete("sb-access-token", { path: "/" });
  context.cookies.delete("sb-refresh-token", { path: "/" });
}

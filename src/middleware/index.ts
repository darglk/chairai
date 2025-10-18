import { defineMiddleware } from "astro:middleware";
import { supabaseClient } from "../db/supabase.client.ts";
import type { UserRole } from "../types.ts";

/**
 * Authentication Middleware
 *
 * This middleware runs on every request to:
 * 1. Initialize Supabase client in locals
 * 2. Check for valid session tokens in cookies
 * 3. Refresh expired sessions when possible
 * 4. Populate user data in locals for authenticated requests
 * 5. Protect routes that require authentication
 * 6. Redirect authenticated users away from auth pages
 */

// Routes that require authentication
const PROTECTED_ROUTES = ["/dashboard", "/generate"];

// Routes that should redirect authenticated users
const AUTH_ROUTES = ["/login", "/register", "/password-recovery", "/password-reset"];

/**
 * Fetch user role from database
 */
async function fetchUserRole(userId: string | undefined): Promise<UserRole | undefined> {
  if (!userId) return undefined;

  try {
    const { data, error } = await supabaseClient.from("users").select("role").eq("id", userId).single();

    return !error && data ? data.role : undefined;
  } catch {
    return undefined;
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  // Initialize Supabase client in locals
  context.locals.supabase = supabaseClient;

  // Get session tokens from cookies
  const accessToken = context.cookies.get("sb-access-token")?.value;
  const refreshToken = context.cookies.get("sb-refresh-token")?.value;

  // If we have an access token, try to get the user
  if (accessToken) {
    try {
      const {
        data: { user },
        error,
      } = await supabaseClient.auth.getUser(accessToken);

      if (error) {
        // Token is invalid or expired, try to refresh if we have refresh token
        if (refreshToken) {
          const { data, error: refreshError } = await supabaseClient.auth.refreshSession({
            refresh_token: refreshToken,
          });

          if (!refreshError && data.session && data.user) {
            // Update cookies with new tokens
            context.cookies.set("sb-access-token", data.session.access_token, {
              path: "/",
              httpOnly: true,
              secure: import.meta.env.PROD,
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 7, // 7 days
            });

            context.cookies.set("sb-refresh-token", data.session.refresh_token, {
              path: "/",
              httpOnly: true,
              secure: import.meta.env.PROD,
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 30, // 30 days
            });

            // Fetch role from database
            const role = await fetchUserRole(data.user.id);
            if (role) {
              Object.assign(data.user, { role });
            }
            // @ts-expect-error - adding role property to User type
            context.locals.user = data.user;
          } else {
            // Refresh failed, clear invalid cookies
            context.cookies.delete("sb-access-token", { path: "/" });
            context.cookies.delete("sb-refresh-token", { path: "/" });
          }
        } else {
          // No refresh token, clear invalid access token
          context.cookies.delete("sb-access-token", { path: "/" });
        }
      } else if (user) {
        // Valid token and user, fetch role from database
        const role = await fetchUserRole(user.id);
        if (role) {
          Object.assign(user, { role });
        }
        // @ts-expect-error - adding role property to User type
        context.locals.user = user;
      }
    } catch {
      // Error occurred, clear cookies to be safe
      context.cookies.delete("sb-access-token", { path: "/" });
      context.cookies.delete("sb-refresh-token", { path: "/" });
    }
  }

  // Get current path
  const { pathname } = context.url;

  // Check if route requires authentication
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  // Check if route is an auth page
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !context.locals.user) {
    return context.redirect("/login", 302);
  }

  // Redirect authenticated users from auth pages to home
  if (isAuthRoute && context.locals.user) {
    return context.redirect("/", 302);
  }

  return next();
});

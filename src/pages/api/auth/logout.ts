/**
 * Logout API Endpoint
 *
 * Handles user logout by clearing session cookies
 * and signing out from Supabase.
 */

import type { APIRoute } from "astro";
import { clearSessionCookies } from "@/lib/api-utils";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    // Sign out from Supabase
    await context.locals.supabase.auth.signOut();

    // Clear session cookies
    clearSessionCookies(context);

    // Redirect to home page
    return context.redirect("/", 302);
  } catch {
    // Even if signOut fails, clear cookies and redirect
    clearSessionCookies(context);

    return context.redirect("/", 302);
  }
};

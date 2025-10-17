/**
 * Auth Callback API Endpoint
 *
 * Handles OAuth callbacks and magic link verification from Supabase.
 * This endpoint is called when:
 * 1. User clicks on email verification link
 * 2. User clicks on password reset link
 * 3. User completes OAuth flow
 */

import type { APIRoute } from "astro";
import { setSessionCookies } from "@/lib/api-utils";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const { url } = context;

  // Get the code from URL params
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  // Handle errors from Supabase
  if (error) {
    // Redirect to login with error message
    return context.redirect(`/login?error=${encodeURIComponent(errorDescription || error)}`, 302);
  }

  // No code means invalid callback
  if (!code) {
    return context.redirect("/login?error=Invalid+callback+link", 302);
  }

  try {
    // Exchange the code for a session
    const { data, error: exchangeError } = await context.locals.supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      return context.redirect(`/login?error=${encodeURIComponent(exchangeError.message)}`, 302);
    }

    if (!data.session) {
      return context.redirect("/login?error=Unable+to+create+session", 302);
    }

    // Set session cookies
    setSessionCookies(context, data.session.access_token, data.session.refresh_token);

    // Determine where to redirect based on the type of callback
    // For password reset, redirect to password-reset page
    // For email verification, redirect to home
    const type = url.searchParams.get("type");

    if (type === "recovery") {
      // Password reset flow - redirect to password reset page
      return context.redirect("/password-reset", 302);
    }

    // Default: redirect to home page
    return context.redirect("/", 302);
  } catch {
    return context.redirect("/login?error=An+error+occurred+during+authentication", 302);
  }
};

/**
 * Current User API Endpoint
 *
 * Returns information about the currently authenticated user
 *
 * GET /api/users/me
 * Returns: { id, email, role }
 */

import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-utils";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    // Get authenticated user from Supabase
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return createErrorResponse("UNAUTHORIZED", "Musisz być zalogowany", 401);
    }

    // Get user role from database
    const { data: userData, error: userError } = await context.locals.supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return createErrorResponse("USER_NOT_FOUND", "Nie znaleziono użytkownika", 404);
    }

    // Return user data with role
    return createSuccessResponse({
      id: user.id,
      email: user.email,
      role: userData.role,
    });
  } catch (error) {
    console.error("Error in GET /api/users/me:", error);
    return createErrorResponse("INTERNAL_ERROR", "Wystąpił nieoczekiwany błąd serwera", 500);
  }
};

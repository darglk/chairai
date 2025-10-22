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
    // Check if user is authenticated via middleware
    if (!context.locals.user) {
      return createErrorResponse("UNAUTHORIZED", "Musisz być zalogowany", 401);
    }

    const user = context.locals.user;

    // If role is not in locals (shouldn't happen with current middleware), fetch from database
    let role = context.locals.userRole;

    if (!role) {
      const { data: userData, error: userError } = await context.locals.supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (userError || !userData) {
        return createErrorResponse("USER_NOT_FOUND", "Nie znaleziono użytkownika", 404);
      }

      role = userData.role;
    }

    // Return user data with role
    return createSuccessResponse({
      id: user.id,
      email: user.email,
      role,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in GET /api/users/me:", error);
    return createErrorResponse("INTERNAL_ERROR", "Wystąpił nieoczekiwany błąd serwera", 500);
  }
};

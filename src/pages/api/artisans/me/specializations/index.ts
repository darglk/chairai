/**
 * Artisan Specializations API Endpoint - POST /api/artisans/me/specializations
 *
 * Enables authenticated artisans to add one or more specializations to their profile.
 *
 * AUTHENTICATION: Required (Supabase Auth token)
 * AUTHORIZATION: Only users with role "artisan" can access this endpoint
 *
 * WORKFLOW:
 * 1. Extract and validate authentication token
 * 2. Fetch user data and verify authentication
 * 3. Verify user role is "artisan"
 * 4. Validate request body (specialization_ids array)
 * 5. Verify all specialization IDs exist in database
 * 6. Add specializations to artisan profile (upsert, ignore duplicates)
 * 7. Return 200 OK with added specializations
 *
 * REQUEST BODY:
 * {
 *   "specialization_ids": ["uuid1", "uuid2"]
 * }
 *
 * SUCCESS RESPONSE (200 OK):
 * {
 *   "specializations": [
 *     { "id": "uuid1", "name": "Tables" },
 *     { "id": "uuid2", "name": "Chairs" }
 *   ]
 * }
 *
 * ERROR RESPONSES:
 * - 400 Bad Request: Invalid JSON body or empty array
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 403 Forbidden: User role is not "artisan"
 * - 404 Not Found: One or more specialization IDs don't exist
 * - 422 Unprocessable Entity: Validation error (invalid UUID format)
 * - 500 Internal Server Error: Database or unexpected errors
 */

import type { APIRoute } from "astro";
import { AddArtisanSpecializationsSchema } from "@/lib/schemas";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-utils";
import { ArtisanProfileService, ArtisanProfileError } from "@/lib/services/artisan-profile.service";
import { ZodError } from "zod";

export const prerender = false;

/**
 * POST handler for adding specializations to artisan profile.
 *
 * Implements the complete workflow for adding specializations:
 * authentication → authorization → validation → add specializations
 *
 * @param context - Astro APIContext containing request, locals (Supabase client), and cookies
 * @returns Response with 200 status and specializations data, or error response with appropriate status code
 *
 * @throws {Error} Unexpected errors are caught and returned as 500 Internal Server Error
 */
export const POST: APIRoute = async (context) => {
  try {
    // ========================================================================
    // STEP 1: Authentication
    // Verify user is logged in using Supabase Auth token from context
    // ========================================================================

    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return createErrorResponse("UNAUTHORIZED", "Musisz być zalogowany, aby zarządzać specjalizacjami", 401);
    }

    // ========================================================================
    // STEP 2: Authorization - Role Check
    // Verify user has "artisan" role (only artisans can manage specializations)
    // ========================================================================

    const { data: userData, error: userError } = await context.locals.supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return createErrorResponse("USER_NOT_FOUND", "Nie znaleziono użytkownika", 404);
    }

    if (userData.role !== "artisan") {
      return createErrorResponse("FORBIDDEN", "Tylko rzemieślnicy mogą zarządzać specjalizacjami", 403);
    }

    // ========================================================================
    // STEP 3: Input Validation
    // Parse and validate request body using Zod schema
    // ========================================================================

    const body = await context.request.json();
    const validatedData = AddArtisanSpecializationsSchema.parse(body);

    // ========================================================================
    // STEP 4: Business Logic - Add Specializations
    // Call service layer to handle specialization addition with validation
    // ========================================================================

    const artisanProfileService = new ArtisanProfileService(context.locals.supabase);
    const specializations = await artisanProfileService.addSpecializationsToProfile(
      validatedData.specialization_ids,
      user.id
    );

    // ========================================================================
    // STEP 5: Success Response
    // Return added specializations
    // ========================================================================

    return createSuccessResponse({ specializations }, 200);
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const details: Record<string, string> = {};
      error.errors.forEach((err) => {
        const field = err.path.join(".");
        details[field] = err.message;
      });

      return createErrorResponse("VALIDATION_ERROR", "Nieprawidłowe dane wejściowe", 422, details);
    }

    // Handle business logic errors from service layer
    if (error instanceof ArtisanProfileError) {
      return createErrorResponse(error.code, error.message, error.statusCode);
    }

    // Handle unexpected errors
    // TODO: Implement proper logging service in production
    return createErrorResponse("INTERNAL_ERROR", "Wystąpił nieoczekiwany błąd serwera", 500);
  }
};

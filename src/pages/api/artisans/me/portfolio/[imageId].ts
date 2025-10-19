/**
 * Artisan Portfolio Image API Endpoint - DELETE /api/artisans/me/portfolio/{imageId}
 *
 * Enables authenticated artisans to remove an image from their portfolio.
 *
 * AUTHENTICATION: Required (Supabase Auth token)
 * AUTHORIZATION: Only users with role "artisan" can access this endpoint
 *
 * WORKFLOW:
 * 1. Extract and validate authentication token
 * 2. Fetch user data and verify authentication
 * 3. Verify user role is "artisan"
 * 4. Validate imageId parameter (UUID format)
 * 5. Verify image ownership
 * 6. Check business rule: public profiles must have at least 5 images
 * 7. Remove image from database and storage
 * 8. Return 204 No Content
 *
 * URL PARAMETERS:
 * - imageId: UUID of the portfolio image to remove
 *
 * SUCCESS RESPONSE:
 * - 204 No Content (empty body)
 *
 * ERROR RESPONSES:
 * - 400 Bad Request: Invalid UUID format or business rule violation (min 5 images for public profile)
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 403 Forbidden: User role is not "artisan"
 * - 404 Not Found: Image not found or doesn't belong to artisan
 * - 500 Internal Server Error: Database or storage errors
 */

import type { APIRoute } from "astro";
import { createErrorResponse } from "@/lib/api-utils";
import { ArtisanProfileService, ArtisanProfileError } from "@/lib/services/artisan-profile.service";
import { z } from "zod";

export const prerender = false;

/**
 * UUID validation schema for imageId parameter
 */
const ImageIdSchema = z.string().uuid({ message: "Nieprawidłowy format UUID" });

/**
 * DELETE handler for removing portfolio image.
 *
 * Implements the complete workflow for image removal:
 * authentication → authorization → validation → business rules → delete
 *
 * @param context - Astro APIContext containing params, locals (Supabase client), and cookies
 * @returns Response with 204 status (no content), or error response with appropriate status code
 *
 * @throws {Error} Unexpected errors are caught and returned as 500 Internal Server Error
 */
export const DELETE: APIRoute = async (context) => {
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
      return createErrorResponse("UNAUTHORIZED", "Musisz być zalogowany, aby zarządzać portfolio", 401);
    }

    // ========================================================================
    // STEP 2: Authorization - Role Check
    // Verify user has "artisan" role (only artisans can manage portfolio)
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
      return createErrorResponse("FORBIDDEN", "Tylko rzemieślnicy mogą zarządzać portfolio", 403);
    }

    // ========================================================================
    // STEP 3: Parameter Validation
    // Validate imageId URL parameter
    // ========================================================================

    const { imageId } = context.params;

    if (!imageId) {
      return createErrorResponse("INVALID_PARAMETER", "Brak wymaganego parametru imageId", 400);
    }

    // Validate UUID format
    const validationResult = ImageIdSchema.safeParse(imageId);
    if (!validationResult.success) {
      return createErrorResponse("INVALID_UUID", "Nieprawidłowy format UUID dla imageId", 400);
    }

    // ========================================================================
    // STEP 4: Business Logic - Remove Image
    // Call service layer to handle image deletion with business rules validation
    // ========================================================================

    const artisanProfileService = new ArtisanProfileService(context.locals.supabase);
    await artisanProfileService.deletePortfolioImage(imageId, user.id);

    // ========================================================================
    // STEP 5: Success Response
    // Return 204 No Content (operation successful, no body needed)
    // ========================================================================

    return new Response(null, { status: 204 });
  } catch (error) {
    // Handle business logic errors from service layer
    if (error instanceof ArtisanProfileError) {
      return createErrorResponse(error.code, error.message, error.statusCode);
    }

    // Handle unexpected errors
    // TODO: Implement proper logging service in production
    return createErrorResponse("INTERNAL_ERROR", "Wystąpił nieoczekiwany błąd serwera", 500);
  }
};

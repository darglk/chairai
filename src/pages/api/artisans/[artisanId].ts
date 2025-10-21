/**
 * GET /api/artisans/{artisanId}
 *
 * Public endpoint to retrieve artisan profile information
 * including portfolio, specializations, and review statistics.
 *
 * This endpoint does NOT require authentication - it's publicly accessible
 * for anyone to view published artisan profiles.
 */

import type { APIRoute } from "astro";
import { ArtisanIdSchema } from "@/lib/schemas";
import { ArtisanProfileService, ArtisanProfileError } from "@/lib/services/artisan-profile.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-utils";

/**
 * GET handler for retrieving public artisan profile
 *
 * @param context - Astro API context containing params and locals
 * @returns Response with artisan profile data or error
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // ========================================================================
    // STEP 1: Validate artisanId path parameter
    // ========================================================================
    const artisanIdValidation = ArtisanIdSchema.safeParse(params.artisanId);

    if (!artisanIdValidation.success) {
      return createErrorResponse("VALIDATION_ERROR", "Nieprawidłowy format ID rzemieślnika", 400);
    }

    const artisanId = artisanIdValidation.data;

    // ========================================================================
    // STEP 2: Fetch public profile
    // ========================================================================
    const artisanProfileService = new ArtisanProfileService(locals.supabase);
    const profile = await artisanProfileService.getPublicProfile(artisanId);

    // ========================================================================
    // STEP 3: Return success response
    // ========================================================================
    return createSuccessResponse(profile, 200);
  } catch (error) {
    // Handle known business logic errors
    if (error instanceof ArtisanProfileError) {
      return createErrorResponse(error.code, error.message, error.statusCode);
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("[API] Unexpected error in GET /api/artisans/{artisanId}:", error);
    return createErrorResponse("INTERNAL_ERROR", "Wystąpił nieoczekiwany błąd", 500);
  }
};

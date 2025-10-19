/**
 * Artisan Profile API Endpoint - PUT /api/artisans/me
 *
 * Enables authenticated artisans to create or update their professional profile.
 *
 * AUTHENTICATION: Required (Supabase Auth token)
 * AUTHORIZATION: Only users with role "artisan" can access this endpoint
 *
 * WORKFLOW:
 * 1. Extract and validate authentication token
 * 2. Fetch user data and verify authentication
 * 3. Verify user role is "artisan"
 * 4. Validate request body (company_name, NIP)
 * 5. Check NIP uniqueness (business rule)
 * 6. Upsert artisan profile
 * 7. Return 200 OK with profile data
 *
 * REQUEST BODY:
 * {
 *   "company_name": "Master Woodworks",
 *   "nip": "1234567890"
 * }
 *
 * SUCCESS RESPONSE (200 OK):
 * {
 *   "user_id": "550e8400-e29b-41d4-a716-446655440000",
 *   "company_name": "Master Woodworks",
 *   "nip": "1234567890",
 *   "is_public": false,
 *   "specializations": [],
 *   "portfolio_images": [],
 *   "average_rating": null,
 *   "total_reviews": 0,
 *   "updated_at": "2025-10-19T12:30:45Z"
 * }
 *
 * ERROR RESPONSES:
 * - 400 Bad Request: Invalid JSON body
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 403 Forbidden: User role is not "artisan"
 * - 404 Not Found: User not found
 * - 409 Conflict: NIP already used by another artisan
 * - 422 Unprocessable Entity: Validation error (invalid company_name or NIP format)
 * - 500 Internal Server Error: Database or unexpected errors
 */

import type { APIRoute } from "astro";
import { CreateUpdateArtisanProfileSchema } from "@/lib/schemas";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-utils";
import { ArtisanProfileService, ArtisanProfileError } from "@/lib/services/artisan-profile.service";
import { ZodError } from "zod";

export const prerender = false;

/**
 * PUT handler for artisan profile endpoint.
 *
 * Implements the complete workflow for creating/updating artisan profile:
 * authentication → authorization → validation → upsert
 *
 * @param context - Astro APIContext containing request, locals (Supabase client), and cookies
 * @returns Response with 200 status and profile data, or error response with appropriate status code
 *
 * @throws {Error} Unexpected errors are caught and returned as 500 Internal Server Error
 */
export const PUT: APIRoute = async (context) => {
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
      return createErrorResponse("UNAUTHORIZED", "Musisz być zalogowany, aby zarządzać profilem", 401);
    }

    // ========================================================================
    // STEP 2: Authorization - Role Check
    // Verify user has "artisan" role (only artisans can manage their profile)
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
      return createErrorResponse("FORBIDDEN", "Tylko rzemieślnicy mogą zarządzać profilem zawodowym", 403);
    }

    // ========================================================================
    // STEP 3: Input Validation
    // Parse and validate request body using Zod schema
    // ========================================================================

    const body = await context.request.json();
    const validatedData = CreateUpdateArtisanProfileSchema.parse(body);

    // ========================================================================
    // STEP 4: Business Logic - Upsert Profile
    // Call service layer to handle profile creation/update with NIP validation
    // ========================================================================

    const artisanProfileService = new ArtisanProfileService(context.locals.supabase);
    const profile = await artisanProfileService.upsertArtisanProfile(validatedData, user.id);

    // ========================================================================
    // STEP 5: Success Response
    // Return created/updated profile data
    // ========================================================================

    return createSuccessResponse(profile, 200);
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

/**
 * GET handler for artisan profile endpoint.
 *
 * Retrieves the complete profile of the authenticated artisan, including:
 * - Profile information (company name, NIP, public status)
 * - Specializations
 * - Portfolio images
 * - Aggregated review statistics (average rating, total reviews)
 *
 * This endpoint returns all profile data regardless of public status,
 * as it's intended for the artisan to view and manage their own profile.
 *
 * @param context - Astro APIContext containing request, locals (Supabase client), and cookies
 * @returns Response with 200 status and full profile data, or error response with appropriate status code
 *
 * @throws {Error} Unexpected errors are caught and returned as 500 Internal Server Error
 */
export const GET: APIRoute = async (context) => {
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
      return createErrorResponse("UNAUTHORIZED", "Musisz być zalogowany, aby uzyskać dostęp do profilu", 401);
    }

    // ========================================================================
    // STEP 2: Authorization - Role Check
    // Verify user has "artisan" role (only artisans can view their profile)
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
      return createErrorResponse("FORBIDDEN", "Tylko rzemieślnicy mogą przeglądać profil zawodowy", 403);
    }

    // ========================================================================
    // STEP 3: Business Logic - Fetch Profile
    // Call service layer to retrieve complete artisan profile
    // ========================================================================

    const artisanProfileService = new ArtisanProfileService(context.locals.supabase);
    const profile = await artisanProfileService.getArtisanProfile(user.id);

    // If profile doesn't exist, return 404
    if (!profile) {
      return createErrorResponse("PROFILE_NOT_FOUND", "Profil rzemieślnika nie został jeszcze utworzony", 404);
    }

    // ========================================================================
    // STEP 4: Success Response
    // Return complete profile data
    // ========================================================================

    return createSuccessResponse(profile, 200);
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

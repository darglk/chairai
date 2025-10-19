/**
 * Artisan Portfolio API Endpoint - POST /api/artisans/me/portfolio
 *
 * Enables authenticated artisans to upload an image to their portfolio.
 *
 * AUTHENTICATION: Required (Supabase Auth token)
 * AUTHORIZATION: Only users with role "artisan" can access this endpoint
 *
 * WORKFLOW:
 * 1. Extract and validate authentication token
 * 2. Fetch user data and verify authentication
 * 3. Verify user role is "artisan"
 * 4. Validate uploaded file (type, size)
 * 5. Upload image to Supabase Storage
 * 6. Save image metadata to database
 * 7. Return 201 Created with image data
 *
 * REQUEST BODY:
 * - Content-Type: multipart/form-data
 * - Field name: "image"
 * - Accepted formats: jpg, png, webp
 * - Max size: 5MB
 *
 * SUCCESS RESPONSE (201 Created):
 * {
 *   "id": "550e8400-e29b-41d4-a716-446655440000",
 *   "image_url": "https://storage.supabase.co/...",
 *   "created_at": "2025-10-19T12:30:45Z"
 * }
 *
 * ERROR RESPONSES:
 * - 400 Bad Request: Missing file, invalid file type, or file too large
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 403 Forbidden: User role is not "artisan"
 * - 404 Not Found: User not found
 * - 500 Internal Server Error: Upload or database errors
 */

import type { APIRoute } from "astro";
import { PortfolioImageUploadSchema } from "@/lib/schemas";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-utils";
import { ArtisanProfileService, ArtisanProfileError } from "@/lib/services/artisan-profile.service";
import { ZodError } from "zod";

export const prerender = false;

/**
 * POST handler for uploading portfolio image.
 *
 * Implements the complete workflow for image upload:
 * authentication → authorization → validation → upload → save metadata
 *
 * @param context - Astro APIContext containing request, locals (Supabase client), and cookies
 * @returns Response with 201 status and image data, or error response with appropriate status code
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
    // STEP 3: Input Validation - Extract and Validate File
    // Parse multipart/form-data and validate image file
    // ========================================================================

    const formData = await context.request.formData();
    const image = formData.get("image");

    if (!image) {
      return createErrorResponse("MISSING_FILE", "Brak pliku obrazu w żądaniu", 400);
    }

    if (!(image instanceof File)) {
      return createErrorResponse("INVALID_FILE", "Przesłany plik nie jest obrazem", 400);
    }

    // Validate file using Zod schema
    const validatedData = PortfolioImageUploadSchema.parse({ image });

    // ========================================================================
    // STEP 4: Business Logic - Upload Image
    // Call service layer to handle file upload and metadata save
    // ========================================================================

    const artisanProfileService = new ArtisanProfileService(context.locals.supabase);
    const portfolioImage = await artisanProfileService.uploadPortfolioImage(validatedData.image, user.id);

    // ========================================================================
    // STEP 5: Success Response
    // Return created portfolio image data with 201 Created status
    // ========================================================================

    return createSuccessResponse(portfolioImage, 201);
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const details: Record<string, string> = {};
      error.errors.forEach((err) => {
        const field = err.path.join(".");
        details[field] = err.message;
      });

      return createErrorResponse("VALIDATION_ERROR", "Nieprawidłowy plik", 400, details);
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

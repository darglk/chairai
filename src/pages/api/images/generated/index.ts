/**
 * List Generated Images API Endpoint
 *
 * GET /api/images/generated
 * Returns paginated list of user's generated images with filtering options.
 *
 * Authentication required: YES (JWT Bearer token)
 * Authorization required: User must have 'client' role
 *
 * Query Parameters:
 *   - page: number (optional, default: 1) - Page number for pagination
 *   - limit: number (optional, default: 20, max: 100) - Items per page
 *   - unused_only: boolean (optional, default: false) - Filter to only unused images
 *
 * Response: GeneratedImagesListResponseDTO
 *   - data: Array of GeneratedImageDTO objects
 *   - pagination: Pagination metadata
 *   - remaining_generations: Number of generations remaining for user
 *
 * Status Codes:
 *   - 200: Success
 *   - 400: Invalid query parameters
 *   - 401: Not authenticated
 *   - 403: User doesn't have 'client' role
 *   - 422: Validation error on query parameters
 *   - 500: Server error
 */

import type { APIRoute } from "astro";
import { GeneratedImagesQuerySchema } from "@/lib/schemas";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-utils";
import { GeneratedImagesService } from "@/lib/services/generated-images.service";
import { ZodError } from "zod";
import type { GeneratedImagesListResponseDTO } from "@/types";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    // ====================================================================
    // STEP 1: Authentication - Verify JWT token
    // ====================================================================

    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return createErrorResponse("UNAUTHORIZED", "Musisz być zalogowany, aby przeglądać wygenerowane obrazy", 401);
    }

    // ====================================================================
    // STEP 2: Authorization - Check user role
    // ====================================================================

    const { data: userData, error: userError } = await context.locals.supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return createErrorResponse("USER_NOT_FOUND", "Nie znaleziono profilu użytkownika", 404);
    }

    // Only clients can access generated images
    if (userData.role !== "client") {
      return createErrorResponse("FORBIDDEN", "Tylko klienci mogą przeglądać wygenerowane obrazy", 403);
    }

    // ====================================================================
    // STEP 3: Parse and validate query parameters
    // ====================================================================

    const url = new URL(context.request.url);
    const queryParams = {
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
      unused_only: url.searchParams.get("unused_only"),
    };

    let validatedQuery;
    try {
      validatedQuery = GeneratedImagesQuerySchema.parse(queryParams);
    } catch (validationError) {
      if (validationError instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};

        validationError.errors.forEach((err) => {
          if (err.path.length > 0) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });

        return createErrorResponse("VALIDATION_ERROR", "Parametry zapytania są nieprawidłowe", 422, fieldErrors);
      }
      throw validationError;
    }

    // ====================================================================
    // STEP 4: Fetch data using GeneratedImagesService
    // ====================================================================

    const generatedImagesService = new GeneratedImagesService(context.locals.supabase);

    const response: GeneratedImagesListResponseDTO = await generatedImagesService.listUserGeneratedImages(user.id, {
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      unused_only: validatedQuery.unused_only,
    });

    // ====================================================================
    // STEP 5: Return success response
    // ====================================================================

    return createSuccessResponse(response, 200);
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};

      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });

      return createErrorResponse("VALIDATION_ERROR", "Błąd walidacji parametrów", 422, fieldErrors);
    }

    // Handle service/database errors
    if (error instanceof Error) {
      // eslint-disable-next-line no-console
      console.error("[API] Generated Images Error:", error.message, error.stack);
      return createErrorResponse(
        "INTERNAL_ERROR",
        "Nie udało się pobrać listy obrazów. Spróbuj ponownie później.",
        500
      );
    }

    // Handle unknown errors
    // eslint-disable-next-line no-console
    console.error("[API] Unknown error:", error);
    return createErrorResponse("INTERNAL_ERROR", "Nieznany błąd serwera. Spróbuj ponownie później.", 500);
  }
};

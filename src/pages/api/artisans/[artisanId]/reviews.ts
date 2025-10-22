/**
 * GET /api/artisans/{artisanId}/reviews
 *
 * Public endpoint to retrieve paginated reviews for an artisan
 * including summary statistics (average rating, total reviews, rating distribution).
 *
 * This endpoint does NOT require authentication - it's publicly accessible
 * for anyone to view artisan reviews.
 */

import type { APIRoute } from "astro";
import { ArtisanIdSchema, ArtisanReviewsQuerySchema } from "@/lib/schemas";
import { ReviewService, ReviewError } from "@/lib/services/review.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-utils";

export const prerender = false;

/**
 * GET handler for retrieving artisan reviews with pagination
 *
 * @param context - Astro API context containing params, url, and locals
 * @returns Response with paginated reviews, pagination metadata, and summary statistics
 */
export const GET: APIRoute = async ({ params, url, locals }) => {
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
    // STEP 2: Validate and parse query parameters
    // ========================================================================
    const queryParams = {
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
    };

    const queryValidation = ArtisanReviewsQuerySchema.safeParse(queryParams);

    if (!queryValidation.success) {
      return createErrorResponse("VALIDATION_ERROR", "Nieprawidłowe parametry zapytania", 400);
    }

    const { page, limit } = queryValidation.data;

    // ========================================================================
    // STEP 3: Fetch artisan reviews with summary
    // ========================================================================
    const reviewService = new ReviewService(locals.supabase);
    const result = await reviewService.getArtisanReviews(artisanId, page, limit);

    // ========================================================================
    // STEP 4: Return success response
    // ========================================================================
    return createSuccessResponse(result, 200);
  } catch (error) {
    // Handle known business logic errors
    if (error instanceof ReviewError) {
      return createErrorResponse(error.code, error.message, error.statusCode);
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("[API] Unexpected error in GET /api/artisans/{artisanId}/reviews:", error);
    return createErrorResponse("INTERNAL_ERROR", "Wystąpił nieoczekiwany błąd", 500);
  }
};

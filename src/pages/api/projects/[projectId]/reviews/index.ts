/**
 * Create Review API Endpoint
 *
 * POST /api/projects/{projectId}/reviews - Create a review for a completed project
 *
 * AUTHENTICATION: Required (Supabase Auth token)
 * AUTHORIZATION: Only project client or assigned artisan can create reviews
 *
 * PATH PARAMETERS:
 * - projectId: string (UUID) - ID of the project to review
 *
 * REQUEST BODY (application/json):
 * - rating: number (1-5) - Rating score (required)
 * - comment: string - Review comment (required, max 1000 chars)
 *
 * SUCCESS RESPONSE (201 Created):
 * {
 *   "id": "uuid",
 *   "project": {
 *     "id": "uuid",
 *     "category": {
 *       "name": "Krzesła"
 *     }
 *   },
 *   "reviewer": {
 *     "id": "uuid",
 *     "email": "user@example.com"
 *   },
 *   "rating": 5,
 *   "comment": "Excellent work!",
 *   "created_at": "2025-10-22T12:30:45Z"
 * }
 *
 * ERROR RESPONSES:
 * - 400 Bad Request: Invalid input data OR project is not completed
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 403 Forbidden: User is not involved in the project
 * - 404 Not Found: Project not found
 * - 409 Conflict: User already submitted a review for this project
 * - 500 Internal Server Error: Unexpected errors
 */

import type { APIRoute } from "astro";
import { ProjectIdSchema, CreateReviewSchema } from "../../../../../lib/schemas";
import { ReviewService, ReviewError } from "../../../../../lib/services/review.service";
import { createErrorResponse, createSuccessResponse } from "../../../../../lib/api-utils";
import { ZodError } from "zod";

export const POST: APIRoute = async ({ params, request, locals }) => {
  // eslint-disable-next-line no-console
  console.log("[DEBUG] POST /api/projects/{projectId}/reviews called");
  try {
    // ========================================================================
    // STEP 1: Authentication
    // Verify user is logged in (handled by middleware in locals.user)
    // ========================================================================
    const user = locals.user;
    // eslint-disable-next-line no-console
    console.log("[DEBUG] User:", user?.id, "Role:", user?.role);
    if (!user || !user.id) {
      return createErrorResponse("UNAUTHORIZED", "Wymagane uwierzytelnienie", 401);
    }

    // ========================================================================
    // STEP 2: Path Parameter Validation
    // Validate projectId path parameter using Zod schema
    // ========================================================================
    const projectIdValidation = ProjectIdSchema.safeParse(params.projectId);

    if (!projectIdValidation.success) {
      return createErrorResponse("VALIDATION_ERROR", "Nieprawidłowy format ID projektu", 400);
    }

    const projectId = projectIdValidation.data;

    // ========================================================================
    // STEP 3: Parse and Validate Request Body
    // Parse JSON body and validate with Zod schema
    // ========================================================================
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse("VALIDATION_ERROR", "Nieprawidłowe dane JSON", 400);
    }

    const validationResult = CreateReviewSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return createErrorResponse("VALIDATION_ERROR", firstError?.message || "Nieprawidłowe dane wejściowe", 400);
    }

    // ========================================================================
    // STEP 4: Create Review
    // Use ReviewService to handle business logic
    // ========================================================================
    // eslint-disable-next-line no-console
    console.log("[DEBUG] Creating review for project:", projectId);
    const reviewService = new ReviewService(locals.supabase);

    const review = await reviewService.createReview(projectId, user.id, {
      rating: validationResult.data.rating,
      comment: validationResult.data.comment,
    });

    // eslint-disable-next-line no-console
    console.log("[DEBUG] Review created successfully:", review.id);
    // Return 201 Created with review data
    return createSuccessResponse(review, 201);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[DEBUG] Error in review creation:", error);
    // Handle known business logic errors from ReviewService
    if (error instanceof ReviewError) {
      // eslint-disable-next-line no-console
      console.log("[DEBUG] ReviewError:", error.code, error.message);
      return createErrorResponse(error.code, error.message, error.statusCode);
    }

    // Handle Zod validation errors (shouldn't happen due to safeParse, but just in case)
    if (error instanceof ZodError) {
      const firstError = error.errors[0];
      // eslint-disable-next-line no-console
      console.log("[DEBUG] ZodError:", firstError?.message);
      return createErrorResponse("VALIDATION_ERROR", firstError?.message || "Błąd walidacji", 400);
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("[API] Unexpected error in POST /api/projects/{projectId}/reviews:", error);
    return createErrorResponse("INTERNAL_SERVER_ERROR", "Wystąpił nieoczekiwany błąd", 500);
  }
};

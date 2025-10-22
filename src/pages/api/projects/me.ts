/**
 * My Projects API Endpoint
 *
 * GET /api/projects/me - List current client's projects
 *
 * AUTHENTICATION: Required (Supabase Auth token)
 * AUTHORIZATION: Only users with role "client" can access this endpoint
 *
 * QUERY PARAMETERS:
 * - page: number (default: 1) - Page number
 * - limit: number (default: 20, max: 100) - Items per page
 *
 * SUCCESS RESPONSE (200 OK):
 * {
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "client_id": "uuid",
 *       "generated_image": {
 *         "id": "uuid",
 *         "image_url": "https://...",
 *         "prompt": "..."
 *       },
 *       "category": {
 *         "id": "uuid",
 *         "name": "Krzesła"
 *       },
 *       "material": {
 *         "id": "uuid",
 *         "name": "Dąb"
 *       },
 *       "status": "open",
 *       "dimensions": "100x50x80 cm",
 *       "budget_range": "1000-2000 PLN",
 *       "accepted_proposal_id": null,
 *       "accepted_price": null,
 *       "proposals_count": 3,
 *       "created_at": "2025-10-19T12:30:45Z",
 *       "updated_at": "2025-10-19T12:30:45Z"
 *     }
 *   ],
 *   "pagination": {
 *     "page": 1,
 *     "limit": 20,
 *     "total": 5,
 *     "total_pages": 1
 *   }
 * }
 *
 * ERROR RESPONSES:
 * - 400 Bad Request: Validation error
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 403 Forbidden: User role is not "client"
 * - 500 Internal Server Error: Unexpected errors
 */

import type { APIRoute } from "astro";
import { z } from "zod";
import { ProjectService, ProjectError } from "../../../lib/services/project.service";
import { createErrorResponse, createSuccessResponse } from "../../../lib/api-utils";

export const prerender = false;

// Schema for query parameters
const MyProjectsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, { message: "Numer strony musi być większy od 0" }),
  limit: z
    .string()
    .optional()
    .default("20")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 100, { message: "Limit musi być między 1 a 100" }),
});

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // ========================================================================
    // STEP 1: Authentication
    // Verify user is logged in (handled by middleware in locals.user)
    // ========================================================================
    const user = locals.user;
    if (!user || !user.role) {
      return createErrorResponse("UNAUTHORIZED", "Wymagane uwierzytelnienie", 401);
    }

    // ========================================================================
    // STEP 2: Authorization - Role Check
    // Verify user has "client" role
    // ========================================================================
    if (user.role !== "client") {
      return createErrorResponse("FORBIDDEN", "Tylko klienci mogą przeglądać swoje projekty", 403);
    }

    // ========================================================================
    // STEP 3: Input Validation
    // Parse and validate query parameters using Zod schema
    // ========================================================================
    const queryParams = {
      page: url.searchParams.get("page") || undefined,
      limit: url.searchParams.get("limit") || undefined,
    };

    const validationResult = MyProjectsQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Błędne parametry zapytania",
        400,
        Object.fromEntries(Object.entries(fieldErrors).map(([key, value]) => [key, (value as string[])[0] || ""]))
      );
    }

    // ========================================================================
    // STEP 4: List Client's Projects
    // Use ProjectService to handle business logic
    // ========================================================================
    const projectService = new ProjectService(locals.supabase);
    const result = await projectService.listMyProjects(
      {
        page: validationResult.data.page,
        limit: validationResult.data.limit,
      },
      user.id
    );

    return createSuccessResponse(result);
  } catch (error) {
    // Handle known business logic errors from ProjectService
    if (error instanceof ProjectError) {
      return createErrorResponse(error.code, error.message, error.statusCode);
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("[API] Unexpected error in GET /api/projects/me:", error);
    return createErrorResponse("INTERNAL_SERVER_ERROR", "Wystąpił nieoczekiwany błąd", 500);
  }
};

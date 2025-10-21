/**
 * Projects API Endpoint
 *
 * POST /api/projects - Create a new project
 *
 * AUTHENTICATION: Required (Supabase Auth token)
 * AUTHORIZATION: Only users with role "client" can create projects
 *
 * REQUEST BODY:
 * {
 *   "generated_image_id": "uuid-string",
 *   "category_id": "uuid-string",
 *   "material_id": "uuid-string",
 *   "dimensions": "100x50x80 cm" (optional),
 *   "budget_range": "1000-2000 PLN" (optional)
 * }
 *
 * SUCCESS RESPONSE (201 Created):
 * {
 *   "id": "uuid",
 *   "client_id": "uuid",
 *   "generated_image": {
 *     "id": "uuid",
 *     "image_url": "https://...",
 *     "prompt": "..."
 *   },
 *   "category": {
 *     "id": "uuid",
 *     "name": "Krzesła"
 *   },
 *   "material": {
 *     "id": "uuid",
 *     "name": "Dąb"
 *   },
 *   "status": "open",
 *   "dimensions": "100x50x80 cm",
 *   "budget_range": "1000-2000 PLN",
 *   "accepted_proposal_id": null,
 *   "accepted_price": null,
 *   "proposals_count": 0,
 *   "created_at": "2025-10-19T12:30:45Z",
 *   "updated_at": "2025-10-19T12:30:45Z"
 * }
 *
 * ERROR RESPONSES:
 * - 400 Bad Request: Validation error
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 403 Forbidden: User role is not "client" or image doesn't belong to user
 * - 404 Not Found: Image, category, or material not found
 * - 409 Conflict: Image already used in another project
 * - 500 Internal Server Error: Unexpected errors
 */

import type { APIRoute } from "astro";
import { CreateProjectSchema, ProjectsQuerySchema } from "../../../lib/schemas";
import { ProjectService, ProjectError } from "../../../lib/services/project.service";
import { createErrorResponse, createSuccessResponse } from "../../../lib/api-utils";
import { ZodError } from "zod";

export const prerender = false;

/**
 * GET /api/projects - List projects with filtering and pagination
 *
 * AUTHENTICATION: Required (Supabase Auth token)
 * AUTHORIZATION: Only users with role "artisan" can list projects
 *
 * QUERY PARAMETERS:
 * - status: string (default: "open") - Filter by project status
 * - category_id: string (UUID) - Filter by category
 * - material_id: string (UUID) - Filter by material
 * - page: number (default: 1) - Page number
 * - limit: number (default: 20, max: 100) - Items per page
 *
 * SUCCESS RESPONSE (200 OK):
 * {
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "client_id": "uuid",
 *       "generated_image": { ... },
 *       "category": { ... },
 *       "material": { ... },
 *       "status": "open",
 *       "dimensions": "...",
 *       "budget_range": "...",
 *       "accepted_proposal_id": null,
 *       "accepted_price": null,
 *       "created_at": "...",
 *       "updated_at": "..."
 *     }
 *   ],
 *   "pagination": {
 *     "page": 1,
 *     "limit": 20,
 *     "total": 50,
 *     "total_pages": 3
 *   }
 * }
 *
 * ERROR RESPONSES:
 * - 400 Bad Request: Validation error
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 403 Forbidden: User role is not "artisan"
 * - 500 Internal Server Error: Unexpected errors
 */
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
    // STEP 2: Input Validation
    // Parse and validate query parameters using Zod schema
    // ========================================================================
    const queryParams = {
      status: url.searchParams.get("status"),
      category_id: url.searchParams.get("category_id"),
      material_id: url.searchParams.get("material_id"),
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
    };

    const validationResult = ProjectsQuerySchema.safeParse(queryParams);

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
    // STEP 3: List Projects
    // Use ProjectService to handle authorization and business logic
    // ========================================================================
    const projectService = new ProjectService(locals.supabase);
    const result = await projectService.listProjects(
      {
        status: validationResult.data.status,
        category_id: validationResult.data.category_id,
        material_id: validationResult.data.material_id,
        page: validationResult.data.page,
        limit: validationResult.data.limit,
      },
      user.id,
      user.role
    );

    return createSuccessResponse(result);
  } catch (error) {
    // Handle known business logic errors from ProjectService
    if (error instanceof ProjectError) {
      return createErrorResponse(error.code, error.message, error.statusCode);
    }

    // Handle Zod validation errors (shouldn't happen due to safeParse, but just in case)
    if (error instanceof ZodError) {
      return createErrorResponse("VALIDATION_ERROR", "Błędne parametry zapytania", 400);
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("[API] Unexpected error in GET /api/projects:", error);
    return createErrorResponse("INTERNAL_SERVER_ERROR", "Wystąpił nieoczekiwany błąd", 500);
  }
};

/**
 * POST /api/projects - Create a new project
 */

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // ========================================================================
    // STEP 1: Authentication
    // Verify user is logged in (handled by middleware in locals.user)
    // ========================================================================
    const user = locals.user;
    if (!user) {
      return createErrorResponse("UNAUTHORIZED", "Wymagane uwierzytelnienie", 401);
    }

    // ========================================================================
    // STEP 2: Authorization - Role Check
    // Verify user has "client" role (only clients can create projects)
    // ========================================================================
    if (user.role !== "client") {
      return createErrorResponse("FORBIDDEN", "Tylko klienci mogą tworzyć projekty", 403);
    }

    // ========================================================================
    // STEP 3: Input Validation
    // Parse and validate request body using Zod schema
    // ========================================================================
    const body = await request.json();
    const validationResult = CreateProjectSchema.safeParse(body);

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Błędne dane wejściowe",
        400,
        Object.fromEntries(Object.entries(fieldErrors).map(([key, value]) => [key, (value as string[])[0] || ""]))
      );
    }

    // ========================================================================
    // STEP 4: Create Project
    // Use ProjectService to handle all business logic and database operations
    // ========================================================================
    const projectService = new ProjectService(locals.supabase);
    const project = await projectService.createProject(validationResult.data, user.id);

    // Return created project with 201 status
    return createSuccessResponse(project, 201);
  } catch (error) {
    // Handle known business logic errors from ProjectService
    if (error instanceof ProjectError) {
      return createErrorResponse(error.code, error.message, error.statusCode);
    }

    // Handle Zod validation errors (shouldn't happen due to safeParse, but just in case)
    if (error instanceof ZodError) {
      return createErrorResponse("VALIDATION_ERROR", "Błędne dane wejściowe", 400);
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("[API] Unexpected error in POST /api/projects:", error);
    return createErrorResponse("INTERNAL_SERVER_ERROR", "Wystąpił nieoczekiwany błąd", 500);
  }
};

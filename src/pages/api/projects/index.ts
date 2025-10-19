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
import { CreateProjectSchema } from "../../../lib/schemas";
import { ProjectService, ProjectError } from "../../../lib/services/project.service";
import { createErrorResponse, createSuccessResponse } from "../../../lib/api-utils";
import { ZodError } from "zod";

export const prerender = false;

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
    return createErrorResponse("INTERNAL_SERVER_ERROR", "Wystąpił nieoczekiwany błąd", 500);
  }
};

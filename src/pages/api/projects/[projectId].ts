/**
 * Project Details API Endpoint
 *
 * GET /api/projects/{projectId} - Get detailed information about a specific project
 *
 * AUTHENTICATION: Required (Supabase Auth token)
 * AUTHORIZATION:
 * - Project owner (client) can always access their project
 * - Artisans can access only open projects
 *
 * PATH PARAMETERS:
 * - projectId: string (UUID) - ID of the project to retrieve
 *
 * SUCCESS RESPONSE (200 OK):
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
 *   "proposals_count": 3,
 *   "created_at": "2025-10-19T12:30:45Z",
 *   "updated_at": "2025-10-19T12:30:45Z"
 * }
 *
 * ERROR RESPONSES:
 * - 400 Bad Request: Invalid projectId format
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 403 Forbidden: User doesn't have permission to view this project
 * - 404 Not Found: Project not found
 * - 500 Internal Server Error: Unexpected errors
 */

import type { APIRoute } from "astro";
import { ProjectIdSchema } from "../../../lib/schemas";
import { ProjectService, ProjectError } from "../../../lib/services/project.service";
import { createErrorResponse, createSuccessResponse } from "../../../lib/api-utils";
import { ZodError } from "zod";

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
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
    // Validate projectId path parameter using Zod schema
    // ========================================================================
    const validationResult = ProjectIdSchema.safeParse(params.projectId);

    if (!validationResult.success) {
      return createErrorResponse("VALIDATION_ERROR", "Nieprawidłowy format ID projektu", 400);
    }

    // ========================================================================
    // STEP 3: Get Project Details
    // Use ProjectService to handle authorization and business logic
    // ========================================================================
    const projectService = new ProjectService(locals.supabase);
    const project = await projectService.getProjectDetails(validationResult.data, user.id, user.role);

    return createSuccessResponse(project);
  } catch (error) {
    // Handle known business logic errors from ProjectService
    if (error instanceof ProjectError) {
      return createErrorResponse(error.code, error.message, error.statusCode);
    }

    // Handle Zod validation errors (shouldn't happen due to safeParse, but just in case)
    if (error instanceof ZodError) {
      return createErrorResponse("VALIDATION_ERROR", "Nieprawidłowy format ID projektu", 400);
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("[API] Unexpected error in GET /api/projects/{projectId}:", error);
    return createErrorResponse("INTERNAL_SERVER_ERROR", "Wystąpił nieoczekiwany błąd", 500);
  }
};

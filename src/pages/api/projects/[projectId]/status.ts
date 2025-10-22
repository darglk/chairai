/**
 * Update Project Status API Endpoint
 *
 * PATCH /api/projects/{projectId}/status - Update the status of a project
 *
 * AUTHENTICATION: Required (Supabase Auth token)
 * AUTHORIZATION: Only project owner (client) can update status
 *
 * PATH PARAMETERS:
 * - projectId: string (UUID) - ID of the project
 *
 * REQUEST BODY (application/json):
 * - status: "open" | "in_progress" | "completed" | "closed"
 *
 * SUCCESS RESPONSE (200 OK):
 * {
 *   "id": "uuid",
 *   "status": "completed",
 *   "updated_at": "2025-10-22T10:00:00Z"
 * }
 *
 * BUSINESS RULES - Valid status transitions:
 * - open -> closed
 * - in_progress -> completed, closed
 * - completed -> closed
 * - closed -> (no transitions allowed)
 *
 * Note: Transition from "open" to "in_progress" is only allowed via acceptProposal endpoint
 *
 * ERROR RESPONSES:
 * - 400 Bad Request: Invalid input data OR invalid status transition
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 403 Forbidden: User is not the project owner
 * - 404 Not Found: Project not found
 * - 500 Internal Server Error: Unexpected errors
 */

import type { APIRoute } from "astro";
import { ProjectIdSchema, UpdateProjectStatusSchema } from "../../../../lib/schemas";
import { ProjectService, ProjectError } from "../../../../lib/services/project.service";
import { createErrorResponse, createSuccessResponse } from "../../../../lib/api-utils";
import { ZodError } from "zod";

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // ========================================================================
    // STEP 1: Authentication
    // Verify user is logged in (handled by middleware in locals.user)
    // ========================================================================
    const user = locals.user;
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
    // STEP 3: Parse Request Body
    // Extract status from JSON body
    // ========================================================================
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      return createErrorResponse("VALIDATION_ERROR", "Nieprawidłowe dane JSON", 400);
    }

    // ========================================================================
    // STEP 4: Input Validation
    // Validate status using Zod schema
    // ========================================================================
    const validationResult = UpdateProjectStatusSchema.safeParse(requestBody);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return createErrorResponse("VALIDATION_ERROR", firstError?.message || "Nieprawidłowe dane wejściowe", 400);
    }

    const { status } = validationResult.data;

    // ========================================================================
    // STEP 5: Update Project Status
    // Use ProjectService to handle business logic and status transition validation
    // ========================================================================
    const projectService = new ProjectService(locals.supabase);

    const updatedProject = await projectService.updateProjectStatus(projectId, status, user.id);

    // Return 200 OK with updated project data
    return createSuccessResponse(updatedProject, 200);
  } catch (error) {
    // Handle known business logic errors from ProjectService
    if (error instanceof ProjectError) {
      return createErrorResponse(error.code, error.message, error.statusCode);
    }

    // Handle Zod validation errors (shouldn't happen due to safeParse, but just in case)
    if (error instanceof ZodError) {
      const firstError = error.errors[0];
      return createErrorResponse("VALIDATION_ERROR", firstError?.message || "Błąd walidacji", 400);
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("[API] Unexpected error in PATCH /api/projects/{projectId}/status:", error);
    return createErrorResponse("INTERNAL_SERVER_ERROR", "Wystąpił nieoczekiwany błąd", 500);
  }
};

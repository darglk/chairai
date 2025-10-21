/**
 * Create Proposal API Endpoint
 *
 * POST /api/projects/{projectId}/proposals - Create a new proposal for a project
 *
 * AUTHENTICATION: Required (Supabase Auth token)
 * AUTHORIZATION: Only artisans can create proposals
 *
 * PATH PARAMETERS:
 * - projectId: string (UUID) - ID of the project to submit proposal for
 *
 * REQUEST BODY (multipart/form-data):
 * - price: number - Proposed price for the project (positive, max 1,000,000 PLN)
 * - attachment: File - Proposal attachment (PDF, JPG, PNG; max 5MB)
 *
 * SUCCESS RESPONSE (201 Created):
 * {
 *   "id": "uuid",
 *   "project_id": "uuid",
 *   "artisan": {
 *     "user_id": "uuid",
 *     "company_name": "Firma Stolarstwo",
 *     "average_rating": 4.5,
 *     "total_reviews": 12
 *   },
 *   "price": 2500,
 *   "attachment_url": "https://...",
 *   "created_at": "2025-10-21T12:30:45Z"
 * }
 *
 * ERROR RESPONSES:
 * - 400 Bad Request: Invalid input data (price, attachment validation errors)
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 403 Forbidden: User is not an artisan OR project is not open
 * - 404 Not Found: Project not found
 * - 409 Conflict: Artisan already submitted a proposal for this project
 * - 500 Internal Server Error: Unexpected errors
 */

import type { APIRoute } from "astro";
import { ProjectIdSchema, CreateProposalSchema } from "../../../../lib/schemas";
import { ProposalService, ProposalError } from "../../../../lib/services/proposal.service";
import { createErrorResponse, createSuccessResponse } from "../../../../lib/api-utils";
import { ZodError } from "zod";

export const prerender = false;

export const POST: APIRoute = async ({ params, request, locals }) => {
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
    // STEP 3: Parse multipart/form-data
    // Extract price and attachment from form data
    // ========================================================================
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return createErrorResponse("VALIDATION_ERROR", "Nieprawidłowe dane formularza", 400);
    }

    const priceString = formData.get("price");
    const attachment = formData.get("attachment");

    // Convert price string to number
    const price = priceString ? parseFloat(priceString.toString()) : null;

    // ========================================================================
    // STEP 4: Input Validation
    // Validate price and attachment using Zod schema
    // ========================================================================
    const validationResult = CreateProposalSchema.safeParse({
      price,
      attachment,
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return createErrorResponse("VALIDATION_ERROR", firstError?.message || "Nieprawidłowe dane wejściowe", 400);
    }

    // ========================================================================
    // STEP 5: Create Proposal
    // Use ProposalService to handle business logic and file upload
    // ========================================================================
    const proposalService = new ProposalService(locals.supabase);

    const proposal = await proposalService.createProposal({
      projectId,
      price: validationResult.data.price,
      attachment: validationResult.data.attachment,
      userId: user.id,
    });

    // Return 201 Created with proposal data
    return createSuccessResponse(proposal, 201);
  } catch (error) {
    // Handle known business logic errors from ProposalService
    if (error instanceof ProposalError) {
      return createErrorResponse(error.code, error.message, error.statusCode);
    }

    // Handle Zod validation errors (shouldn't happen due to safeParse, but just in case)
    if (error instanceof ZodError) {
      const firstError = error.errors[0];
      return createErrorResponse("VALIDATION_ERROR", firstError?.message || "Błąd walidacji", 400);
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("[API] Unexpected error in POST /api/projects/{projectId}/proposals:", error);
    return createErrorResponse("INTERNAL_SERVER_ERROR", "Wystąpił nieoczekiwany błąd", 500);
  }
};

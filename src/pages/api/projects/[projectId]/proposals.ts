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

/**
 * Get Proposals API Endpoint
 *
 * GET /api/projects/{projectId}/proposals - Get all proposals for a project
 *
 * AUTHENTICATION: Required (Supabase Auth token)
 * AUTHORIZATION: Only project owner can view proposals
 *
 * PATH PARAMETERS:
 * - projectId: string (UUID) - ID of the project
 *
 * SUCCESS RESPONSE (200 OK):
 * [
 *   {
 *     "id": "uuid",
 *     "project_id": "uuid",
 *     "artisan_id": "uuid",
 *     "price": 2500,
 *     "message": "Optional message",
 *     "attachment_url": "https://...",
 *     "created_at": "2025-10-21T12:30:45Z",
 *     "artisan_profile": {
 *       "company_name": "Firma Stolarstwo",
 *       "city": "Warszawa",
 *       "user": {
 *         "full_name": "Jan Kowalski"
 *       }
 *     }
 *   }
 * ]
 *
 * ERROR RESPONSES:
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 403 Forbidden: User is not the project owner
 * - 404 Not Found: Project not found
 * - 500 Internal Server Error: Unexpected errors
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const user = locals.user;
    if (!user || !user.id) {
      return createErrorResponse("UNAUTHORIZED", "Wymagane uwierzytelnienie", 401);
    }

    const projectIdValidation = ProjectIdSchema.safeParse(params.projectId);
    if (!projectIdValidation.success) {
      return createErrorResponse("VALIDATION_ERROR", "Nieprawidłowy format ID projektu", 400);
    }

    const projectId = projectIdValidation.data;

    // Check if user owns the project or is artisan with accepted proposal
    const { data: project, error: projectError } = await locals.supabase
      .from("projects")
      .select("id, client_id, status, accepted_proposal_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return createErrorResponse("NOT_FOUND", "Projekt nie został znaleziony", 404);
    }

    const isOwner = project.client_id === user.id;

    // Check if user is artisan with accepted proposal (for completed/in_progress projects)
    let isArtisanWithAcceptedProposal = false;
    if (!isOwner && user.role === "artisan" && project.accepted_proposal_id) {
      const { data: artisanProposal } = await locals.supabase
        .from("proposals")
        .select("id")
        .eq("id", project.accepted_proposal_id)
        .eq("artisan_id", user.id)
        .maybeSingle();

      isArtisanWithAcceptedProposal = !!artisanProposal;
    }

    if (!isOwner && !isArtisanWithAcceptedProposal) {
      return createErrorResponse("FORBIDDEN", "Nie masz dostępu do ofert tego projektu", 403);
    }

    // Fetch proposals with artisan details
    // Note: proposals.artisan_id -> users.id -> artisan_profiles.user_id
    const { data: proposals, error: proposalsError } = await locals.supabase
      .from("proposals")
      .select(
        `
        id,
        project_id,
        artisan_id,
        price,
        message,
        attachment_url,
        created_at,
        users!proposals_artisan_id_fkey (
          artisan_profiles (
            company_name
          )
        )
      `
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (proposalsError) {
      // eslint-disable-next-line no-console
      console.error("[API] Error fetching proposals:", proposalsError);
      return createErrorResponse("INTERNAL_SERVER_ERROR", "Nie udało się pobrać ofert", 500);
    }

    // Transform data to match expected structure
    // proposals.users.artisan_profiles -> proposals.artisan_profiles
    const transformedProposals = (proposals || []).map((proposal) => ({
      id: proposal.id,
      project_id: proposal.project_id,
      artisan_id: proposal.artisan_id,
      price: proposal.price,
      message: proposal.message,
      attachment_url: proposal.attachment_url,
      created_at: proposal.created_at,
      artisan_profiles: {
        company_name: proposal.users?.artisan_profiles?.company_name || "Nieznany rzemieślnik",
      },
    }));

    return createSuccessResponse({ data: transformedProposals });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[API] Unexpected error in GET /api/projects/{projectId}/proposals:", error);
    return createErrorResponse("INTERNAL_SERVER_ERROR", "Wystąpił nieoczekiwany błąd", 500);
  }
};

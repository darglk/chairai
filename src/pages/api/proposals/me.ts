/**
 * My Proposals API Endpoint
 *
 * GET /api/proposals/me - Get all proposals submitted by the authenticated artisan
 *
 * AUTHENTICATION: Required (Supabase Auth token)
 * AUTHORIZATION: Only artisans can access this endpoint
 *
 * QUERY PARAMETERS:
 * - status: ProjectStatus (optional) - Filter by project status
 * - page: number (optional, default: 1)
 * - limit: number (optional, default: 10)
 *
 * SUCCESS RESPONSE (200 OK):
 * {
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "project": {
 *         "id": "uuid",
 *         "status": "in_progress",
 *         "category": {
 *           "id": "uuid",
 *           "name": "Krzesła"
 *         },
 *         "generated_image": {
 *           "image_url": "https://..."
 *         }
 *       },
 *       "price": 2500,
 *       "attachment_url": "https://...",
 *       "created_at": "2025-10-22T12:30:45Z",
 *       "is_accepted": true
 *     }
 *   ],
 *   "pagination": {
 *     "page": 1,
 *     "limit": 10,
 *     "total": 5,
 *     "total_pages": 1
 *   }
 * }
 *
 * ERROR RESPONSES:
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 403 Forbidden: User is not an artisan
 * - 500 Internal Server Error: Unexpected errors
 */

import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../../lib/api-utils";

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // ========================================================================
    // STEP 1: Authentication
    // ========================================================================
    const user = locals.user;
    if (!user || !user.id) {
      return createErrorResponse("UNAUTHORIZED", "Wymagane uwierzytelnienie", 401);
    }

    if (user.role !== "artisan") {
      return createErrorResponse("FORBIDDEN", "Tylko rzemieślnicy mają dostęp do tego zasobu", 403);
    }

    // ========================================================================
    // STEP 2: Parse Query Parameters
    // ========================================================================
    const statusParam = url.searchParams.get("status");
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");

    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    // ========================================================================
    // STEP 3: Fetch Proposals with Project Details
    // Note: Use explicit relationship name to avoid ambiguity
    // proposals.project_id -> projects.id (not the fk_accepted_proposal)
    // ========================================================================
    let query = locals.supabase
      .from("proposals")
      .select(
        `
        id,
        price,
        attachment_url,
        created_at,
        projects!proposals_project_id_fkey (
          id,
          status,
          accepted_proposal_id,
          categories!inner (
            id,
            name
          ),
          generated_images!inner (
            image_url
          )
        )
      `,
        { count: "exact" }
      )
      .eq("artisan_id", user.id)
      .order("created_at", { ascending: false });

    // Apply status filter if provided
    if (statusParam && ["open", "in_progress", "completed", "closed"].includes(statusParam)) {
      query = query.eq("projects.status", statusParam as "open" | "in_progress" | "completed" | "closed");
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: proposals, error: proposalsError, count } = await query;

    if (proposalsError) {
      // eslint-disable-next-line no-console
      console.error("[API] Error fetching artisan proposals:", proposalsError);
      return createErrorResponse("INTERNAL_SERVER_ERROR", "Nie udało się pobrać ofert", 500);
    }

    // ========================================================================
    // STEP 4: Transform Data to Match MyProposalDTO
    // ========================================================================
    const transformedProposals = (proposals || [])
      .filter((proposal) => {
        // Filter out proposals with missing project data
        return proposal.projects && proposal.projects.categories && proposal.projects.generated_images;
      })
      .map((proposal) => ({
        id: proposal.id,
        project: {
          id: proposal.projects.id,
          status: proposal.projects.status,
          category: {
            id: proposal.projects.categories.id,
            name: proposal.projects.categories.name,
          },
          generated_image: {
            image_url: proposal.projects.generated_images.image_url,
          },
        },
        price: proposal.price,
        attachment_url: proposal.attachment_url || "",
        created_at: proposal.created_at,
        is_accepted: proposal.projects.accepted_proposal_id === proposal.id,
      }));

    // ========================================================================
    // STEP 5: Calculate Pagination Metadata
    // ========================================================================
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return createSuccessResponse({
      data: transformedProposals,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[API] Unexpected error in GET /api/proposals/me:", error);
    return createErrorResponse("INTERNAL_SERVER_ERROR", "Wystąpił nieoczekiwany błąd", 500);
  }
};

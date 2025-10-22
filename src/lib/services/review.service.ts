/**
 * Review Service
 *
 * Service responsible for managing project reviews.
 * Handles review creation, validation, and business logic around review lifecycle.
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateReviewCommand, ReviewDTO, ArtisanReviewsResponseDTO } from "../../types";

/**
 * Custom error class for review-related business logic errors
 */
export class ReviewError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode = 400
  ) {
    super(message);
    this.name = "ReviewError";
  }
}

/**
 * Service for managing project reviews
 *
 * Provides methods for creating and managing reviews, including validation
 * of business rules (project completion, user authorization, duplicate prevention).
 */
export class ReviewService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Creates a new review for a completed project
   *
   * Business rules:
   * - Project must exist
   * - Project must have status 'completed'
   * - Reviewer must be either the client or the artisan of the project
   * - User cannot review the same project twice
   *
   * @param projectId - ID of the project being reviewed
   * @param reviewerId - ID of the user creating the review
   * @param dto - Review creation data (rating, comment)
   * @returns Promise containing the created review with full details
   * @throws ReviewError if validation fails or business rules are violated
   *
   * @example
   * const review = await reviewService.createReview(
   *   "project-uuid",
   *   "user-uuid",
   *   { rating: 5, comment: "Excellent work!" }
   * );
   */
  async createReview(projectId: string, reviewerId: string, dto: CreateReviewCommand): Promise<ReviewDTO> {
    // Step 1: Fetch project and verify it exists
    const { data: project, error: projectError } = await this.supabase
      .from("projects")
      .select(
        `
        id,
        client_id,
        status,
        accepted_proposal_id
      `
      )
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      throw new ReviewError("Nie znaleziono projektu", "PROJECT_NOT_FOUND", 404);
    }

    // Step 2: Verify project is completed
    if (project.status !== "completed") {
      throw new ReviewError("Można recenzować tylko zakończone projekty", "PROJECT_NOT_COMPLETED", 400);
    }

    // Step 3: Determine if reviewer is authorized and identify reviewee
    const isClient = reviewerId === project.client_id;

    // Get artisan ID from accepted proposal
    let artisanId: string | null = null;
    if (project.accepted_proposal_id) {
      const { data: acceptedProposal } = await this.supabase
        .from("proposals")
        .select("artisan_id")
        .eq("id", project.accepted_proposal_id)
        .single();

      artisanId = acceptedProposal?.artisan_id || null;
    }

    const isArtisan = artisanId && reviewerId === artisanId;

    if (!isClient && !isArtisan) {
      throw new ReviewError("Nie masz uprawnień do recenzowania tego projektu", "REVIEW_FORBIDDEN", 403);
    }

    // Step 4: Check if user already reviewed this project
    const { data: existingReview } = await this.supabase
      .from("reviews")
      .select("id")
      .eq("project_id", projectId)
      .eq("reviewer_id", reviewerId)
      .maybeSingle();

    if (existingReview) {
      throw new ReviewError("Już dodałeś recenzję do tego projektu", "REVIEW_ALREADY_EXISTS", 409);
    }

    // Step 5: Determine reviewee (who is being reviewed)
    const revieweeId = isClient ? artisanId : project.client_id;

    if (!revieweeId) {
      throw new ReviewError("Nie można określić recenzowanej osoby", "REVIEWEE_NOT_FOUND", 400);
    }

    // Step 6: Create the review
    const { data: newReview, error: createError } = await this.supabase
      .from("reviews")
      .insert({
        project_id: projectId,
        reviewer_id: reviewerId,
        reviewee_id: revieweeId,
        rating: dto.rating,
        comment: dto.comment || null,
      })
      .select(
        `
        id,
        project_id,
        reviewer_id,
        reviewee_id,
        rating,
        comment,
        created_at
      `
      )
      .single();

    if (createError || !newReview) {
      throw new ReviewError("Nie udało się utworzyć recenzji", "REVIEW_CREATE_FAILED", 500);
    }

    // Step 7: Fetch complete review data with relations for DTO
    const { data: completeReview, error: fetchError } = await this.supabase
      .from("reviews")
      .select(
        `
        id,
        rating,
        comment,
        created_at,
        project:projects(
          id,
          category:categories(name)
        )
      `
      )
      .eq("id", newReview.id)
      .single();

    if (fetchError || !completeReview) {
      throw new ReviewError("Nie udało się pobrać utworzonej recenzji", "REVIEW_FETCH_FAILED", 500);
    }

    // Step 8: Get reviewer data - for now just use ID
    // TODO: In future, fetch from auth.users or add display name to public.users

    // Step 9: Transform to ReviewDTO
    return {
      id: completeReview.id,
      project: {
        id: completeReview.project.id,
        category: {
          name: completeReview.project.category.name,
        },
      },
      reviewer: {
        id: reviewerId,
        name: "Użytkownik", // Placeholder - email is in auth.users which requires admin access
      },
      rating: completeReview.rating,
      comment: completeReview.comment,
      created_at: completeReview.created_at,
    };
  }

  /**
   * Gets paginated reviews for an artisan with summary statistics
   *
   * @param artisanId - ID of the artisan
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 20, max: 100)
   * @returns Promise containing reviews data, pagination metadata, and summary statistics
   * @throws ReviewError if artisan not found or database error occurs
   *
   * @example
   * const result = await reviewService.getArtisanReviews("artisan-uuid", 1, 20);
   */
  async getArtisanReviews(artisanId: string, page = 1, limit = 20): Promise<ArtisanReviewsResponseDTO> {
    // Validate and normalize pagination parameters
    const normalizedPage = Math.max(1, page);
    const normalizedLimit = Math.max(1, Math.min(100, limit));

    // Call database function to get reviews and summary
    // @ts-expect-error - Database types not yet updated with new RPC function
    const { data, error } = (await this.supabase.rpc("get_artisan_reviews_and_summary", {
      artisan_id_param: artisanId,
      page_num: normalizedPage,
      page_size: normalizedLimit,
    })) as { data: ArtisanReviewsResponseDTO | null; error: { code?: string } | null };

    if (error) {
      // Check if error is due to artisan not found
      if (error.code === "P0001") {
        throw new ReviewError("Nie znaleziono rzemieślnika", "ARTISAN_NOT_FOUND", 404);
      }
      throw new ReviewError("Nie udało się pobrać recenzji", "REVIEWS_FETCH_FAILED", 500);
    }

    if (!data) {
      throw new ReviewError("Nie otrzymano danych z bazy", "NO_DATA_RETURNED", 500);
    }

    return data;
  }
}

/**
 * Generated Images Service
 *
 * Service responsible for managing user-generated AI furniture images.
 * Handles database queries, pagination, filtering, and quota tracking.
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type {
  GeneratedImagesListResponseDTO,
  GeneratedImageDTO,
  GeneratedImagesQueryParams,
  PaginationMetaDTO,
} from "../../types";
import { getMaxFreeGenerations } from "./ai-image.service";

/**
 * Service for managing generated images
 *
 * Provides methods to retrieve, filter, and manage AI-generated furniture images.
 * Handles pagination, quota tracking, and usage status tracking.
 */
export class GeneratedImagesService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Retrieves paginated list of user's generated images with optional filtering
   *
   * Fetches all AI-generated furniture images created by a specific user,
   * with support for pagination and filtering by usage status.
   * Calculates remaining generation quota based on max free generations
   * configured in the system.
   *
   * Note: This method expects already validated parameters from GeneratedImagesQuerySchema.
   * The page and limit are guaranteed to be positive numbers with limit <= 100.
   *
   * @param userId - The unique identifier of the user (UUID)
   * @param params - Validated query parameters including pagination and filters
   *   - page: Page number (1-indexed, default: 1)
   *   - limit: Items per page (1-100, default: 20)
   *   - unused_only: If true, returns only images not used in projects (default: false)
   *
   * @returns Promise resolving to GeneratedImagesListResponseDTO containing:
   *   - data: Array of GeneratedImageDTO objects
   *   - pagination: Metadata for pagination (page, limit, total, total_pages)
   *   - remaining_generations: Number of generations remaining for user
   *
   * @throws Error if database query fails
   *
   * @example
   * const params = { page: 1, limit: 20, unused_only: false };
   * const result = await service.listUserGeneratedImages(userId, params);
   * // Returns: {
   * //   data: [...],
   * //   pagination: { page: 1, limit: 20, total: 45, total_pages: 3 },
   * //   remaining_generations: 5
   * // }
   */
  async listUserGeneratedImages(
    userId: string,
    params: Required<GeneratedImagesQueryParams> & { page: number; limit: number }
  ): Promise<GeneratedImagesListResponseDTO> {
    // Guard clause: Validate user ID
    if (!userId || !userId.trim()) {
      throw new Error("User ID is required");
    }

    // ========================================================================
    // STEP 1: Get total count of images for pagination
    // ========================================================================
    // Note: We don't filter by unused_only at database level to avoid RLS infinite recursion
    // with projects table. Instead, we'll mark is_used=false for all images for now.
    // The unused_only filter is ignored until RLS policies are fixed.

    const countQuery = this.supabase
      .from("generated_images")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      throw new Error(`Failed to fetch total count: ${countError.message}`);
    }

    const total = totalCount ?? 0;

    // ========================================================================
    // STEP 2: Fetch paginated list of images
    // ========================================================================

    const dataQuery = this.supabase
      .from("generated_images")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // Apply pagination
    const offset = (params.page - 1) * params.limit;
    const paginatedQuery = dataQuery.range(offset, offset + params.limit - 1);

    const { data: images, error: dataError } = await paginatedQuery;

    if (dataError) {
      throw new Error(`Failed to fetch images: ${dataError.message}`);
    }

    // ========================================================================
    // STEP 3: Map to DTO with is_used flag
    // ========================================================================
    // Note: Setting is_used to false for all images to avoid RLS infinite recursion
    // TODO: Fix RLS policies on projects table to enable proper is_used detection

    const imageDTOs: GeneratedImageDTO[] = (images || []).map((img) => ({
      id: img.id,
      user_id: img.user_id,
      prompt: img.prompt,
      image_url: img.image_url,
      created_at: img.created_at,
      is_used: false, // Temporarily set to false due to RLS recursion issue
    }));

    // ========================================================================
    // STEP 4: Calculate remaining generation quota
    // ========================================================================

    const maxGenerations = getMaxFreeGenerations();
    const remainingGenerations = Math.max(0, maxGenerations - total);

    // ========================================================================
    // STEP 5: Build pagination metadata
    // ========================================================================

    const paginationMeta: PaginationMetaDTO = {
      page: params.page,
      limit: params.limit,
      total: total,
      total_pages: Math.ceil(total / params.limit),
    };

    // ========================================================================
    // STEP 6: Return response
    // ========================================================================

    return {
      data: imageDTOs,
      pagination: paginationMeta,
      remaining_generations: remainingGenerations,
    };
  }
}

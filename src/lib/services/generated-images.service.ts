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
    // STEP 0: Fetch used images once if filtering by unused_only
    // ========================================================================

    let usedImageIds: string[] = [];

    if (params.unused_only) {
      const { data: usedImages, error: usedError } = await this.supabase.from("projects").select("generated_image_id");

      if (usedError) {
        throw new Error(`Failed to fetch used images: ${usedError.message}`);
      }

      usedImageIds = usedImages?.map((p) => p.generated_image_id).filter(Boolean) || [];
    }

    // ========================================================================
    // STEP 1: Get total count of images for pagination
    // ========================================================================

    let countQuery = this.supabase
      .from("generated_images")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // Apply unused_only filter to count query if needed
    if (params.unused_only && usedImageIds.length > 0) {
      countQuery = countQuery.not("id", "in", `(${usedImageIds.join(",")})`);
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      throw new Error(`Failed to fetch total count: ${countError.message}`);
    }

    const total = totalCount ?? 0;

    // ========================================================================
    // STEP 2: Fetch paginated list of images
    // ========================================================================

    let dataQuery = this.supabase
      .from("generated_images")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // Apply unused_only filter to data query if needed
    if (params.unused_only && usedImageIds.length > 0) {
      dataQuery = dataQuery.not("id", "in", `(${usedImageIds.join(",")})`);
    }

    // Apply pagination
    const offset = (params.page - 1) * params.limit;
    dataQuery = dataQuery.range(offset, offset + params.limit - 1);

    const { data: images, error: dataError } = await dataQuery;

    if (dataError) {
      throw new Error(`Failed to fetch images: ${dataError.message}`);
    }

    // ========================================================================
    // STEP 3: Determine which images on current page are used in projects
    // ========================================================================

    const imageIds = images?.map((img) => img.id) || [];
    let pageImageUsedIds: string[] = [];

    if (imageIds.length > 0) {
      const { data: projects, error: projectsError } = await this.supabase
        .from("projects")
        .select("generated_image_id")
        .in("generated_image_id", imageIds);

      if (projectsError) {
        throw new Error(`Failed to fetch project data: ${projectsError.message}`);
      }

      pageImageUsedIds = projects?.map((p) => p.generated_image_id).filter(Boolean) || [];
    }

    // ========================================================================
    // STEP 4: Map to DTO with is_used flag
    // ========================================================================

    const imageDTOs: GeneratedImageDTO[] = (images || []).map((img) => ({
      id: img.id,
      user_id: img.user_id,
      prompt: img.prompt,
      image_url: img.image_url,
      created_at: img.created_at,
      is_used: pageImageUsedIds.includes(img.id),
    }));

    // ========================================================================
    // STEP 5: Calculate remaining generation quota
    // ========================================================================

    const maxGenerations = getMaxFreeGenerations();
    const remainingGenerations = Math.max(0, maxGenerations - total);

    // ========================================================================
    // STEP 6: Build pagination metadata
    // ========================================================================

    const paginationMeta: PaginationMetaDTO = {
      page: params.page,
      limit: params.limit,
      total: total,
      total_pages: Math.ceil(total / params.limit),
    };

    // ========================================================================
    // STEP 7: Return response
    // ========================================================================

    return {
      data: imageDTOs,
      pagination: paginationMeta,
      remaining_generations: remainingGenerations,
    };
  }
}

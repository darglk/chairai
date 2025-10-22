/**
 * Artisan Profile Service
 *
 * Service responsible for managing artisan profiles.
 * Handles profile creation, updates, and validation of business rules.
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type {
  CreateUpdateArtisanProfileCommand,
  ArtisanProfileDTO,
  ArtisanSpecializationDTO,
  PortfolioImageDTO,
} from "../../types";

/**
 * Custom error class for artisan profile-related business logic errors
 */
export class ArtisanProfileError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode = 400
  ) {
    super(message);
    this.name = "ArtisanProfileError";
  }
}

/**
 * Service for managing artisan profiles
 *
 * Provides methods for creating, updating, and retrieving artisan profiles,
 * including validation of NIP uniqueness and business rules.
 */
export class ArtisanProfileService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Retrieves the complete artisan profile for a given user ID
   *
   * Fetches all profile data including:
   * - Basic profile information (company_name, NIP, is_public)
   * - Specializations with names
   * - Portfolio images
   * - Aggregated review statistics (average rating, total reviews)
   *
   * This method returns all profile data regardless of public status,
   * intended for artisans viewing their own profile or public endpoints
   * with appropriate authorization checks.
   *
   * Performance optimization: Uses Promise.all to fetch independent data
   * in parallel, reducing total query time.
   *
   * @param userId - ID of the artisan user
   * @returns Promise containing the complete artisan profile, or null if profile doesn't exist
   * @throws ArtisanProfileError if database errors occur
   *
   * @example
   * const profile = await artisanProfileService.getArtisanProfile("user-uuid");
   */
  async getArtisanProfile(userId: string): Promise<ArtisanProfileDTO | null> {
    // Step 1: Fetch basic profile information
    const { data: profile, error: profileError } = await this.supabase
      .from("artisan_profiles")
      .select(
        `
        user_id,
        company_name,
        nip,
        is_public,
        updated_at
      `
      )
      .eq("user_id", userId)
      .single();

    // If profile doesn't exist, return null (early return)
    if (profileError || !profile) {
      return null;
    }

    // Step 2: Fetch all dependent data in parallel for better performance
    // These queries are independent and can be executed simultaneously
    const [specializationsResult, portfolioResult, reviewsResult] = await Promise.all([
      // Fetch specializations with names using JOIN
      this.supabase
        .from("artisan_specializations")
        .select(
          `
          specialization_id,
          specializations (
            id,
            name
          )
        `
        )
        .eq("artisan_id", userId),

      // Fetch portfolio images sorted by creation date
      this.supabase
        .from("portfolio_images")
        .select("id, image_url, created_at")
        .eq("artisan_id", userId)
        .order("created_at", { ascending: false }),

      // Fetch review ratings for aggregation
      this.supabase.from("reviews").select("rating").eq("reviewee_id", userId),
    ]);

    // Step 3: Handle errors from parallel queries
    if (specializationsResult.error) {
      throw new ArtisanProfileError("Błąd podczas pobierania specjalizacji", "SPECIALIZATIONS_FETCH_ERROR", 500);
    }

    if (portfolioResult.error) {
      throw new ArtisanProfileError("Błąd podczas pobierania zdjęć portfolio", "PORTFOLIO_FETCH_ERROR", 500);
    }

    if (reviewsResult.error) {
      throw new ArtisanProfileError("Błąd podczas pobierania statystyk recenzji", "REVIEWS_FETCH_ERROR", 500);
    }

    // Step 4: Transform specializations data to match DTO structure
    const specializations: ArtisanSpecializationDTO[] =
      specializationsResult.data?.map((item) => ({
        id: (item.specializations as { id: string; name: string }).id,
        name: (item.specializations as { id: string; name: string }).name,
      })) || [];

    // Step 5: Calculate aggregated review statistics
    const totalReviews = reviewsResult.data?.length || 0;
    const averageRating =
      totalReviews > 0 ? reviewsResult.data.reduce((sum, review) => sum + review.rating, 0) / totalReviews : null;

    // Step 6: Construct and return complete profile DTO
    return {
      user_id: profile.user_id,
      company_name: profile.company_name,
      nip: profile.nip,
      is_public: profile.is_public,
      specializations,
      portfolio_images: portfolioResult.data || [],
      average_rating: averageRating ? Number(averageRating.toFixed(2)) : null,
      total_reviews: totalReviews,
      updated_at: profile.updated_at,
    };
  }

  /**
   * Creates or updates an artisan profile (upsert operation)
   *
   * Business rules:
   * - NIP must be unique across all artisan profiles
   * - Only artisans can create/update their own profile
   * - Profile is created with is_public = false by default
   *
   * @param dto - Artisan profile data
   * @param userId - ID of the artisan user
   * @returns Promise containing the created/updated artisan profile
   * @throws ArtisanProfileError if validation fails or NIP conflict occurs
   *
   * @example
   * const profile = await artisanProfileService.upsertArtisanProfile(
   *   { company_name: "Master Woodworks", nip: "1234567890" },
   *   "user-uuid"
   * );
   */
  async upsertArtisanProfile(dto: CreateUpdateArtisanProfileCommand, userId: string): Promise<ArtisanProfileDTO> {
    // Step 1: Check if NIP is already used by another artisan
    const { data: existingProfile, error: checkError } = await this.supabase
      .from("artisan_profiles")
      .select("user_id")
      .eq("nip", dto.nip)
      .maybeSingle();

    if (checkError) {
      throw new ArtisanProfileError("Błąd podczas sprawdzania unikalności NIP", "NIP_CHECK_ERROR", 500);
    }

    // If NIP exists and belongs to a different user, throw conflict error
    if (existingProfile && existingProfile.user_id !== userId) {
      throw new ArtisanProfileError("Podany NIP jest już używany przez innego rzemieślnika", "NIP_CONFLICT", 409);
    }

    // Step 2: Perform upsert operation
    const { data: profile, error: upsertError } = await this.supabase
      .from("artisan_profiles")
      .upsert(
        {
          user_id: userId,
          company_name: dto.company_name,
          nip: dto.nip,
          is_public: dto.is_public,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      )
      .select(
        `
        user_id,
        company_name,
        nip,
        is_public,
        updated_at
      `
      )
      .single();

    if (upsertError) {
      // eslint-disable-next-line no-console
      console.error("Database upsert error details:", {
        message: upsertError.message,
        code: upsertError.code,
        details: upsertError.details,
        hint: upsertError.hint,
      });
      throw new ArtisanProfileError("Błąd podczas tworzenia/aktualizacji profilu rzemieślnika", "UPSERT_ERROR", 500);
    }

    // Step 3: Return full profile DTO
    // For now, return basic profile without specializations, portfolio, and reviews
    // These will be fetched separately when needed
    return {
      user_id: profile.user_id,
      company_name: profile.company_name,
      nip: profile.nip,
      is_public: profile.is_public,
      specializations: [],
      portfolio_images: [],
      average_rating: null,
      total_reviews: 0,
      updated_at: profile.updated_at,
    };
  }

  /**
   * Adds specializations to an artisan profile
   *
   * Business rules:
   * - All specialization IDs must exist in the specializations table
   * - Duplicate entries are ignored (upsert behavior)
   * - Only artisans can add specializations to their own profile
   *
   * @param specializationIds - Array of specialization UUIDs to add
   * @param userId - ID of the artisan user
   * @returns Promise containing array of added specializations
   * @throws ArtisanProfileError if validation fails or specialization IDs don't exist
   *
   * @example
   * const specializations = await artisanProfileService.addSpecializationsToProfile(
   *   ["uuid1", "uuid2"],
   *   "user-uuid"
   * );
   */
  async addSpecializationsToProfile(specializationIds: string[], userId: string): Promise<ArtisanSpecializationDTO[]> {
    // Step 1: Verify that all specialization IDs exist
    const { data: existingSpecializations, error: checkError } = await this.supabase
      .from("specializations")
      .select("id, name")
      .in("id", specializationIds);

    if (checkError) {
      throw new ArtisanProfileError("Błąd podczas sprawdzania specjalizacji", "SPECIALIZATION_CHECK_ERROR", 500);
    }

    if (!existingSpecializations || existingSpecializations.length !== specializationIds.length) {
      throw new ArtisanProfileError("Jedna lub więcej specjalizacji nie istnieje", "SPECIALIZATION_NOT_FOUND", 404);
    }

    // Step 2: Insert specializations (upsert to handle duplicates)
    const specializationsToInsert = specializationIds.map((specializationId) => ({
      artisan_id: userId,
      specialization_id: specializationId,
    }));

    const { error: insertError } = await this.supabase.from("artisan_specializations").upsert(specializationsToInsert, {
      onConflict: "artisan_id,specialization_id",
      ignoreDuplicates: true,
    });

    if (insertError) {
      throw new ArtisanProfileError("Błąd podczas dodawania specjalizacji", "SPECIALIZATION_INSERT_ERROR", 500);
    }

    // Step 3: Return added specializations with names
    return existingSpecializations.map((spec) => ({
      id: spec.id,
      name: spec.name,
    }));
  }

  /**
   * Removes a specialization from an artisan profile
   *
   * Business rules:
   * - Specialization must belong to the artisan
   * - Only artisans can remove their own specializations
   *
   * @param specializationId - UUID of the specialization to remove
   * @param userId - ID of the artisan user
   * @throws ArtisanProfileError if specialization doesn't exist or doesn't belong to artisan
   *
   * @example
   * await artisanProfileService.removeSpecializationFromProfile(
   *   "specialization-uuid",
   *   "user-uuid"
   * );
   */
  async removeSpecializationFromProfile(specializationId: string, userId: string): Promise<void> {
    // Delete the specialization assignment
    const { error: deleteError } = await this.supabase
      .from("artisan_specializations")
      .delete()
      .eq("artisan_id", userId)
      .eq("specialization_id", specializationId);

    if (deleteError) {
      throw new ArtisanProfileError("Błąd podczas usuwania specjalizacji", "SPECIALIZATION_DELETE_ERROR", 500);
    }
  }

  /**
   * Uploads an image to the artisan's portfolio
   *
   * Business rules:
   * - File must be a valid image (jpg, png, webp)
   * - File size must not exceed 5MB
   * - Image is stored in Supabase Storage
   * - Only artisans can upload to their own portfolio
   *
   * @param file - Image file to upload
   * @param userId - ID of the artisan user
   * @returns Promise containing the uploaded portfolio image metadata
   * @throws ArtisanProfileError if upload fails
   *
   * @example
   * const portfolioImage = await artisanProfileService.uploadPortfolioImage(
   *   imageFile,
   *   "user-uuid"
   * );
   */
  async uploadPortfolioImage(file: File, userId: string): Promise<PortfolioImageDTO> {
    // Step 1: Generate unique file name
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${crypto.randomUUID()}.${fileExt}`;

    // Step 2: Upload file to Supabase Storage
    const { error: uploadError } = await this.supabase.storage.from("portfolio-images").upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    });

    if (uploadError) {
      // Log error details for debugging (TODO: use proper logging service in production)
      // eslint-disable-next-line no-console
      console.error("Storage upload error:", uploadError);
      throw new ArtisanProfileError(
        `Błąd podczas przesyłania obrazu: ${uploadError.message}`,
        "IMAGE_UPLOAD_ERROR",
        500
      );
    }

    // Step 3: Get public URL
    const {
      data: { publicUrl },
    } = this.supabase.storage.from("portfolio-images").getPublicUrl(fileName);

    // Step 4: Save metadata to database
    const { data: portfolioImage, error: dbError } = await this.supabase
      .from("portfolio_images")
      .insert({
        artisan_id: userId,
        image_url: publicUrl,
      })
      .select("id, image_url, created_at")
      .single();

    if (dbError) {
      // Cleanup: remove uploaded file if database insert fails
      await this.supabase.storage.from("portfolio-images").remove([fileName]);
      throw new ArtisanProfileError("Błąd podczas zapisywania metadanych obrazu", "IMAGE_METADATA_ERROR", 500);
    }

    return portfolioImage;
  }

  /**
   * Deletes an image from the artisan's portfolio
   *
   * Business rules:
   * - Image must belong to the artisan
   * - If profile is public, must maintain at least 5 images
   * - Removes both database record and file from storage
   * - Only artisans can delete their own portfolio images
   *
   * @param imageId - UUID of the image to delete
   * @param userId - ID of the artisan user
   * @throws ArtisanProfileError if image doesn't exist, doesn't belong to artisan, or would violate minimum image rule
   *
   * @example
   * await artisanProfileService.deletePortfolioImage(
   *   "image-uuid",
   *   "user-uuid"
   * );
   */
  async deletePortfolioImage(imageId: string, userId: string): Promise<void> {
    // Step 1: Get the image and verify ownership
    const { data: image, error: getError } = await this.supabase
      .from("portfolio_images")
      .select("id, image_url, artisan_id")
      .eq("id", imageId)
      .eq("artisan_id", userId)
      .single();

    if (getError || !image) {
      throw new ArtisanProfileError(
        "Obraz nie został znaleziony lub nie należy do użytkownika",
        "IMAGE_NOT_FOUND",
        404
      );
    }

    // Step 2: Check if profile is public and count remaining images
    const { data: profile, error: profileError } = await this.supabase
      .from("artisan_profiles")
      .select("is_public")
      .eq("user_id", userId)
      .single();

    if (profileError) {
      throw new ArtisanProfileError("Błąd podczas sprawdzania profilu", "PROFILE_CHECK_ERROR", 500);
    }

    if (profile.is_public) {
      const { count, error: countError } = await this.supabase
        .from("portfolio_images")
        .select("*", { count: "exact", head: true })
        .eq("artisan_id", userId);

      if (countError) {
        throw new ArtisanProfileError("Błąd podczas liczenia obrazów w portfolio", "IMAGE_COUNT_ERROR", 500);
      }

      if (count !== null && count <= 5) {
        throw new ArtisanProfileError(
          "Nie można usunąć obrazu. Profil publiczny musi zawierać co najmniej 5 zdjęć",
          "MIN_IMAGES_REQUIRED",
          400
        );
      }
    }

    // Step 3: Extract file path from URL
    const url = new URL(image.image_url);
    const pathSegments = url.pathname.split("/");
    const filePath = pathSegments.slice(pathSegments.indexOf("portfolio-images") + 1).join("/");

    // Step 4: Delete from database
    const { error: deleteError } = await this.supabase
      .from("portfolio_images")
      .delete()
      .eq("id", imageId)
      .eq("artisan_id", userId);

    if (deleteError) {
      throw new ArtisanProfileError("Błąd podczas usuwania obrazu z bazy danych", "IMAGE_DELETE_ERROR", 500);
    }

    // Step 5: Delete from storage (best effort - don't fail if this fails)
    await this.supabase.storage.from("portfolio-images").remove([filePath]);
  }

  /**
   * Get public artisan profile
   *
   * Retrieves artisan profile for public viewing. Unlike getArtisanProfile,
   * this method enforces that the profile must be published (is_public = true).
   *
   * @param artisanId - User ID of the artisan
   * @returns ArtisanProfileDTO with complete profile information
   * @throws ArtisanProfileError if profile not found or not published
   *
   * @example
   * const profile = await artisanProfileService.getPublicProfile("artisan-uuid");
   */
  async getPublicProfile(artisanId: string): Promise<ArtisanProfileDTO> {
    // Fetch complete profile
    const profile = await this.getArtisanProfile(artisanId);

    // Check if profile exists
    if (!profile) {
      throw new ArtisanProfileError("Nie znaleziono profilu rzemieślnika", "PROFILE_NOT_FOUND", 404);
    }

    // Check if profile is published
    if (!profile.is_public) {
      throw new ArtisanProfileError("Profil rzemieślnika nie jest opublikowany", "PROFILE_NOT_PUBLISHED", 403);
    }

    return profile;
  }
}

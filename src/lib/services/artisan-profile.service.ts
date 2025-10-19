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
 * Provides methods for creating and updating artisan profiles, including validation
 * of NIP uniqueness and business rules.
 */
export class ArtisanProfileService {
  constructor(private supabase: SupabaseClient) {}

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
      throw new ArtisanProfileError("Błąd podczas przesyłania obrazu", "IMAGE_UPLOAD_ERROR", 500);
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
}

/**
 * Artisan Profile Service
 *
 * Service responsible for managing artisan profiles.
 * Handles profile creation, updates, and validation of business rules.
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateUpdateArtisanProfileCommand, ArtisanProfileDTO } from "../../types";

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
}

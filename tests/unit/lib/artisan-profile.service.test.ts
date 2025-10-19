import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@/db/supabase.client";
import { ArtisanProfileService, ArtisanProfileError } from "@/lib/services/artisan-profile.service";
import type { CreateUpdateArtisanProfileCommand } from "@/types";

/**
 * Testy jednostkowe: ArtisanProfileService
 *
 * Sprawdzają logikę biznesową tworzenia/aktualizacji profili rzemieślników,
 * walidację unikalności NIP i obsługę błędów.
 */
describe("Unit: ArtisanProfileService", () => {
  let mockSupabase: SupabaseClient;
  let service: ArtisanProfileService;

  const mockUserId = "artisan-123";
  const mockOtherUserId = "artisan-456";

  const validCommand: CreateUpdateArtisanProfileCommand = {
    company_name: "Master Woodworks",
    nip: "1234567890",
  };

  const createMockSupabase = () => {
    const mockFrom = vi.fn();

    return {
      from: mockFrom,
    } as unknown as SupabaseClient;
  };

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    service = new ArtisanProfileService(mockSupabase);
    vi.clearAllMocks();
  });

  describe("Pomyślne utworzenie profilu", () => {
    it("powinien utworzyć nowy profil rzemieślnika", async () => {
      const mockProfile = {
        user_id: mockUserId,
        company_name: "Master Woodworks",
        nip: "1234567890",
        is_public: false,
        updated_at: "2025-10-19T12:00:00Z",
      };

      let callIndex = 0;
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callIndex++;

        if (callIndex === 1) {
          // First call: check NIP uniqueness
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }

        if (callIndex === 2) {
          // Second call: upsert profile
          return {
            upsert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
          };
        }

        return {};
      });

      const result = await service.upsertArtisanProfile(validCommand, mockUserId);

      expect(result.user_id).toBe(mockUserId);
      expect(result.company_name).toBe("Master Woodworks");
      expect(result.nip).toBe("1234567890");
      expect(result.is_public).toBe(false);
      expect(result.specializations).toEqual([]);
      expect(result.portfolio_images).toEqual([]);
      expect(result.average_rating).toBeNull();
      expect(result.total_reviews).toBe(0);
    });
  });

  describe("Pomyślna aktualizacja profilu", () => {
    it("powinien zaktualizować istniejący profil rzemieślnika", async () => {
      const existingProfile = {
        user_id: mockUserId,
      };

      const updatedProfile = {
        user_id: mockUserId,
        company_name: "Updated Woodworks",
        nip: "1234567890",
        is_public: false,
        updated_at: "2025-10-19T13:00:00Z",
      };

      let callIndex = 0;
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callIndex++;

        if (callIndex === 1) {
          // First call: check NIP - same user owns it
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: existingProfile, error: null }),
          };
        }

        if (callIndex === 2) {
          // Second call: upsert profile (update)
          return {
            upsert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: updatedProfile, error: null }),
          };
        }

        return {};
      });

      const result = await service.upsertArtisanProfile(
        { company_name: "Updated Woodworks", nip: "1234567890" },
        mockUserId
      );

      expect(result.company_name).toBe("Updated Woodworks");
    });
  });

  describe("Konflikt NIP", () => {
    it("powinien rzucić błąd gdy NIP jest już używany przez innego rzemieślnika", async () => {
      const existingProfile = {
        user_id: mockOtherUserId, // Different user
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: existingProfile, error: null }),
      }));

      await expect(service.upsertArtisanProfile(validCommand, mockUserId)).rejects.toThrow(ArtisanProfileError);

      await expect(service.upsertArtisanProfile(validCommand, mockUserId)).rejects.toThrow(
        "Podany NIP jest już używany przez innego rzemieślnika"
      );
    });

    it("powinien zwrócić kod błędu NIP_CONFLICT", async () => {
      const existingProfile = {
        user_id: mockOtherUserId,
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: existingProfile, error: null }),
      }));

      try {
        await service.upsertArtisanProfile(validCommand, mockUserId);
      } catch (error) {
        expect(error).toBeInstanceOf(ArtisanProfileError);
        if (error instanceof ArtisanProfileError) {
          expect(error.code).toBe("NIP_CONFLICT");
          expect(error.statusCode).toBe(409);
        }
      }
    });
  });

  describe("Błędy bazy danych", () => {
    it("powinien rzucić błąd gdy sprawdzenie NIP nie powiedzie się", async () => {
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: "Database error" } }),
      }));

      await expect(service.upsertArtisanProfile(validCommand, mockUserId)).rejects.toThrow(ArtisanProfileError);

      try {
        await service.upsertArtisanProfile(validCommand, mockUserId);
      } catch (error) {
        if (error instanceof ArtisanProfileError) {
          expect(error.code).toBe("NIP_CHECK_ERROR");
          expect(error.statusCode).toBe(500);
        }
      }
    });

    it("powinien rzucić błąd gdy operacja upsert nie powiedzie się", async () => {
      let callIndex = 0;
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callIndex++;

        if (callIndex === 1) {
          // First call: NIP check succeeds
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }

        if (callIndex === 2) {
          // Second call: upsert fails
          return {
            upsert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { message: "Upsert failed" } }),
          };
        }

        return {};
      });

      await expect(service.upsertArtisanProfile(validCommand, mockUserId)).rejects.toThrow(ArtisanProfileError);

      try {
        await service.upsertArtisanProfile(validCommand, mockUserId);
      } catch (error) {
        if (error instanceof ArtisanProfileError) {
          expect(error.code).toBe("UPSERT_ERROR");
          expect(error.statusCode).toBe(500);
        }
      }
    });
  });

  describe("Walidacja danych biznesowych", () => {
    it("powinien pozwolić na zmianę nazwy firmy bez zmiany NIP", async () => {
      const existingProfile = {
        user_id: mockUserId,
      };

      const updatedProfile = {
        user_id: mockUserId,
        company_name: "New Company Name",
        nip: "1234567890",
        is_public: false,
        updated_at: "2025-10-19T14:00:00Z",
      };

      let callIndex = 0;
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callIndex++;

        if (callIndex === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: existingProfile, error: null }),
          };
        }

        if (callIndex === 2) {
          return {
            upsert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: updatedProfile, error: null }),
          };
        }

        return {};
      });

      const result = await service.upsertArtisanProfile(
        { company_name: "New Company Name", nip: "1234567890" },
        mockUserId
      );

      expect(result.company_name).toBe("New Company Name");
    });

    it("powinien pozwolić na zmianę NIP na nowy, nieużywany", async () => {
      const mockProfile = {
        user_id: mockUserId,
        company_name: "Master Woodworks",
        nip: "9876543210",
        is_public: false,
        updated_at: "2025-10-19T15:00:00Z",
      };

      let callIndex = 0;
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callIndex++;

        if (callIndex === 1) {
          // New NIP is not used
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }

        if (callIndex === 2) {
          return {
            upsert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
          };
        }

        return {};
      });

      const result = await service.upsertArtisanProfile(
        { company_name: "Master Woodworks", nip: "9876543210" },
        mockUserId
      );

      expect(result.nip).toBe("9876543210");
    });
  });
});

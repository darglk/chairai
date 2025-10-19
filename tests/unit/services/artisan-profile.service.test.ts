/**
 * Unit tests for ArtisanProfileService
 *
 * Tests the business logic for managing artisan profiles, specializations, and portfolio images.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { ArtisanProfileService, ArtisanProfileError } from "@/lib/services/artisan-profile.service";
import type { SupabaseClient } from "@/db/supabase.client";

// Mock Supabase client with type-safe structure
const createMockSupabaseClient = () => {
  const mockFrom = vi.fn();
  const mockStorage = {
    from: vi.fn(),
  };

  return {
    from: mockFrom,
    storage: mockStorage,
  } as unknown as SupabaseClient;
};

describe("ArtisanProfileService - Specializations", () => {
  let service: ArtisanProfileService;
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    service = new ArtisanProfileService(mockSupabase);
    vi.clearAllMocks();
  });

  describe("addSpecializationsToProfile()", () => {
    const userId = "artisan-uuid";
    const specializationIds = ["spec-uuid-1", "spec-uuid-2"];

    it("powinien pomyślnie dodać specjalizacje do profilu", async () => {
      // Mock successful verification of specializations
      const mockSelect = vi.fn().mockReturnThis();
      const mockIn = vi.fn().mockResolvedValue({
        data: [
          { id: "spec-uuid-1", name: "Stoły" },
          { id: "spec-uuid-2", name: "Krzesła" },
        ],
        error: null,
      });

      // Mock successful upsert
      const mockUpsert = vi.fn().mockResolvedValue({
        error: null,
      });

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
        in: mockIn,
        upsert: mockUpsert,
      });

      const result = await service.addSpecializationsToProfile(specializationIds, userId);

      expect(result).toEqual([
        { id: "spec-uuid-1", name: "Stoły" },
        { id: "spec-uuid-2", name: "Krzesła" },
      ]);
      expect(mockSupabase.from).toHaveBeenCalledWith("specializations");
      expect(mockSupabase.from).toHaveBeenCalledWith("artisan_specializations");
    });

    it("powinien rzucić błąd gdy nie wszystkie specjalizacje istnieją", async () => {
      // Mock verification returning only 1 specialization instead of 2
      const mockSelect = vi.fn().mockReturnThis();
      const mockIn = vi.fn().mockResolvedValue({
        data: [{ id: "spec-uuid-1", name: "Stoły" }],
        error: null,
      });

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
        in: mockIn,
      });

      await expect(service.addSpecializationsToProfile(specializationIds, userId)).rejects.toThrow(ArtisanProfileError);
    });

    it("powinien rzucić błąd gdy weryfikacja specjalizacji zawiedzie", async () => {
      // Mock database error during verification
      const mockSelect = vi.fn().mockReturnThis();
      const mockIn = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
        in: mockIn,
      });

      await expect(service.addSpecializationsToProfile(specializationIds, userId)).rejects.toThrow(ArtisanProfileError);
    });

    it("powinien rzucić błąd gdy wstawianie specjalizacji zawiedzie", async () => {
      // Mock successful verification
      const mockSelect = vi.fn().mockReturnThis();
      const mockIn = vi.fn().mockResolvedValue({
        data: [
          { id: "spec-uuid-1", name: "Stoły" },
          { id: "spec-uuid-2", name: "Krzesła" },
        ],
        error: null,
      });

      // Mock failed upsert
      const mockUpsert = vi.fn().mockResolvedValue({
        error: { message: "Insert error" },
      });

      (mockSupabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          select: mockSelect,
          in: mockIn,
        })
        .mockReturnValueOnce({
          upsert: mockUpsert,
        });

      await expect(service.addSpecializationsToProfile(specializationIds, userId)).rejects.toThrow(ArtisanProfileError);
    });
  });

  describe("removeSpecializationFromProfile()", () => {
    const userId = "artisan-uuid";
    const specializationId = "spec-uuid-1";

    it("powinien pomyślnie usunąć specjalizację z profilu", async () => {
      // Mock successful delete with chained .eq().eq()
      const mockEq2 = vi.fn().mockResolvedValue({
        error: null,
      });
      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });
      const mockDelete = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        delete: mockDelete,
      });

      await service.removeSpecializationFromProfile(specializationId, userId);

      expect(mockSupabase.from).toHaveBeenCalledWith("artisan_specializations");
      expect(mockDelete).toHaveBeenCalled();
    });

    it("powinien rzucić błąd gdy usuwanie zawiedzie", async () => {
      // Mock failed delete with chained .eq().eq()
      const mockEq2 = vi.fn().mockResolvedValue({
        error: { message: "Delete error" },
      });
      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });
      const mockDelete = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        delete: mockDelete,
      });

      await expect(service.removeSpecializationFromProfile(specializationId, userId)).rejects.toThrow(
        ArtisanProfileError
      );
    });
  });
});

describe("ArtisanProfileService - Portfolio Images", () => {
  let service: ArtisanProfileService;
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    service = new ArtisanProfileService(mockSupabase);
    vi.clearAllMocks();
  });

  describe("uploadPortfolioImage()", () => {
    const userId = "artisan-uuid";
    const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });

    it("powinien pomyślnie przesłać obraz do portfolio", async () => {
      // Mock successful storage upload
      const mockUpload = vi.fn().mockResolvedValue({
        error: null,
      });

      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: "https://storage.supabase.co/test.jpg" },
      });

      const mockStorageFrom = vi.fn().mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      });

      (mockSupabase.storage as unknown as { from: typeof mockStorageFrom }).from = mockStorageFrom;

      // Mock successful database insert
      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: "image-uuid",
          image_url: "https://storage.supabase.co/test.jpg",
          created_at: "2025-10-19T12:00:00Z",
        },
        error: null,
      });

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      });

      const result = await service.uploadPortfolioImage(mockFile, userId);

      expect(result).toEqual({
        id: "image-uuid",
        image_url: "https://storage.supabase.co/test.jpg",
        created_at: "2025-10-19T12:00:00Z",
      });
      expect(mockStorageFrom).toHaveBeenCalledWith("portfolio-images");
      expect(mockSupabase.from).toHaveBeenCalledWith("portfolio_images");
    });

    it("powinien rzucić błąd gdy przesyłanie do storage zawiedzie", async () => {
      // Mock failed storage upload
      const mockUpload = vi.fn().mockResolvedValue({
        error: { message: "Upload error" },
      });

      const mockStorageFrom = vi.fn().mockReturnValue({
        upload: mockUpload,
      });

      (mockSupabase.storage as unknown as { from: typeof mockStorageFrom }).from = mockStorageFrom;

      await expect(service.uploadPortfolioImage(mockFile, userId)).rejects.toThrow(ArtisanProfileError);
    });

    it("powinien wykonać rollback gdy zapis metadanych zawiedzie", async () => {
      // Mock successful storage upload
      const mockUpload = vi.fn().mockResolvedValue({
        error: null,
      });

      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: "https://storage.supabase.co/test.jpg" },
      });

      const mockRemove = vi.fn().mockResolvedValue({});

      const mockStorageFrom = vi.fn().mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        remove: mockRemove,
      });

      (mockSupabase.storage as unknown as { from: typeof mockStorageFrom }).from = mockStorageFrom;

      // Mock failed database insert
      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      });

      await expect(service.uploadPortfolioImage(mockFile, userId)).rejects.toThrow(ArtisanProfileError);
      expect(mockRemove).toHaveBeenCalled(); // Verify cleanup was attempted
    });
  });

  describe("deletePortfolioImage()", () => {
    const userId = "artisan-uuid";
    const imageId = "image-uuid";

    it("powinien pomyślnie usunąć obraz z portfolio (profil niepubliczny)", async () => {
      // Mock get image
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: imageId,
          image_url: "https://storage.supabase.co/portfolio-images/artisan-uuid/test.jpg",
          artisan_id: userId,
        },
        error: null,
      });

      // Mock get profile (not public)
      const mockProfileSingle = vi.fn().mockResolvedValue({
        data: { is_public: false },
        error: null,
      });

      // Mock delete from database with chained .eq().eq()
      const mockDeleteEq2 = vi.fn().mockResolvedValue({
        error: null,
      });
      const mockDeleteEq1 = vi.fn().mockReturnValue({
        eq: mockDeleteEq2,
      });
      const mockDelete = vi.fn().mockReturnValue({
        eq: mockDeleteEq1,
      });

      // Mock storage delete
      const mockRemove = vi.fn().mockResolvedValue({});
      const mockStorageFrom = vi.fn().mockReturnValue({
        remove: mockRemove,
      });

      (mockSupabase.storage as unknown as { from: typeof mockStorageFrom }).from = mockStorageFrom;

      (mockSupabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          select: mockSelect,
          eq: mockEq,
          single: mockSingle,
        })
        .mockReturnValueOnce({
          select: mockSelect,
          eq: mockEq,
          single: mockProfileSingle,
        })
        .mockReturnValueOnce({
          delete: mockDelete,
        });

      await service.deletePortfolioImage(imageId, userId);

      expect(mockRemove).toHaveBeenCalled();
    });

    it("powinien rzucić błąd gdy obraz nie istnieje lub nie należy do użytkownika", async () => {
      // Mock image not found
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      });

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      await expect(service.deletePortfolioImage(imageId, userId)).rejects.toThrow(ArtisanProfileError);
    });

    it("powinien rzucić błąd gdy profil publiczny ma tylko 5 zdjęć", async () => {
      // Mock get image
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: imageId,
          image_url: "https://storage.supabase.co/portfolio-images/test.jpg",
          artisan_id: userId,
        },
        error: null,
      });

      // Mock get profile (public)
      const mockProfileSingle = vi.fn().mockResolvedValue({
        data: { is_public: true },
        error: null,
      });

      // Mock count images (exactly 5)
      const mockSelectCount = vi.fn().mockReturnThis();
      const mockEqCount = vi.fn().mockResolvedValue({
        count: 5,
        error: null,
      });

      (mockSupabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          select: mockSelect,
          eq: mockEq,
          single: mockSingle,
        })
        .mockReturnValueOnce({
          select: mockSelect,
          eq: mockEq,
          single: mockProfileSingle,
        })
        .mockReturnValueOnce({
          select: mockSelectCount,
          eq: mockEqCount,
        });

      await expect(service.deletePortfolioImage(imageId, userId)).rejects.toThrow(ArtisanProfileError);
    });

    it("powinien pozwolić na usunięcie gdy profil publiczny ma więcej niż 5 zdjęć", async () => {
      // Mock get image
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: imageId,
          image_url: "https://storage.supabase.co/portfolio-images/artisan-uuid/test.jpg",
          artisan_id: userId,
        },
        error: null,
      });

      // Mock get profile (public)
      const mockProfileSingle = vi.fn().mockResolvedValue({
        data: { is_public: true },
        error: null,
      });

      // Mock count images (6 images)
      const mockSelectCount = vi.fn().mockReturnThis();
      const mockEqCount = vi.fn().mockResolvedValue({
        count: 6,
        error: null,
      });

      // Mock delete from database with chained .eq().eq()
      const mockDeleteEq2 = vi.fn().mockResolvedValue({
        error: null,
      });
      const mockDeleteEq1 = vi.fn().mockReturnValue({
        eq: mockDeleteEq2,
      });
      const mockDelete = vi.fn().mockReturnValue({
        eq: mockDeleteEq1,
      });

      // Mock storage delete
      const mockRemove = vi.fn().mockResolvedValue({});
      const mockStorageFrom = vi.fn().mockReturnValue({
        remove: mockRemove,
      });

      (mockSupabase.storage as unknown as { from: typeof mockStorageFrom }).from = mockStorageFrom;

      (mockSupabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          select: mockSelect,
          eq: mockEq,
          single: mockSingle,
        })
        .mockReturnValueOnce({
          select: mockSelect,
          eq: mockEq,
          single: mockProfileSingle,
        })
        .mockReturnValueOnce({
          select: mockSelectCount,
          eq: mockEqCount,
        })
        .mockReturnValueOnce({
          delete: mockDelete,
        });

      await service.deletePortfolioImage(imageId, userId);

      expect(mockRemove).toHaveBeenCalled();
    });
  });
});

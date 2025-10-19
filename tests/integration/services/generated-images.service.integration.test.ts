import { describe, it, expect, beforeEach, vi } from "vitest";
import type { SupabaseClient } from "@/db/supabase.client";
import { GeneratedImagesService } from "@/lib/services/generated-images.service";
import type { GeneratedImagesQueryParams } from "@/types";

vi.mock("@/lib/services/ai-image.service", () => ({
  getMaxFreeGenerations: vi.fn(() => 10),
}));

/**
 * Integracja testowa: GeneratedImagesService + Supabase
 *
 * Testy integracyjne sprawdzają całą logikę serwisu GeneratedImagesService
 * wraz z prawidłowym obsługiwaniem paginacji, filtrowania i obliczania limitów.
 */
describe("Integration: GeneratedImagesService", () => {
  let mockSupabase: SupabaseClient;
  let service: GeneratedImagesService;

  const mockUserId = "test-user-123";

  const createMockImage = (id: string, prompt = "test prompt", createdAt = new Date().toISOString(), isUsed = false) => ({
    id,
    user_id: mockUserId,
    prompt,
    image_url: `https://images.example.com/${id}.jpg`,
    created_at: createdAt,
    is_used: isUsed,
  });

  const createMockSupabase = (selectResolvedValues: unknown[]) => {
    let fromCallIndex = 0;

    return {
      from: vi.fn(() => {
        const selectValue = selectResolvedValues[fromCallIndex];
        fromCallIndex++;

        // Create a chainable promise-like object
        const createChainable = (value: unknown): unknown => {
          // Always resolve with the value (Supabase returns errors in the object, not as rejection)
          const promise = Promise.resolve(value);

          return Object.assign(promise, {
            eq: vi.fn(() => createChainable(value)),
            not: vi.fn(() => createChainable(value)),
            in: vi.fn(() => createChainable(value)),
            order: vi.fn(() => createChainable(value)),
            range: vi.fn(() => createChainable(value)),
          });
        };

        return {
          select: vi.fn(() => createChainable(selectValue)),
          eq: vi.fn(() => createChainable(selectValue)),
          not: vi.fn(() => createChainable(selectValue)),
          in: vi.fn(() => createChainable(selectValue)),
          order: vi.fn(() => createChainable(selectValue)),
          range: vi.fn(() => createChainable(selectValue)),
        };
      }),
    } as unknown as SupabaseClient;
  };

  beforeEach(() => {
    // Each test creates its own mockSupabase and service instances
  });

  describe("Pusta lista", () => {
    it("zwraca pustą listę dla użytkownika bez obrazów", async () => {
      const mockSelect = [
        { count: 0, error: null },
        { data: [], error: null },
        { count: 0, error: null }, // total images count for quota
      ];

      mockSupabase = createMockSupabase(mockSelect);
      service = new GeneratedImagesService(mockSupabase);

      const params: Required<GeneratedImagesQueryParams> & {
        page: number;
        limit: number;
      } = {
        page: 1,
        limit: 20,
        unused_only: false,
      };

      const result = await service.listUserGeneratedImages(mockUserId, params);

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.remaining_generations).toBe(10);
    });
  });

  describe("Paginacja", () => {
    it("zwraca prawidłową stronę obrazów", async () => {
      const params: Required<GeneratedImagesQueryParams> & {
        page: number;
        limit: number;
      } = {
        page: 1,
        limit: 5,
        unused_only: false,
      };

      const mockImages = Array.from({ length: 12 }, (_, i) => createMockImage(`image-${i}`));

      const mockSelect = [
        { count: 12, error: null },
        { data: mockImages.slice(0, 5), error: null },
        { count: 12, error: null }, // total images count for quota
      ];

      mockSupabase = createMockSupabase(mockSelect);
      service = new GeneratedImagesService(mockSupabase);

      const result = await service.listUserGeneratedImages(mockUserId, params);

      expect(result.data).toHaveLength(5);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.total).toBe(12);
      expect(result.pagination.total_pages).toBe(3);
    });

    it("obsługuje ostatnią stronę", async () => {
      const params: Required<GeneratedImagesQueryParams> & {
        page: number;
        limit: number;
      } = {
        page: 3,
        limit: 5,
        unused_only: false,
      };

      const mockImages = Array.from({ length: 12 }, (_, i) => createMockImage(`image-${i}`));

      const mockSelect = [
        { count: 12, error: null },
        { data: mockImages.slice(10, 12), error: null },
        { count: 12, error: null }, // total images count for quota
      ];

      mockSupabase = createMockSupabase(mockSelect);
      service = new GeneratedImagesService(mockSupabase);

      const result = await service.listUserGeneratedImages(mockUserId, params);

      expect(result.data).toHaveLength(2);
      expect(result.pagination.page).toBe(3);
      expect(result.pagination.total_pages).toBe(3);
    });
  });

  describe("Filtrowanie unused_only", () => {
    it("zwraca tylko nieużyte obrazy", async () => {
      const params: Required<GeneratedImagesQueryParams> & {
        page: number;
        limit: number;
      } = {
        page: 1,
        limit: 20,
        unused_only: true,
      };

      const mockImages = [createMockImage("image-1", "prompt", new Date().toISOString(), false), createMockImage("image-2", "prompt", new Date().toISOString(), false)];

      // Z filtrowanym unused_only=true, zwracamy tylko nieużyte obrazy (is_used=false)
      // Dodajemy trzecie zapytanie dla total images (quota calculation)
      const mockSelect = [
        { count: 2, error: null }, // count dla filtered query
        { data: mockImages, error: null }, // data dla filtered query
        { count: 5, error: null }, // count dla total images (quota)
      ];

      mockSupabase = createMockSupabase(mockSelect);
      service = new GeneratedImagesService(mockSupabase);

      const result = await service.listUserGeneratedImages(mockUserId, params);

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.data[0].is_used).toBe(false);
      expect(result.data[1].is_used).toBe(false);
    });

    it("poprawnie oznacza obrazy jako użyte lub nieużyte", async () => {
      const params: Required<GeneratedImagesQueryParams> & {
        page: number;
        limit: number;
      } = {
        page: 1,
        limit: 20,
        unused_only: false,
      };

      const mockImages = [
        createMockImage("image-1", "prompt", new Date().toISOString(), true),
        createMockImage("image-2", "prompt", new Date().toISOString(), false),
        createMockImage("image-3", "prompt", new Date().toISOString(), true),
      ];

      const mockSelect = [
        { count: 3, error: null },
        { data: mockImages, error: null },
        { count: 3, error: null }, // total images count for quota
      ];

      mockSupabase = createMockSupabase(mockSelect);
      service = new GeneratedImagesService(mockSupabase);

      const result = await service.listUserGeneratedImages(mockUserId, params);

      // Sprawdź że flagi is_used są poprawnie ustawione z bazy danych
      expect(result.data[0].is_used).toBe(true);
      expect(result.data[1].is_used).toBe(false);
      expect(result.data[2].is_used).toBe(true);
    });

  });

  describe("Limit generacji", () => {
    it("oblicza pozostałe generacje", async () => {
      const params: Required<GeneratedImagesQueryParams> & {
        page: number;
        limit: number;
      } = {
        page: 1,
        limit: 20,
        unused_only: false,
      };

      const mockImages = Array.from({ length: 7 }, (_, i) => createMockImage(`image-${i}`));

      const mockSelect = [
        { count: 7, error: null },
        { data: mockImages, error: null },
        { count: 7, error: null }, // total images count for quota
      ];

      mockSupabase = createMockSupabase(mockSelect);
      service = new GeneratedImagesService(mockSupabase);

      const result = await service.listUserGeneratedImages(mockUserId, params);

      expect(result.remaining_generations).toBe(3);
    });

    it("zwraca 0 przy osiągnięciu limitu", async () => {
      const params: Required<GeneratedImagesQueryParams> & {
        page: number;
        limit: number;
      } = {
        page: 1,
        limit: 20,
        unused_only: false,
      };

      const mockImages = Array.from({ length: 10 }, (_, i) => createMockImage(`image-${i}`));

      const mockSelect = [
        { count: 10, error: null },
        { data: mockImages, error: null },
        { count: 10, error: null }, // total images count for quota
      ];

      mockSupabase = createMockSupabase(mockSelect);
      service = new GeneratedImagesService(mockSupabase);

      const result = await service.listUserGeneratedImages(mockUserId, params);

      expect(result.remaining_generations).toBe(0);
    });
  });

  describe("Błędy", () => {
    it("wyrzuca błąd dla pustego userId", async () => {
      mockSupabase = createMockSupabase([]);
      service = new GeneratedImagesService(mockSupabase);

      const params: Required<GeneratedImagesQueryParams> & {
        page: number;
        limit: number;
      } = {
        page: 1,
        limit: 20,
        unused_only: false,
      };

      await expect(service.listUserGeneratedImages("", params)).rejects.toThrow("User ID is required");
    });

    it("wyrzuca błąd gdy baza danych zawiedzie", async () => {
      const params: Required<GeneratedImagesQueryParams> & {
        page: number;
        limit: number;
      } = {
        page: 1,
        limit: 20,
        unused_only: false,
      };

      const mockSelect = [
        {
          count: null,
          error: { message: "DB error" },
        },
      ];

      mockSupabase = createMockSupabase(mockSelect);
      service = new GeneratedImagesService(mockSupabase);

      await expect(service.listUserGeneratedImages(mockUserId, params)).rejects.toThrow("Failed to fetch total count");
    });
  });

  describe("Duże zbiory danych", () => {
    it("obsługuje 1000+ obrazów", async () => {
      const params: Required<GeneratedImagesQueryParams> & {
        page: number;
        limit: number;
      } = {
        page: 1,
        limit: 50,
        unused_only: false,
      };

      const mockImages = Array.from({ length: 50 }, (_, i) => createMockImage(`image-${i}`));

      const mockSelect = [
        { count: 1000, error: null },
        { data: mockImages, error: null },
        { count: 1000, error: null }, // total images count for quota
      ];

      mockSupabase = createMockSupabase(mockSelect);
      service = new GeneratedImagesService(mockSupabase);

      const result = await service.listUserGeneratedImages(mockUserId, params);

      expect(result.data).toHaveLength(50);
      expect(result.pagination.total).toBe(1000);
      expect(result.pagination.total_pages).toBe(20);
    });
  });
});

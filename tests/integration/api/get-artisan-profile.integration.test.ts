/**
 * Integration tests for GET /api/artisans/{artisanId}
 *
 * Tests the complete flow of retrieving public artisan profiles.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { APIContext } from "astro";
import { GET } from "@/pages/api/artisans/[artisanId]";
import type { SupabaseClient } from "@/db/supabase.client";

// Mock helper to create APIContext
const createMockContext = (params: { artisanId: string }): APIContext => {
  return {
    params,
    locals: {
      supabase: createMockSupabaseClient(),
    },
  } as unknown as APIContext;
};

// Mock Supabase client
const createMockSupabaseClient = () => {
  const mockFrom = vi.fn();

  return {
    from: mockFrom,
  } as unknown as SupabaseClient;
};

describe("Integration: GET /api/artisans/{artisanId}", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Validation", () => {
    it("powinien zwrócić 400 gdy artisanId nie jest poprawnym UUID", async () => {
      const context = createMockContext({ artisanId: "invalid-uuid" });

      const response = await GET(context);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
      expect(json.error.message).toContain("Nieprawidłowy format");
    });
  });

  describe("Business Logic", () => {
    it("powinien zwrócić 404 gdy profil nie istnieje", async () => {
      const artisanId = "123e4567-e89b-12d3-a456-426614174000";
      const context = createMockContext({ artisanId });

      // Mock: Profile not found
      const mockProfileChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Not found" },
        }),
      };

      (context.locals.supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockProfileChain);

      const response = await GET(context);
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error.code).toBe("PROFILE_NOT_FOUND");
    });

    it("powinien zwrócić 403 gdy profil nie jest opublikowany", async () => {
      const artisanId = "123e4567-e89b-12d3-a456-426614174000";
      const context = createMockContext({ artisanId });

      // Mock: Profile exists but not public
      const mockProfileChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            user_id: artisanId,
            company_name: "Test Company",
            nip: "1234567890",
            is_public: false,
            updated_at: "2025-10-21T12:00:00Z",
          },
          error: null,
        }),
      };

      const mockSpecializationsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockPortfolioChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockReviewsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      (context.locals.supabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(mockProfileChain)
        .mockReturnValueOnce(mockSpecializationsChain)
        .mockReturnValueOnce(mockPortfolioChain)
        .mockReturnValueOnce(mockReviewsChain);

      const response = await GET(context);
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error.code).toBe("PROFILE_NOT_PUBLISHED");
    });
  });

  describe("Success Cases", () => {
    it("powinien zwrócić 200 z pełnymi danymi publicznego profilu", async () => {
      const artisanId = "123e4567-e89b-12d3-a456-426614174000";
      const context = createMockContext({ artisanId });

      // Mock: Profile exists and is public
      const mockProfileChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            user_id: artisanId,
            company_name: "Amazing Furniture Co.",
            nip: "1234567890",
            is_public: true,
            updated_at: "2025-10-21T12:00:00Z",
          },
          error: null,
        }),
      };

      // Mock: Specializations
      const mockSpecializationsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [
            {
              specialization_id: "spec-1",
              specializations: { id: "spec-1", name: "Stoły" },
            },
            {
              specialization_id: "spec-2",
              specializations: { id: "spec-2", name: "Krzesła" },
            },
          ],
          error: null,
        }),
      };

      // Mock: Portfolio
      const mockPortfolioChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: "img-1",
              image_url: "https://storage.example.com/img1.jpg",
              created_at: "2025-10-20T10:00:00Z",
            },
            {
              id: "img-2",
              image_url: "https://storage.example.com/img2.jpg",
              created_at: "2025-10-19T14:30:00Z",
            },
          ],
          error: null,
        }),
      };

      // Mock: Reviews
      const mockReviewsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [{ rating: 5 }, { rating: 4 }, { rating: 5 }],
          error: null,
        }),
      };

      (context.locals.supabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(mockProfileChain)
        .mockReturnValueOnce(mockSpecializationsChain)
        .mockReturnValueOnce(mockPortfolioChain)
        .mockReturnValueOnce(mockReviewsChain);

      const response = await GET(context);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toMatchObject({
        user_id: artisanId,
        company_name: "Amazing Furniture Co.",
        nip: "1234567890",
        is_public: true,
        specializations: [
          { id: "spec-1", name: "Stoły" },
          { id: "spec-2", name: "Krzesła" },
        ],
        portfolio_images: [
          {
            id: "img-1",
            image_url: "https://storage.example.com/img1.jpg",
            created_at: "2025-10-20T10:00:00Z",
          },
          {
            id: "img-2",
            image_url: "https://storage.example.com/img2.jpg",
            created_at: "2025-10-19T14:30:00Z",
          },
        ],
        average_rating: 4.67,
        total_reviews: 3,
      });
    });
  });
});

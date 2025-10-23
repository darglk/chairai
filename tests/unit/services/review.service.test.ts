/**
 * Unit tests for ReviewService
 *
 * Tests the business logic for creating reviews, including validation,
 * authorization checks, and duplicate prevention.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { ReviewService, ReviewError } from "@/lib/services/review.service";
import type { SupabaseClient } from "@/db/supabase.client";

describe("ReviewService - createReview()", () => {
  let service: ReviewService;
  let mockSupabase: SupabaseClient;
  let mockFrom: ReturnType<typeof vi.fn>;
  let mockGetUserById: ReturnType<typeof vi.fn>;

  const mockData = {
    projectId: "project-uuid-1",
    reviewerId: "client-uuid-1",
    dto: {
      rating: 5,
      comment: "Excellent craftsmanship and communication",
    },
  };

  beforeEach(() => {
    mockFrom = vi.fn();
    mockGetUserById = vi.fn();

    mockSupabase = {
      from: mockFrom,
      auth: {
        admin: {
          getUserById: mockGetUserById,
        },
      },
    } as unknown as SupabaseClient;

    service = new ReviewService(mockSupabase);
    vi.clearAllMocks();
  });

  describe("Project Validation", () => {
    it("powinien rzucić błąd gdy projekt nie istnieje", async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Project not found" },
        }),
      };

      mockFrom.mockReturnValue(mockChain);

      await expect(service.createReview(mockData.projectId, mockData.reviewerId, mockData.dto)).rejects.toThrow(
        ReviewError
      );

      await expect(service.createReview(mockData.projectId, mockData.reviewerId, mockData.dto)).rejects.toThrow(
        "Nie znaleziono projektu"
      );
    });

    it("powinien rzucić błąd gdy projekt nie ma statusu 'completed'", async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockData.projectId,
            client_id: "client-uuid-1",
            status: "open",
            accepted_proposal_id: null,
            proposals: [],
          },
          error: null,
        }),
      };

      mockFrom.mockReturnValue(mockChain);

      await expect(service.createReview(mockData.projectId, mockData.reviewerId, mockData.dto)).rejects.toThrow(
        ReviewError
      );

      await expect(service.createReview(mockData.projectId, mockData.reviewerId, mockData.dto)).rejects.toThrow(
        "Można recenzować tylko zakończone projekty"
      );
    });
  });

  describe("Authorization", () => {
    it("powinien rzucić błąd gdy użytkownik nie jest zaangażowany w projekt", async () => {
      const mockProjectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockData.projectId,
            client_id: "different-client-uuid",
            status: "completed",
            accepted_proposal_id: "proposal-uuid-1",
            proposals: [],
          },
          error: null,
        }),
      };

      const mockProposalChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "proposal-uuid-1",
            artisan_id: "different-artisan-uuid",
          },
          error: null,
        }),
      };

      mockFrom.mockReturnValueOnce(mockProjectChain).mockReturnValueOnce(mockProposalChain);

      await expect(
        service.createReview(mockData.projectId, "unauthorized-user-uuid", mockData.dto)
      ).rejects.toMatchObject({
        message: "Nie masz uprawnień do recenzowania tego projektu",
        code: "REVIEW_FORBIDDEN",
      });
    });

    it("powinien pozwolić klientowi projektu dodać recenzję", async () => {
      const clientId = "client-uuid-1";
      const artisanId = "artisan-uuid-1";

      const mockProjectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockData.projectId,
            client_id: clientId,
            status: "completed",
            accepted_proposal_id: "proposal-uuid-1",
            proposals: [],
          },
          error: null,
        }),
      };

      const mockProposalChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "proposal-uuid-1",
            artisan_id: artisanId,
          },
          error: null,
        }),
      };

      const mockExistingReviewChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      const mockInsertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "review-uuid-1",
            project_id: mockData.projectId,
            reviewer_id: clientId,
            reviewee_id: artisanId,
            rating: mockData.dto.rating,
            comment: mockData.dto.comment,
            created_at: "2025-10-22T12:00:00Z",
          },
          error: null,
        }),
      };

      const mockCompleteReviewChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "review-uuid-1",
            rating: mockData.dto.rating,
            comment: mockData.dto.comment,
            created_at: "2025-10-22T12:00:00Z",
            project: {
              id: mockData.projectId,
              category: { name: "Krzesła" },
            },
          },
          error: null,
        }),
      };

      mockFrom
        .mockReturnValueOnce(mockProjectChain)
        .mockReturnValueOnce(mockProposalChain)
        .mockReturnValueOnce(mockExistingReviewChain)
        .mockReturnValueOnce(mockInsertChain)
        .mockReturnValueOnce(mockCompleteReviewChain);

      mockGetUserById.mockResolvedValue({
        data: {
          user: {
            id: clientId,
            email: "client@example.com",
          },
        },
        error: null,
      });

      const result = await service.createReview(mockData.projectId, clientId, mockData.dto);

      expect(result).toMatchObject({
        id: "review-uuid-1",
        rating: mockData.dto.rating,
        comment: mockData.dto.comment,
        reviewer: {
          id: clientId,
          name: "Użytkownik",
        },
      });
    });

    it("powinien pozwolić rzemieślnikowi projektu dodać recenzję", async () => {
      const clientId = "client-uuid-1";
      const artisanId = "artisan-uuid-1";

      const mockProjectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockData.projectId,
            client_id: clientId,
            status: "completed",
            accepted_proposal_id: "proposal-uuid-1",
            proposals: [],
          },
          error: null,
        }),
      };

      const mockProposalChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "proposal-uuid-1",
            artisan_id: artisanId,
          },
          error: null,
        }),
      };

      const mockExistingReviewChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      const mockInsertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "review-uuid-2",
            project_id: mockData.projectId,
            reviewer_id: artisanId,
            reviewee_id: clientId,
            rating: 4,
            comment: "Great communication",
            created_at: "2025-10-22T13:00:00Z",
          },
          error: null,
        }),
      };

      const mockCompleteReviewChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "review-uuid-2",
            rating: 4,
            comment: "Great communication",
            created_at: "2025-10-22T13:00:00Z",
            project: {
              id: mockData.projectId,
              category: { name: "Krzesła" },
            },
          },
          error: null,
        }),
      };

      mockFrom
        .mockReturnValueOnce(mockProjectChain)
        .mockReturnValueOnce(mockProposalChain)
        .mockReturnValueOnce(mockExistingReviewChain)
        .mockReturnValueOnce(mockInsertChain)
        .mockReturnValueOnce(mockCompleteReviewChain);

      mockGetUserById.mockResolvedValue({
        data: {
          user: {
            id: artisanId,
            email: "artisan@example.com",
          },
        },
        error: null,
      });

      const result = await service.createReview(mockData.projectId, artisanId, {
        rating: 4,
        comment: "Great communication",
      });

      expect(result).toMatchObject({
        id: "review-uuid-2",
        rating: 4,
        comment: "Great communication",
        reviewer: {
          id: artisanId,
          name: "Użytkownik",
        },
      });
    });
  });

  describe("Duplicate Prevention", () => {
    it("powinien rzucić błąd gdy użytkownik już dodał recenzję", async () => {
      const mockProjectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockData.projectId,
            client_id: mockData.reviewerId,
            status: "completed",
            accepted_proposal_id: "proposal-uuid-1",
            proposals: [],
          },
          error: null,
        }),
      };

      const mockProposalChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "proposal-uuid-1",
            artisan_id: "artisan-uuid-1",
          },
          error: null,
        }),
      };

      const mockExistingReviewChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: "existing-review-uuid",
          },
          error: null,
        }),
      };

      mockFrom
        .mockReturnValueOnce(mockProjectChain)
        .mockReturnValueOnce(mockProposalChain)
        .mockReturnValueOnce(mockExistingReviewChain);

      await expect(service.createReview(mockData.projectId, mockData.reviewerId, mockData.dto)).rejects.toMatchObject({
        message: "Już dodałeś recenzję do tego projektu",
        code: "REVIEW_ALREADY_EXISTS",
      });
    });
  });

  describe("Error Handling", () => {
    it("powinien rzucić błąd gdy nie można określić recenzowanej osoby", async () => {
      const mockProjectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockData.projectId,
            client_id: mockData.reviewerId,
            status: "completed",
            accepted_proposal_id: null,
            proposals: [],
          },
          error: null,
        }),
      };

      const mockExistingReviewChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockFrom.mockReturnValueOnce(mockProjectChain).mockReturnValueOnce(mockExistingReviewChain);

      await expect(service.createReview(mockData.projectId, mockData.reviewerId, mockData.dto)).rejects.toMatchObject({
        message: "Nie można określić recenzowanej osoby",
        code: "REVIEWEE_NOT_FOUND",
      });
    });

    it("powinien rzucić błąd gdy tworzenie recenzji w bazie się nie powiedzie", async () => {
      const mockProjectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockData.projectId,
            client_id: mockData.reviewerId,
            status: "completed",
            accepted_proposal_id: "proposal-uuid-1",
            proposals: [],
          },
          error: null,
        }),
      };

      const mockProposalChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "proposal-uuid-1",
            artisan_id: "artisan-uuid-1",
          },
          error: null,
        }),
      };

      const mockExistingReviewChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      const mockInsertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        }),
      };

      mockFrom
        .mockReturnValueOnce(mockProjectChain)
        .mockReturnValueOnce(mockProposalChain)
        .mockReturnValueOnce(mockExistingReviewChain)
        .mockReturnValueOnce(mockInsertChain);

      await expect(service.createReview(mockData.projectId, mockData.reviewerId, mockData.dto)).rejects.toMatchObject({
        message: "Nie udało się utworzyć recenzji",
        code: "REVIEW_CREATE_FAILED",
      });
    });
  });
});

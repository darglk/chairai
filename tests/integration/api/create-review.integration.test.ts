/**
 * Integration tests for Create Review API Endpoint
 *
 * POST /api/projects/{projectId}/reviews
 *
 * Tests the complete flow of review creation including:
 * - Authentication and authorization
 * - Input validation
 * - Business logic validation
 * - Database operations
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { APIContext } from "astro";
import { POST } from "@/pages/api/projects/[projectId]/reviews";
import type { SupabaseClient } from "@/db/supabase.client";

// Mock helper to create APIContext
const createMockContext = (
  params: { projectId: string },
  body: unknown,
  user: { id: string; role: string } | null
): APIContext => {
  return {
    params,
    request: {
      json: async () => body,
    } as Request,
    locals: {
      user,
      supabase: createMockSupabaseClient(),
    },
  } as unknown as APIContext;
};

// Mock Supabase client
const createMockSupabaseClient = () => {
  const mockFrom = vi.fn();
  const mockAuth = {
    admin: {
      getUserById: vi.fn(),
    },
  };

  return {
    from: mockFrom,
    auth: mockAuth,
  } as unknown as SupabaseClient;
};

describe("Integration: POST /api/projects/{projectId}/reviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Authentication", () => {
    it("powinien zwrócić 401 gdy użytkownik nie jest zalogowany", async () => {
      const body = {
        rating: 5,
        comment: "Excellent work!",
      };

      const context = createMockContext({ projectId: "project-uuid" }, body, null);

      const response = await POST(context);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("Input Validation", () => {
    it("powinien zwrócić 400 gdy projectId jest nieprawidłowy", async () => {
      const body = {
        rating: 5,
        comment: "Excellent work!",
      };

      const mockUser = { id: "user-uuid", role: "client" };
      const context = createMockContext({ projectId: "invalid-uuid" }, body, mockUser);

      const response = await POST(context);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("powinien zwrócić 400 gdy rating jest poza zakresem (za niski)", async () => {
      const body = {
        rating: 0,
        comment: "Test comment",
      };

      const mockUser = { id: "user-uuid", role: "client" };
      const context = createMockContext({ projectId: "123e4567-e89b-12d3-a456-426614174000" }, body, mockUser);

      const response = await POST(context);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
      expect(json.error.message).toContain("co najmniej 1");
    });

    it("powinien zwrócić 400 gdy rating jest poza zakresem (za wysoki)", async () => {
      const body = {
        rating: 6,
        comment: "Test comment",
      };

      const mockUser = { id: "user-uuid", role: "client" };
      const context = createMockContext({ projectId: "123e4567-e89b-12d3-a456-426614174000" }, body, mockUser);

      const response = await POST(context);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
      expect(json.error.message).toContain("nie może być większa niż 5");
    });

    it("powinien zwrócić 400 gdy comment jest pusty", async () => {
      const body = {
        rating: 5,
        comment: "",
      };

      const mockUser = { id: "user-uuid", role: "client" };
      const context = createMockContext({ projectId: "123e4567-e89b-12d3-a456-426614174000" }, body, mockUser);

      const response = await POST(context);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
      expect(json.error.message).toContain("nie może być pusty");
    });

    it("powinien zwrócić 400 gdy comment jest za długi", async () => {
      const body = {
        rating: 5,
        comment: "x".repeat(1001),
      };

      const mockUser = { id: "user-uuid", role: "client" };
      const context = createMockContext({ projectId: "123e4567-e89b-12d3-a456-426614174000" }, body, mockUser);

      const response = await POST(context);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
      expect(json.error.message).toContain("1000 znaków");
    });

    it("powinien zwrócić 400 gdy rating nie jest liczbą całkowitą", async () => {
      const body = {
        rating: 4.5,
        comment: "Test comment",
      };

      const mockUser = { id: "user-uuid", role: "client" };
      const context = createMockContext({ projectId: "123e4567-e89b-12d3-a456-426614174000" }, body, mockUser);

      const response = await POST(context);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
      expect(json.error.message).toContain("liczbą całkowitą");
    });
  });

  describe("Business Logic Validation", () => {
    it("powinien zwrócić 404 gdy projekt nie istnieje", async () => {
      const body = {
        rating: 5,
        comment: "Excellent work!",
      };

      const mockUser = { id: "client-uuid", role: "client" };
      const context = createMockContext({ projectId: "123e4567-e89b-12d3-a456-426614174000" }, body, mockUser);

      // Mock: Project not found
      const mockProjectSelect = vi.fn().mockReturnThis();
      const mockProjectEq = vi.fn().mockReturnThis();
      const mockProjectSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      });

      (context.locals.supabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        select: mockProjectSelect,
        eq: mockProjectEq,
        single: mockProjectSingle,
      });

      const response = await POST(context);
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error.code).toBe("PROJECT_NOT_FOUND");
    });

    it("powinien zwrócić 400 gdy projekt nie jest zakończony", async () => {
      const body = {
        rating: 5,
        comment: "Excellent work!",
      };

      const mockUser = { id: "client-uuid", role: "client" };
      const context = createMockContext({ projectId: "123e4567-e89b-12d3-a456-426614174000" }, body, mockUser);

      // Mock: Project exists but is not completed
      const mockProjectSelect = vi.fn().mockReturnThis();
      const mockProjectEq = vi.fn().mockReturnThis();
      const mockProjectSingle = vi.fn().mockResolvedValue({
        data: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          client_id: mockUser.id,
          status: "in_progress",
          accepted_proposal_id: "proposal-uuid",
          proposals: [],
        },
        error: null,
      });

      (context.locals.supabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        select: mockProjectSelect,
        eq: mockProjectEq,
        single: mockProjectSingle,
      });

      const response = await POST(context);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe("PROJECT_NOT_COMPLETED");
    });

    it("powinien zwrócić 403 gdy użytkownik nie jest zaangażowany w projekt", async () => {
      const body = {
        rating: 5,
        comment: "Excellent work!",
      };

      const mockUser = { id: "unauthorized-user-uuid", role: "client" };
      const context = createMockContext({ projectId: "123e4567-e89b-12d3-a456-426614174000" }, body, mockUser);

      // Mock: Project exists and is completed
      const mockProjectSelect = vi.fn().mockReturnThis();
      const mockProjectEq = vi.fn().mockReturnThis();
      const mockProjectSingle = vi.fn().mockResolvedValue({
        data: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          client_id: "different-client-uuid",
          status: "completed",
          accepted_proposal_id: "proposal-uuid",
          proposals: [],
        },
        error: null,
      });

      // Mock: Proposal with different artisan
      const mockProposalSelect = vi.fn().mockReturnThis();
      const mockProposalEq = vi.fn().mockReturnThis();
      const mockProposalSingle = vi.fn().mockResolvedValue({
        data: {
          id: "proposal-uuid",
          artisan_id: "different-artisan-uuid",
        },
        error: null,
      });

      (context.locals.supabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          select: mockProjectSelect,
          eq: mockProjectEq,
          single: mockProjectSingle,
        })
        .mockReturnValueOnce({
          select: mockProposalSelect,
          eq: mockProposalEq,
          single: mockProposalSingle,
        });

      const response = await POST(context);
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error.code).toBe("REVIEW_FORBIDDEN");
    });

    it("powinien zwrócić 409 gdy użytkownik już dodał recenzję", async () => {
      const body = {
        rating: 5,
        comment: "Excellent work!",
      };

      const mockUser = { id: "client-uuid", role: "client" };
      const context = createMockContext({ projectId: "123e4567-e89b-12d3-a456-426614174000" }, body, mockUser);

      // Mock: Project exists and is completed
      const mockProjectSelect = vi.fn().mockReturnThis();
      const mockProjectEq = vi.fn().mockReturnThis();
      const mockProjectSingle = vi.fn().mockResolvedValue({
        data: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          client_id: mockUser.id,
          status: "completed",
          accepted_proposal_id: "proposal-uuid",
          proposals: [],
        },
        error: null,
      });

      // Mock: Proposal exists
      const mockProposalSelect = vi.fn().mockReturnThis();
      const mockProposalEq = vi.fn().mockReturnThis();
      const mockProposalSingle = vi.fn().mockResolvedValue({
        data: {
          id: "proposal-uuid",
          artisan_id: "artisan-uuid",
        },
        error: null,
      });

      // Mock: Existing review found
      const mockExistingReviewSelect = vi.fn().mockReturnThis();
      const mockExistingReviewEq = vi.fn().mockReturnThis();
      const mockExistingReviewMaybeSingle = vi.fn().mockResolvedValue({
        data: { id: "existing-review-uuid" },
        error: null,
      });

      (context.locals.supabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          select: mockProjectSelect,
          eq: mockProjectEq,
          single: mockProjectSingle,
        })
        .mockReturnValueOnce({
          select: mockProposalSelect,
          eq: mockProposalEq,
          single: mockProposalSingle,
        })
        .mockReturnValueOnce({
          select: mockExistingReviewSelect,
          eq: mockExistingReviewEq,
          maybeSingle: mockExistingReviewMaybeSingle,
        });

      const response = await POST(context);
      const json = await response.json();

      expect(response.status).toBe(409);
      expect(json.error.code).toBe("REVIEW_ALREADY_EXISTS");
    });
  });

  describe("Successful Review Creation", () => {
    it("powinien utworzyć recenzję dla klienta i zwrócić 201", async () => {
      const body = {
        rating: 5,
        comment: "Excellent craftsmanship!",
      };

      const mockUser = { id: "client-uuid", role: "client" };
      const artisanId = "artisan-uuid";
      const context = createMockContext({ projectId: "123e4567-e89b-12d3-a456-426614174000" }, body, mockUser);

      // Mock: Project exists and is completed
      const mockProjectSelect = vi.fn().mockReturnThis();
      const mockProjectEq = vi.fn().mockReturnThis();
      const mockProjectSingle = vi.fn().mockResolvedValue({
        data: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          client_id: mockUser.id,
          status: "completed",
          accepted_proposal_id: "proposal-uuid",
          proposals: [],
        },
        error: null,
      });

      // Mock: Proposal exists
      const mockProposalSelect = vi.fn().mockReturnThis();
      const mockProposalEq = vi.fn().mockReturnThis();
      const mockProposalSingle = vi.fn().mockResolvedValue({
        data: {
          id: "proposal-uuid",
          artisan_id: artisanId,
        },
        error: null,
      });

      // Mock: No existing review
      const mockExistingReviewSelect = vi.fn().mockReturnThis();
      const mockExistingReviewEq = vi.fn().mockReturnThis();
      const mockExistingReviewMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      // Mock: Review insert
      const mockInsertReview = vi.fn().mockReturnThis();
      const mockInsertSelect = vi.fn().mockReturnThis();
      const mockInsertSingle = vi.fn().mockResolvedValue({
        data: {
          id: "review-uuid",
          project_id: "123e4567-e89b-12d3-a456-426614174000",
          reviewer_id: mockUser.id,
          reviewee_id: artisanId,
          rating: 5,
          comment: "Excellent craftsmanship!",
          created_at: "2025-10-22T12:00:00Z",
        },
        error: null,
      });

      // Mock: Fetch complete review
      const mockCompleteReviewSelect = vi.fn().mockReturnThis();
      const mockCompleteReviewEq = vi.fn().mockReturnThis();
      const mockCompleteReviewSingle = vi.fn().mockResolvedValue({
        data: {
          id: "review-uuid",
          rating: 5,
          comment: "Excellent craftsmanship!",
          created_at: "2025-10-22T12:00:00Z",
          project: {
            id: "123e4567-e89b-12d3-a456-426614174000",
            category: { name: "Krzesła" },
          },
        },
        error: null,
      });

      (context.locals.supabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          select: mockProjectSelect,
          eq: mockProjectEq,
          single: mockProjectSingle,
        })
        .mockReturnValueOnce({
          select: mockProposalSelect,
          eq: mockProposalEq,
          single: mockProposalSingle,
        })
        .mockReturnValueOnce({
          select: mockExistingReviewSelect,
          eq: mockExistingReviewEq,
          maybeSingle: mockExistingReviewMaybeSingle,
        })
        .mockReturnValueOnce({
          insert: mockInsertReview,
          select: mockInsertSelect,
          single: mockInsertSingle,
        })
        .mockReturnValueOnce({
          select: mockCompleteReviewSelect,
          eq: mockCompleteReviewEq,
          single: mockCompleteReviewSingle,
        });

      // Mock: Auth getUserById
      (context.locals.supabase.auth.admin.getUserById as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          user: {
            id: mockUser.id,
            email: "client@example.com",
          },
        },
        error: null,
      });

      const response = await POST(context);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.id).toBe("review-uuid");
      expect(json.rating).toBe(5);
      expect(json.comment).toBe("Excellent craftsmanship!");
      expect(json.reviewer.id).toBe(mockUser.id);
      expect(json.reviewer.email).toBe("client@example.com");
    });

    it("powinien utworzyć recenzję dla rzemieślnika i zwrócić 201", async () => {
      const body = {
        rating: 4,
        comment: "Great communication!",
      };

      const clientId = "client-uuid";
      const mockUser = { id: "artisan-uuid", role: "artisan" };
      const context = createMockContext({ projectId: "123e4567-e89b-12d3-a456-426614174000" }, body, mockUser);

      // Mock: Project exists and is completed
      const mockProjectSelect = vi.fn().mockReturnThis();
      const mockProjectEq = vi.fn().mockReturnThis();
      const mockProjectSingle = vi.fn().mockResolvedValue({
        data: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          client_id: clientId,
          status: "completed",
          accepted_proposal_id: "proposal-uuid",
          proposals: [],
        },
        error: null,
      });

      // Mock: Proposal exists
      const mockProposalSelect = vi.fn().mockReturnThis();
      const mockProposalEq = vi.fn().mockReturnThis();
      const mockProposalSingle = vi.fn().mockResolvedValue({
        data: {
          id: "proposal-uuid",
          artisan_id: mockUser.id,
        },
        error: null,
      });

      // Mock: No existing review
      const mockExistingReviewSelect = vi.fn().mockReturnThis();
      const mockExistingReviewEq = vi.fn().mockReturnThis();
      const mockExistingReviewMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      // Mock: Review insert
      const mockInsertReview = vi.fn().mockReturnThis();
      const mockInsertSelect = vi.fn().mockReturnThis();
      const mockInsertSingle = vi.fn().mockResolvedValue({
        data: {
          id: "review-uuid-2",
          project_id: "123e4567-e89b-12d3-a456-426614174000",
          reviewer_id: mockUser.id,
          reviewee_id: clientId,
          rating: 4,
          comment: "Great communication!",
          created_at: "2025-10-22T13:00:00Z",
        },
        error: null,
      });

      // Mock: Fetch complete review
      const mockCompleteReviewSelect = vi.fn().mockReturnThis();
      const mockCompleteReviewEq = vi.fn().mockReturnThis();
      const mockCompleteReviewSingle = vi.fn().mockResolvedValue({
        data: {
          id: "review-uuid-2",
          rating: 4,
          comment: "Great communication!",
          created_at: "2025-10-22T13:00:00Z",
          project: {
            id: "123e4567-e89b-12d3-a456-426614174000",
            category: { name: "Krzesła" },
          },
        },
        error: null,
      });

      (context.locals.supabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          select: mockProjectSelect,
          eq: mockProjectEq,
          single: mockProjectSingle,
        })
        .mockReturnValueOnce({
          select: mockProposalSelect,
          eq: mockProposalEq,
          single: mockProposalSingle,
        })
        .mockReturnValueOnce({
          select: mockExistingReviewSelect,
          eq: mockExistingReviewEq,
          maybeSingle: mockExistingReviewMaybeSingle,
        })
        .mockReturnValueOnce({
          insert: mockInsertReview,
          select: mockInsertSelect,
          single: mockInsertSingle,
        })
        .mockReturnValueOnce({
          select: mockCompleteReviewSelect,
          eq: mockCompleteReviewEq,
          single: mockCompleteReviewSingle,
        });

      // Mock: Auth getUserById
      (context.locals.supabase.auth.admin.getUserById as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          user: {
            id: mockUser.id,
            email: "artisan@example.com",
          },
        },
        error: null,
      });

      const response = await POST(context);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.id).toBe("review-uuid-2");
      expect(json.rating).toBe(4);
      expect(json.comment).toBe("Great communication!");
      expect(json.reviewer.id).toBe(mockUser.id);
      expect(json.reviewer.email).toBe("artisan@example.com");
    });
  });
});

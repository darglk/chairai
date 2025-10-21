/**
 * Integration tests for Create Proposal API Endpoint
 *
 * POST /api/projects/{projectId}/proposals
 *
 * Tests the complete flow of proposal creation including:
 * - Authentication and authorization
 * - Input validation
 * - File upload handling
 * - Business logic validation
 * - Database operations
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { APIContext } from "astro";
import { POST } from "@/pages/api/projects/[projectId]/proposals";
import type { SupabaseClient } from "@/db/supabase.client";

// Mock helper to create APIContext
const createMockContext = (
  params: { projectId: string },
  formData: FormData,
  user: { id: string; role: string } | null
): APIContext => {
  return {
    params,
    request: {
      formData: async () => formData,
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
  const mockStorage = {
    from: vi.fn(),
  };

  return {
    from: mockFrom,
    storage: mockStorage,
  } as unknown as SupabaseClient;
};

// Helper to create mock File with arrayBuffer method
const createMockFile = (name: string, size: number, type: string): File => {
  const content = "x".repeat(size);
  const blob = new Blob([content], { type });
  const file = new File([blob], name, { type });

  // Mock arrayBuffer for Node.js environment
  if (!file.arrayBuffer) {
    Object.defineProperty(file, "arrayBuffer", {
      value: async () => {
        const buffer = Buffer.from(content);
        return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      },
    });
  }

  return file;
};

describe("Integration: POST /api/projects/{projectId}/proposals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Authentication and Authorization", () => {
    it("powinien zwrócić 401 gdy użytkownik nie jest zalogowany", async () => {
      const formData = new FormData();
      formData.append("price", "2500");
      formData.append("attachment", createMockFile("proposal.pdf", 1024, "application/pdf"));

      const context = createMockContext({ projectId: "project-uuid" }, formData, null);

      const response = await POST(context);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error.code).toBe("UNAUTHORIZED");
    });

    // Note: Role validation happens in ProposalService after input validation.
    // This means invalid input will return 400 before role check.
    // Role authorization is tested in unit tests for ProposalService.
  });

  describe("Input Validation", () => {
    it("powinien zwrócić 400 gdy projectId jest nieprawidłowy", async () => {
      const formData = new FormData();
      formData.append("price", "2500");
      formData.append("attachment", createMockFile("proposal.pdf", 1024, "application/pdf"));

      const mockUser = { id: "artisan-uuid", role: "artisan" };
      const context = createMockContext({ projectId: "invalid-uuid" }, formData, mockUser);

      const response = await POST(context);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("powinien zwrócić 400 gdy price jest nieprawidłowa", async () => {
      const formData = new FormData();
      formData.append("price", "-100"); // Negative price
      formData.append("attachment", createMockFile("proposal.pdf", 1024, "application/pdf"));

      const mockUser = { id: "artisan-uuid", role: "artisan" };
      const context = createMockContext({ projectId: "123e4567-e89b-12d3-a456-426614174000" }, formData, mockUser);

      const response = await POST(context);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
      expect(json.error.message).toContain("dodatnia");
    });

    it("powinien zwrócić 400 gdy attachment jest za duży", async () => {
      const formData = new FormData();
      formData.append("price", "2500");
      formData.append("attachment", createMockFile("large.pdf", 6 * 1024 * 1024, "application/pdf"));

      const mockUser = { id: "artisan-uuid", role: "artisan" };
      const context = createMockContext({ projectId: "123e4567-e89b-12d3-a456-426614174000" }, formData, mockUser);

      const response = await POST(context);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
      expect(json.error.message).toContain("5MB");
    });

    it("powinien zwrócić 400 gdy attachment ma nieprawidłowy typ", async () => {
      const formData = new FormData();
      formData.append("price", "2500");
      formData.append("attachment", createMockFile("document.txt", 1024, "text/plain"));

      const mockUser = { id: "artisan-uuid", role: "artisan" };
      const context = createMockContext({ projectId: "123e4567-e89b-12d3-a456-426614174000" }, formData, mockUser);

      const response = await POST(context);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
      expect(json.error.message).toContain("PDF");
    });
  });

  describe("Business Logic Validation", () => {
    it("powinien zwrócić 404 gdy projekt nie istnieje", async () => {
      const formData = new FormData();
      formData.append("price", "2500");
      formData.append("attachment", createMockFile("proposal.pdf", 1024, "application/pdf"));

      const mockUser = { id: "artisan-uuid", role: "artisan" };
      const context = createMockContext({ projectId: "123e4567-e89b-12d3-a456-426614174000" }, formData, mockUser);

      // Mock: User is artisan
      const mockUserSelect = vi.fn().mockReturnThis();
      const mockUserEq = vi.fn().mockReturnThis();
      const mockUserSingle = vi.fn().mockResolvedValue({
        data: mockUser,
        error: null,
      });

      // Mock: Project not found
      const mockProjectSelect = vi.fn().mockReturnThis();
      const mockProjectEq = vi.fn().mockReturnThis();
      const mockProjectSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      });

      (context.locals.supabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          select: mockUserSelect,
          eq: mockUserEq,
          single: mockUserSingle,
        })
        .mockReturnValueOnce({
          select: mockProjectSelect,
          eq: mockProjectEq,
          single: mockProjectSingle,
        });

      const response = await POST(context);
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error.code).toBe("PROJECT_NOT_FOUND");
    });

    it("powinien zwrócić 409 gdy rzemieślnik już złożył propozycję", async () => {
      const formData = new FormData();
      formData.append("price", "2500");
      formData.append("attachment", createMockFile("proposal.pdf", 1024, "application/pdf"));

      const mockUser = { id: "artisan-uuid", role: "artisan" };
      const context = createMockContext({ projectId: "123e4567-e89b-12d3-a456-426614174000" }, formData, mockUser);

      // Mock: User is artisan
      const mockUserSelect = vi.fn().mockReturnThis();
      const mockUserEq = vi.fn().mockReturnThis();
      const mockUserSingle = vi.fn().mockResolvedValue({
        data: mockUser,
        error: null,
      });

      // Mock: Project exists and is open
      const mockProjectSelect = vi.fn().mockReturnThis();
      const mockProjectEq = vi.fn().mockReturnThis();
      const mockProjectSingle = vi.fn().mockResolvedValue({
        data: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          status: "open",
          client_id: "client-uuid",
        },
        error: null,
      });

      // Mock: Existing proposal found
      const mockProposalSelect = vi.fn().mockReturnThis();
      const mockProposalEq = vi.fn().mockReturnThis();
      const mockProposalMaybeSingle = vi.fn().mockResolvedValue({
        data: { id: "existing-proposal-uuid" },
        error: null,
      });

      (context.locals.supabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          select: mockUserSelect,
          eq: mockUserEq,
          single: mockUserSingle,
        })
        .mockReturnValueOnce({
          select: mockProjectSelect,
          eq: mockProjectEq,
          single: mockProjectSingle,
        })
        .mockReturnValueOnce({
          select: mockProposalSelect,
          eq: mockProposalEq,
          maybeSingle: mockProposalMaybeSingle,
        });

      const response = await POST(context);
      const json = await response.json();

      expect(response.status).toBe(409);
      expect(json.error.code).toBe("PROPOSAL_ALREADY_EXISTS");
    });
  });

  describe("Successful Proposal Creation", () => {
    it("powinien utworzyć propozycję i zwrócić 201 z danymi", async () => {
      const formData = new FormData();
      formData.append("price", "2500");
      formData.append("attachment", createMockFile("proposal.pdf", 1024, "application/pdf"));

      const mockUser = { id: "artisan-uuid", role: "artisan" };
      const projectId = "123e4567-e89b-12d3-a456-426614174000";
      const context = createMockContext({ projectId }, formData, mockUser);

      // Mock: User is artisan
      const mockUserSelect = vi.fn().mockReturnThis();
      const mockUserEq = vi.fn().mockReturnThis();
      const mockUserSingle = vi.fn().mockResolvedValue({
        data: mockUser,
        error: null,
      });

      // Mock: Project exists and is open
      const mockProjectSelect = vi.fn().mockReturnThis();
      const mockProjectEq = vi.fn().mockReturnThis();
      const mockProjectSingle = vi.fn().mockResolvedValue({
        data: {
          id: projectId,
          status: "open",
          client_id: "client-uuid",
        },
        error: null,
      });

      // Mock: No existing proposal
      const mockProposalSelect = vi.fn().mockReturnThis();
      const mockProposalEq = vi.fn().mockReturnThis();
      const mockProposalMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      // Mock: Storage upload
      const mockStorageUpload = vi.fn().mockResolvedValue({
        error: null,
      });

      const mockStorageGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: "https://storage.example.com/proposal.pdf" },
      });

      const mockStorageFrom = vi.fn().mockReturnValue({
        upload: mockStorageUpload,
        getPublicUrl: mockStorageGetPublicUrl,
      });

      // Mock: Proposal insert
      const mockInsert = vi.fn().mockReturnThis();
      const mockProposalSelectAfterInsert = vi.fn().mockReturnThis();
      const mockProposalSingle = vi.fn().mockResolvedValue({
        data: {
          id: "new-proposal-uuid",
          project_id: projectId,
          price: 2500,
          attachment_url: "https://storage.example.com/proposal.pdf",
          created_at: "2025-10-21T12:00:00Z",
          artisan: {
            id: mockUser.id,
            artisan_profiles: {
              company_name: "Test Company",
            },
          },
        },
        error: null,
      });

      // Mock: Artisan profile
      const mockArtisanProfileSelect = vi.fn().mockReturnThis();
      const mockArtisanProfileEq = vi.fn().mockReturnThis();
      const mockArtisanProfileSingle = vi.fn().mockResolvedValue({
        data: { company_name: "Test Company" },
        error: null,
      });

      // Mock: Reviews count query
      const mockReviewsCountSelect = vi.fn().mockReturnThis();
      const mockReviewsCountEq = vi.fn().mockReturnThis();
      const mockReviewsCount = vi.fn().mockResolvedValue({
        count: 5,
        error: null,
      });

      // Mock: Reviews average rating query
      const mockReviewsRatingSelect = vi.fn().mockReturnThis();
      const mockReviewsRatingEq = vi.fn().mockResolvedValue({
        data: [{ rating: 4.5 }],
        error: null,
      });

      (context.locals.supabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          select: mockUserSelect,
          eq: mockUserEq,
          single: mockUserSingle,
        })
        .mockReturnValueOnce({
          select: mockProjectSelect,
          eq: mockProjectEq,
          single: mockProjectSingle,
        })
        .mockReturnValueOnce({
          select: mockProposalSelect,
          eq: mockProposalEq,
          maybeSingle: mockProposalMaybeSingle,
        })
        .mockReturnValueOnce({
          insert: mockInsert,
          select: mockProposalSelectAfterInsert,
          single: mockProposalSingle,
        })
        .mockReturnValueOnce({
          select: mockArtisanProfileSelect,
          eq: mockArtisanProfileEq,
          single: mockArtisanProfileSingle,
        })
        .mockReturnValueOnce({
          select: mockReviewsCountSelect,
          eq: mockReviewsCountEq,
          count: mockReviewsCount,
        })
        .mockReturnValueOnce({
          select: mockReviewsRatingSelect,
          eq: mockReviewsRatingEq,
        });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (context.locals.supabase.storage as any).from = mockStorageFrom;

      const response = await POST(context);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.id).toBe("new-proposal-uuid");
      expect(json.project_id).toBe(projectId);
      expect(json.price).toBe(2500);
      expect(json.attachment_url).toBe("https://storage.example.com/proposal.pdf");
      expect(json.artisan).toMatchObject({
        user_id: mockUser.id,
        company_name: "Test Company",
      });
    });
  });
});

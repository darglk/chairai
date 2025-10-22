/**
 * Integration tests for Accept Proposal API Endpoint
 *
 * POST /api/projects/{projectId}/accept-proposal
 *
 * Tests the complete flow of accepting a proposal including:
 * - Authentication and authorization
 * - Input validation
 * - Business logic validation (project status, ownership, proposal validation)
 * - Database operations
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { APIContext } from "astro";
import { POST } from "@/pages/api/projects/[projectId]/accept-proposal";
import type { SupabaseClient } from "@/db/supabase.client";

// Mock helper to create APIContext
const createMockContext = (
  params: { projectId: string },
  body: object,
  user: { id: string; role: string } | null,
  supabaseClient?: SupabaseClient
): APIContext => {
  return {
    params,
    request: {
      json: async () => body,
    } as Request,
    locals: {
      user,
      supabase: supabaseClient || createMockSupabaseClient(),
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

describe("Integration: POST /api/projects/{projectId}/accept-proposal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Authentication", () => {
    it("powinien zwrócić 401 gdy użytkownik nie jest zalogowany", async () => {
      const body = { proposal_id: "proposal-uuid-1" };
      const context = createMockContext({ projectId: "project-uuid-1" }, body, null);

      const response = await POST(context);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error.code).toBe("UNAUTHORIZED");
      expect(json.error.message).toContain("Wymagane uwierzytelnienie");
    });
  });

  describe("Input Validation", () => {
    it("powinien zwrócić 400 gdy projectId jest nieprawidłowy", async () => {
      const body = { proposal_id: "550e8400-e29b-41d4-a716-446655440001" };
      const mockUser = { id: "550e8400-e29b-41d4-a716-446655440002", role: "client" };
      const context = createMockContext({ projectId: "invalid-uuid" }, body, mockUser);

      const response = await POST(context);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
      expect(json.error.message).toContain("Nieprawidłowy format ID projektu");
    });

    it("powinien zwrócić 400 gdy proposal_id jest nieprawidłowy", async () => {
      const body = { proposal_id: "not-a-uuid" };
      const mockUser = { id: "550e8400-e29b-41d4-a716-446655440002", role: "client" };
      const context = createMockContext({ projectId: "550e8400-e29b-41d4-a716-446655440000" }, body, mockUser);

      const response = await POST(context);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
      expect(json.error.message).toContain("Nieprawidłowy format UUID dla propozycji");
    });

    it("powinien zwrócić 400 gdy proposal_id brakuje", async () => {
      const body = {};
      const mockUser = { id: "550e8400-e29b-41d4-a716-446655440002", role: "client" };
      const context = createMockContext({ projectId: "550e8400-e29b-41d4-a716-446655440000" }, body, mockUser);

      const response = await POST(context);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
      expect(json.error.message).toContain("ID propozycji jest wymagane");
    });

    it("powinien zwrócić 400 gdy body nie jest prawidłowym JSON", async () => {
      const mockUser = { id: "550e8400-e29b-41d4-a716-446655440002", role: "client" };
      const context = {
        params: { projectId: "550e8400-e29b-41d4-a716-446655440000" },
        request: {
          json: async () => {
            throw new Error("Invalid JSON");
          },
        } as unknown as Request,
        locals: {
          user: mockUser,
          supabase: createMockSupabaseClient(),
        },
      } as unknown as APIContext;

      const response = await POST(context);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
      expect(json.error.message).toContain("Nieprawidłowe dane JSON");
    });
  });

  describe("Business Logic Validation", () => {
    it("powinien zwrócić 404 gdy projekt nie istnieje", async () => {
      const mockUser = { id: "550e8400-e29b-41d4-a716-446655440002", role: "client" };
      const mockSupabase = createMockSupabaseClient();

      const projectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Not found" },
        }),
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(projectChain);

      const body = { proposal_id: "550e8400-e29b-41d4-a716-446655440001" };
      const context = createMockContext(
        { projectId: "550e8400-e29b-41d4-a716-446655440000" },
        body,
        mockUser,
        mockSupabase
      );

      const response = await POST(context);
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error.code).toBe("PROJECT_NOT_FOUND");
    });

    it("powinien zwrócić 403 gdy użytkownik nie jest właścicielem projektu", async () => {
      const mockUser = { id: "550e8400-e29b-41d4-a716-446655440003", role: "client" };
      const mockSupabase = createMockSupabaseClient();

      const mockProject = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        client_id: "550e8400-e29b-41d4-a716-446655440002",
        status: "open",
      };

      const projectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProject,
          error: null,
        }),
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(projectChain);

      const body = { proposal_id: "550e8400-e29b-41d4-a716-446655440001" };
      const context = createMockContext(
        { projectId: "550e8400-e29b-41d4-a716-446655440000" },
        body,
        mockUser,
        mockSupabase
      );

      const response = await POST(context);
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error.code).toBe("PROJECT_FORBIDDEN");
      expect(json.error.message).toContain("Nie masz uprawnień");
    });

    it("powinien zwrócić 400 gdy projekt nie jest w statusie 'open'", async () => {
      const mockUser = { id: "550e8400-e29b-41d4-a716-446655440002", role: "client" };
      const mockSupabase = createMockSupabaseClient();

      const mockProject = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        client_id: "550e8400-e29b-41d4-a716-446655440002",
        status: "in_progress",
      };

      const projectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProject,
          error: null,
        }),
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(projectChain);

      const body = { proposal_id: "550e8400-e29b-41d4-a716-446655440001" };
      const context = createMockContext(
        { projectId: "550e8400-e29b-41d4-a716-446655440000" },
        body,
        mockUser,
        mockSupabase
      );

      const response = await POST(context);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe("PROJECT_NOT_OPEN");
      expect(json.error.message).toContain("Nie można zaakceptować propozycji");
    });

    it("powinien zwrócić 404 gdy propozycja nie istnieje", async () => {
      const mockUser = { id: "550e8400-e29b-41d4-a716-446655440002", role: "client" };
      const mockSupabase = createMockSupabaseClient();

      const mockProject = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        client_id: "550e8400-e29b-41d4-a716-446655440002",
        status: "open",
      };

      const projectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProject,
          error: null,
        }),
      };

      const proposalChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Not found" },
        }),
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(projectChain)
        .mockReturnValueOnce(proposalChain);

      const body = { proposal_id: "550e8400-e29b-41d4-a716-446655440001" };
      const context = createMockContext(
        { projectId: "550e8400-e29b-41d4-a716-446655440000" },
        body,
        mockUser,
        mockSupabase
      );

      const response = await POST(context);
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error.code).toBe("PROPOSAL_NOT_FOUND");
    });

    it("powinien zwrócić 400 gdy propozycja nie należy do projektu", async () => {
      const mockUser = { id: "550e8400-e29b-41d4-a716-446655440002", role: "client" };
      const mockSupabase = createMockSupabaseClient();

      const mockProject = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        client_id: "550e8400-e29b-41d4-a716-446655440002",
        status: "open",
      };

      const mockProposal = {
        id: "550e8400-e29b-41d4-a716-446655440001",
        project_id: "550e8400-e29b-41d4-a716-446655440099",
        price: 2500,
      };

      const projectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProject,
          error: null,
        }),
      };

      const proposalChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProposal,
          error: null,
        }),
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(projectChain)
        .mockReturnValueOnce(proposalChain);

      const body = { proposal_id: "550e8400-e29b-41d4-a716-446655440001" };
      const context = createMockContext(
        { projectId: "550e8400-e29b-41d4-a716-446655440000" },
        body,
        mockUser,
        mockSupabase
      );

      const response = await POST(context);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe("PROPOSAL_PROJECT_MISMATCH");
      expect(json.error.message).toContain("Propozycja nie należy do tego projektu");
    });
  });

  describe("Success Flow", () => {
    it("powinien pomyślnie zaakceptować propozycję i zwrócić 200", async () => {
      const mockUser = { id: "550e8400-e29b-41d4-a716-446655440002", role: "client" };
      const mockSupabase = createMockSupabaseClient();

      const mockProject = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        client_id: "550e8400-e29b-41d4-a716-446655440002",
        status: "open",
      };

      const mockProposal = {
        id: "550e8400-e29b-41d4-a716-446655440001",
        project_id: "550e8400-e29b-41d4-a716-446655440000",
        price: 2500,
      };

      const mockUpdatedProject = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        status: "in_progress",
        accepted_proposal_id: "550e8400-e29b-41d4-a716-446655440001",
        accepted_price: 2500,
        updated_at: "2025-10-22T10:00:00Z",
      };

      const projectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProject,
          error: null,
        }),
      };

      const proposalChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProposal,
          error: null,
        }),
      };

      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUpdatedProject,
          error: null,
        }),
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(projectChain)
        .mockReturnValueOnce(proposalChain)
        .mockReturnValueOnce(updateChain);

      const body = { proposal_id: "550e8400-e29b-41d4-a716-446655440001" };
      const context = createMockContext(
        { projectId: "550e8400-e29b-41d4-a716-446655440000" },
        body,
        mockUser,
        mockSupabase
      );

      const response = await POST(context);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual({
        id: "550e8400-e29b-41d4-a716-446655440000",
        status: "in_progress",
        accepted_proposal_id: "550e8400-e29b-41d4-a716-446655440001",
        accepted_price: 2500,
        updated_at: "2025-10-22T10:00:00Z",
      });
    });
  });
});

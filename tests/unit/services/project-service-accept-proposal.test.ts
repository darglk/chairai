/**
 * Unit tests for ProjectService.acceptProposal()
 *
 * Tests the business logic for accepting proposals, including validation,
 * authorization checks, and project status updates.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { ProjectService, ProjectError } from "@/lib/services/project.service";
import type { SupabaseClient } from "@/db/supabase.client";

describe("ProjectService - acceptProposal()", () => {
  let service: ProjectService;
  let mockSupabase: SupabaseClient;
  let mockFrom: ReturnType<typeof vi.fn>;

  const mockData = {
    projectId: "project-uuid-1",
    proposalId: "proposal-uuid-1",
    userId: "client-uuid-1",
  };

  beforeEach(() => {
    mockFrom = vi.fn();
    mockSupabase = {
      from: mockFrom,
    } as unknown as SupabaseClient;
    service = new ProjectService(mockSupabase);
    vi.clearAllMocks();
  });

  describe("Success scenarios", () => {
    it("powinien pomyślnie zaakceptować propozycję", async () => {
      const mockProject = {
        id: mockData.projectId,
        client_id: mockData.userId,
        status: "open",
      };

      const mockProposal = {
        id: mockData.proposalId,
        project_id: mockData.projectId,
        price: 2500,
      };

      const mockUpdatedProject = {
        id: mockData.projectId,
        status: "in_progress",
        accepted_proposal_id: mockData.proposalId,
        accepted_price: 2500,
        updated_at: "2025-10-22T10:00:00Z",
      };

      // Mock chain for fetching project
      const projectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProject,
          error: null,
        }),
      };

      // Mock chain for fetching proposal
      const proposalChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProposal,
          error: null,
        }),
      };

      // Mock chain for updating project
      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUpdatedProject,
          error: null,
        }),
      };

      // Setup mockFrom to return appropriate chains
      mockFrom
        .mockReturnValueOnce(projectChain) // First call: fetch project
        .mockReturnValueOnce(proposalChain) // Second call: fetch proposal
        .mockReturnValueOnce(updateChain); // Third call: update project

      const result = await service.acceptProposal(mockData.projectId, mockData.proposalId, mockData.userId);

      expect(result).toEqual({
        id: mockData.projectId,
        status: "in_progress",
        accepted_proposal_id: mockData.proposalId,
        accepted_price: 2500,
        updated_at: "2025-10-22T10:00:00Z",
      });
    });
  });

  describe("Project validation errors", () => {
    it("powinien rzucić błąd 404 gdy projekt nie istnieje", async () => {
      const projectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Project not found" },
        }),
      };

      mockFrom.mockReturnValue(projectChain);

      try {
        await service.acceptProposal(mockData.projectId, mockData.proposalId, mockData.userId);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(ProjectError);
        expect((error as ProjectError).code).toBe("PROJECT_NOT_FOUND");
        expect((error as ProjectError).statusCode).toBe(404);
        expect((error as ProjectError).message).toContain("Nie znaleziono projektu");
      }
    });

    it("powinien rzucić błąd 403 gdy użytkownik nie jest właścicielem projektu", async () => {
      const mockProject = {
        id: mockData.projectId,
        client_id: "different-user-uuid",
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

      mockFrom.mockReturnValue(projectChain);

      try {
        await service.acceptProposal(mockData.projectId, mockData.proposalId, mockData.userId);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(ProjectError);
        expect((error as ProjectError).code).toBe("PROJECT_FORBIDDEN");
        expect((error as ProjectError).statusCode).toBe(403);
        expect((error as ProjectError).message).toContain("Nie masz uprawnień");
      }
    });

    it("powinien rzucić błąd 400 gdy projekt nie jest otwarty", async () => {
      const mockProject = {
        id: mockData.projectId,
        client_id: mockData.userId,
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

      mockFrom.mockReturnValue(projectChain);

      try {
        await service.acceptProposal(mockData.projectId, mockData.proposalId, mockData.userId);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(ProjectError);
        expect((error as ProjectError).code).toBe("PROJECT_NOT_OPEN");
        expect((error as ProjectError).statusCode).toBe(400);
        expect((error as ProjectError).message).toContain("Nie można zaakceptować propozycji");
      }
    });
  });

  describe("Proposal validation errors", () => {
    it("powinien rzucić błąd 404 gdy propozycja nie istnieje", async () => {
      const mockProject = {
        id: mockData.projectId,
        client_id: mockData.userId,
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
          error: { message: "Proposal not found" },
        }),
      };

      mockFrom.mockReturnValueOnce(projectChain).mockReturnValueOnce(proposalChain);

      try {
        await service.acceptProposal(mockData.projectId, mockData.proposalId, mockData.userId);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(ProjectError);
        expect((error as ProjectError).code).toBe("PROPOSAL_NOT_FOUND");
        expect((error as ProjectError).statusCode).toBe(404);
        expect((error as ProjectError).message).toContain("Nie znaleziono propozycji");
      }
    });

    it("powinien rzucić błąd 400 gdy propozycja nie należy do projektu", async () => {
      const mockProject = {
        id: mockData.projectId,
        client_id: mockData.userId,
        status: "open",
      };

      const mockProposal = {
        id: mockData.proposalId,
        project_id: "different-project-uuid",
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

      mockFrom.mockReturnValueOnce(projectChain).mockReturnValueOnce(proposalChain);

      try {
        await service.acceptProposal(mockData.projectId, mockData.proposalId, mockData.userId);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(ProjectError);
        expect((error as ProjectError).code).toBe("PROPOSAL_PROJECT_MISMATCH");
        expect((error as ProjectError).statusCode).toBe(400);
        expect((error as ProjectError).message).toContain("Propozycja nie należy do tego projektu");
      }
    });
  });

  describe("Update errors", () => {
    it("powinien rzucić błąd 500 gdy aktualizacja projektu nie powiedzie się", async () => {
      const mockProject = {
        id: mockData.projectId,
        client_id: mockData.userId,
        status: "open",
      };

      const mockProposal = {
        id: mockData.proposalId,
        project_id: mockData.projectId,
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

      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Update failed" },
        }),
      };

      mockFrom.mockReturnValueOnce(projectChain).mockReturnValueOnce(proposalChain).mockReturnValueOnce(updateChain);

      try {
        await service.acceptProposal(mockData.projectId, mockData.proposalId, mockData.userId);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(ProjectError);
        expect((error as ProjectError).code).toBe("PROPOSAL_ACCEPT_FAILED");
        expect((error as ProjectError).statusCode).toBe(500);
        expect((error as ProjectError).message).toContain("Nie udało się zaakceptować propozycji");
      }
    });
  });
});

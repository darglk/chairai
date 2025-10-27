/**
 * Unit tests for ProjectService.updateProjectStatus()
 *
 * Tests the business logic for updating project status, including validation,
 * authorization checks, and status transition validation.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { ProjectService } from "@/lib/services/project.service";
import type { SupabaseClient } from "@/db/supabase.client";
import type { ProjectStatus } from "@/types";

describe("ProjectService - updateProjectStatus()", () => {
  let service: ProjectService;
  let mockSupabase: SupabaseClient;
  let mockFrom: ReturnType<typeof vi.fn>;

  const mockData = {
    projectId: "project-uuid-1",
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
    it("powinien pomyślnie zaktualizować status z 'open' na 'closed'", async () => {
      const mockProject = {
        id: mockData.projectId,
        client_id: mockData.userId,
        status: "open" as ProjectStatus,
      };

      const mockUpdatedProject = {
        id: mockData.projectId,
        status: "closed" as ProjectStatus,
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

      mockFrom
        .mockReturnValueOnce(projectChain) // First call: fetch project
        .mockReturnValueOnce(updateChain); // Second call: update project

      const result = await service.updateProjectStatus(mockData.projectId, "closed", mockData.userId);

      expect(result).toEqual({
        id: mockData.projectId,
        status: "closed",
        updated_at: "2025-10-22T10:00:00Z",
      });

      // Verify update was called with correct data
      expect(updateChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "closed",
        })
      );
    });

    it("powinien pomyślnie zaktualizować status z 'in_progress' na 'completed'", async () => {
      const mockProject = {
        id: mockData.projectId,
        client_id: mockData.userId,
        status: "in_progress" as ProjectStatus,
      };

      const mockUpdatedProject = {
        id: mockData.projectId,
        status: "completed" as ProjectStatus,
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

      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUpdatedProject,
          error: null,
        }),
      };

      mockFrom.mockReturnValueOnce(projectChain).mockReturnValueOnce(updateChain);

      const result = await service.updateProjectStatus(mockData.projectId, "completed", mockData.userId);

      expect(result).toEqual({
        id: mockData.projectId,
        status: "completed",
        updated_at: "2025-10-22T10:00:00Z",
      });
    });

    it("powinien pomyślnie zaktualizować status z 'in_progress' na 'closed'", async () => {
      const mockProject = {
        id: mockData.projectId,
        client_id: mockData.userId,
        status: "in_progress" as ProjectStatus,
      };

      const mockUpdatedProject = {
        id: mockData.projectId,
        status: "closed" as ProjectStatus,
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

      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUpdatedProject,
          error: null,
        }),
      };

      mockFrom.mockReturnValueOnce(projectChain).mockReturnValueOnce(updateChain);

      const result = await service.updateProjectStatus(mockData.projectId, "closed", mockData.userId);

      expect(result.status).toBe("closed");
    });

    it("powinien pomyślnie zaktualizować status z 'completed' na 'closed'", async () => {
      const mockProject = {
        id: mockData.projectId,
        client_id: mockData.userId,
        status: "completed" as ProjectStatus,
      };

      const mockUpdatedProject = {
        id: mockData.projectId,
        status: "closed" as ProjectStatus,
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

      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUpdatedProject,
          error: null,
        }),
      };

      mockFrom.mockReturnValueOnce(projectChain).mockReturnValueOnce(updateChain);

      const result = await service.updateProjectStatus(mockData.projectId, "closed", mockData.userId);

      expect(result.status).toBe("closed");
    });

    it("powinien zwrócić obecny status jeśli nowy status jest taki sam", async () => {
      const mockProject = {
        id: mockData.projectId,
        client_id: mockData.userId,
        status: "open" as ProjectStatus,
      };

      const projectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProject,
          error: null,
        }),
      };

      mockFrom.mockReturnValueOnce(projectChain);

      const result = await service.updateProjectStatus(mockData.projectId, "open", mockData.userId);

      expect(result.status).toBe("open");
      // Verify that update was NOT called since status is the same
      expect(mockFrom).toHaveBeenCalledTimes(1); // Only fetch, no update
    });
  });

  describe("Error scenarios - Not Found", () => {
    it("powinien rzucić błąd PROJECT_NOT_FOUND gdy projekt nie istnieje", async () => {
      const projectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Not found" },
        }),
      };

      mockFrom.mockReturnValueOnce(projectChain);

      await expect(service.updateProjectStatus(mockData.projectId, "closed", mockData.userId)).rejects.toMatchObject({
        name: "ProjectError",
        code: "PROJECT_NOT_FOUND",
        statusCode: 404,
      });
    });
  });

  describe("Error scenarios - Authorization", () => {
    it("powinien rzucić błąd PROJECT_FORBIDDEN gdy użytkownik nie jest właścicielem projektu", async () => {
      const mockProject = {
        id: mockData.projectId,
        client_id: "different-user-uuid",
        status: "open" as ProjectStatus,
      };

      const projectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProject,
          error: null,
        }),
      };

      mockFrom.mockReturnValueOnce(projectChain);

      await expect(service.updateProjectStatus(mockData.projectId, "closed", mockData.userId)).rejects.toMatchObject({
        name: "ProjectError",
        code: "PROJECT_FORBIDDEN",
        statusCode: 403,
      });
    });
  });

  describe("Error scenarios - Invalid Status Transitions", () => {
    it("powinien rzucić błąd gdy próbuje zmienić status z 'open' na 'in_progress'", async () => {
      const mockProject = {
        id: mockData.projectId,
        client_id: mockData.userId,
        status: "open" as ProjectStatus,
      };

      const projectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProject,
          error: null,
        }),
      };

      mockFrom.mockReturnValueOnce(projectChain);

      await expect(
        service.updateProjectStatus(mockData.projectId, "in_progress", mockData.userId)
      ).rejects.toMatchObject({
        name: "ProjectError",
        code: "INVALID_STATUS_TRANSITION",
        statusCode: 400,
        message: expect.stringContaining("Niedozwolona zmiana statusu"),
      });
    });

    it("powinien rzucić błąd gdy próbuje zmienić status z 'open' na 'completed'", async () => {
      const mockProject = {
        id: mockData.projectId,
        client_id: mockData.userId,
        status: "open" as ProjectStatus,
      };

      const projectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProject,
          error: null,
        }),
      };

      mockFrom.mockReturnValueOnce(projectChain);

      await expect(service.updateProjectStatus(mockData.projectId, "completed", mockData.userId)).rejects.toMatchObject(
        {
          name: "ProjectError",
          code: "INVALID_STATUS_TRANSITION",
          statusCode: 400,
        }
      );
    });

    it("powinien rzucić błąd gdy próbuje zmienić status z 'in_progress' na 'open'", async () => {
      const mockProject = {
        id: mockData.projectId,
        client_id: mockData.userId,
        status: "in_progress" as ProjectStatus,
      };

      const projectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProject,
          error: null,
        }),
      };

      mockFrom.mockReturnValueOnce(projectChain);

      await expect(service.updateProjectStatus(mockData.projectId, "open", mockData.userId)).rejects.toMatchObject({
        name: "ProjectError",
        code: "INVALID_STATUS_TRANSITION",
        statusCode: 400,
      });
    });

    it("powinien rzucić błąd gdy próbuje zmienić status z 'completed' na 'open'", async () => {
      const mockProject = {
        id: mockData.projectId,
        client_id: mockData.userId,
        status: "completed" as ProjectStatus,
      };

      const projectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProject,
          error: null,
        }),
      };

      mockFrom.mockReturnValueOnce(projectChain);

      await expect(service.updateProjectStatus(mockData.projectId, "open", mockData.userId)).rejects.toMatchObject({
        name: "ProjectError",
        code: "INVALID_STATUS_TRANSITION",
        statusCode: 400,
      });
    });

    it("powinien rzucić błąd gdy próbuje zmienić status z 'completed' na 'in_progress'", async () => {
      const mockProject = {
        id: mockData.projectId,
        client_id: mockData.userId,
        status: "completed" as ProjectStatus,
      };

      const projectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProject,
          error: null,
        }),
      };

      mockFrom.mockReturnValueOnce(projectChain);

      await expect(
        service.updateProjectStatus(mockData.projectId, "in_progress", mockData.userId)
      ).rejects.toMatchObject({
        name: "ProjectError",
        code: "INVALID_STATUS_TRANSITION",
        statusCode: 400,
      });
    });

    it("powinien rzucić błąd gdy próbuje zmienić status z 'closed' na jakikolwiek inny", async () => {
      const mockProject = {
        id: mockData.projectId,
        client_id: mockData.userId,
        status: "closed" as ProjectStatus,
      };

      const projectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProject,
          error: null,
        }),
      };

      mockFrom.mockReturnValueOnce(projectChain);

      await expect(service.updateProjectStatus(mockData.projectId, "open", mockData.userId)).rejects.toMatchObject({
        name: "ProjectError",
        code: "INVALID_STATUS_TRANSITION",
        statusCode: 400,
      });
    });
  });

  describe("Error scenarios - Database Errors", () => {
    it("powinien rzucić błąd STATUS_UPDATE_FAILED gdy aktualizacja w bazie danych się nie powiedzie", async () => {
      const mockProject = {
        id: mockData.projectId,
        client_id: mockData.userId,
        status: "open" as ProjectStatus,
      };

      const projectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProject,
          error: null,
        }),
      };

      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        }),
      };

      mockFrom.mockReturnValueOnce(projectChain).mockReturnValueOnce(updateChain);

      await expect(service.updateProjectStatus(mockData.projectId, "closed", mockData.userId)).rejects.toMatchObject({
        name: "ProjectError",
        code: "STATUS_UPDATE_FAILED",
        statusCode: 500,
      });
    });
  });
});

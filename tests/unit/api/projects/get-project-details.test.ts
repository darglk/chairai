/**
 * Unit Tests: GET /api/projects/{projectId}
 *
 * Tests the project details endpoint including authentication,
 * authorization, and access control.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/pages/api/projects/[projectId]";
import type { APIContext } from "astro";
import type { ProjectDTO } from "@/types";

// Mock ProjectService
const mockGetProjectDetails = vi.fn();

vi.mock("@/lib/services/project.service", () => {
  return {
    ProjectService: vi.fn().mockImplementation(() => ({
      getProjectDetails: mockGetProjectDetails,
    })),
    ProjectError: class ProjectError extends Error {
      constructor(
        message: string,
        public code: string,
        public statusCode = 400
      ) {
        super(message);
        this.name = "ProjectError";
      }
    },
  };
});

/**
 * Creates a mock APIContext for testing
 */
function createMockContext(
  projectId: string,
  user: { id: string; role: string } | null = { id: "client-123", role: "client" }
): APIContext {
  return {
    params: { projectId },
    request: {} as Request,
    locals: {
      supabase: {
        from: vi.fn(),
      } as unknown as APIContext["locals"]["supabase"],
      user: user as APIContext["locals"]["user"],
    },
    cookies: {} as APIContext["cookies"],
    url: new URL(`http://localhost:3000/api/projects/${projectId}`),
  } as unknown as APIContext;
}

/**
 * Creates mock project DTO
 */
function createMockProjectDTO(): ProjectDTO {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    client_id: "client-123",
    generated_image: {
      id: "image-123",
      image_url: "https://storage.example.com/image.png",
      prompt: "A modern oak dining table",
    },
    category: {
      id: "category-123",
      name: "Stoły",
    },
    material: {
      id: "material-123",
      name: "Dąb",
    },
    status: "open",
    dimensions: "200x100x75 cm",
    budget_range: "5000-8000 PLN",
    accepted_proposal_id: null,
    accepted_price: null,
    proposals_count: 3,
    created_at: "2025-10-19T12:00:00Z",
    updated_at: "2025-10-19T12:00:00Z",
  };
}

describe("GET /api/projects/{projectId}", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProjectDetails.mockReset();
  });

  // ============================================================================
  // SUCCESS CASES
  // ============================================================================

  describe("Success Cases", () => {
    const validProjectId = "550e8400-e29b-41d4-a716-446655440000";

    it("should return project details for project owner", async () => {
      const mockProject = createMockProjectDTO();
      mockGetProjectDetails.mockResolvedValue(mockProject);

      const context = createMockContext(validProjectId, { id: "client-123", role: "client" });
      const response = await GET(context);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(mockProject);
      expect(mockGetProjectDetails).toHaveBeenCalledWith(validProjectId, "client-123", "client");
    });

    it("should return project details for artisan viewing open project", async () => {
      const mockProject = createMockProjectDTO();
      mockGetProjectDetails.mockResolvedValue(mockProject);

      const context = createMockContext(validProjectId, { id: "artisan-123", role: "artisan" });
      const response = await GET(context);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(mockProject);
      expect(mockGetProjectDetails).toHaveBeenCalledWith(validProjectId, "artisan-123", "artisan");
    });

    it("should include proposals count in response", async () => {
      const mockProject = createMockProjectDTO();
      mockProject.proposals_count = 5;
      mockGetProjectDetails.mockResolvedValue(mockProject);

      const context = createMockContext(validProjectId);
      const response = await GET(context);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.proposals_count).toBe(5);
    });
  });

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  describe("Authentication", () => {
    const validProjectId = "550e8400-e29b-41d4-a716-446655440000";

    it("should reject unauthenticated requests", async () => {
      const context = createMockContext(validProjectId, null);
      const response = await GET(context);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error.code).toBe("UNAUTHORIZED");
      expect(mockGetProjectDetails).not.toHaveBeenCalled();
    });

    it("should reject requests without role", async () => {
      const context = createMockContext(validProjectId, { id: "user-123", role: "" });
      const response = await GET(context);

      expect(response.status).toBe(401);
      expect(mockGetProjectDetails).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // AUTHORIZATION
  // ============================================================================

  describe("Authorization", () => {
    const validProjectId = "550e8400-e29b-41d4-a716-446655440000";

    it("should reject artisan access to closed project", async () => {
      const { ProjectError } = await import("@/lib/services/project.service");
      mockGetProjectDetails.mockRejectedValue(
        new ProjectError("Brak uprawnień do wyświetlenia tego projektu", "PROJECT_FORBIDDEN", 403)
      );

      const context = createMockContext(validProjectId, { id: "artisan-123", role: "artisan" });
      const response = await GET(context);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error.code).toBe("PROJECT_FORBIDDEN");
    });

    it("should reject non-owner client access", async () => {
      const { ProjectError } = await import("@/lib/services/project.service");
      mockGetProjectDetails.mockRejectedValue(
        new ProjectError("Brak uprawnień do wyświetlenia tego projektu", "PROJECT_FORBIDDEN", 403)
      );

      const context = createMockContext(validProjectId, { id: "different-client-123", role: "client" });
      const response = await GET(context);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error.code).toBe("PROJECT_FORBIDDEN");
    });
  });

  // ============================================================================
  // VALIDATION
  // ============================================================================

  describe("Validation", () => {
    it("should reject invalid projectId format", async () => {
      const context = createMockContext("not-a-uuid");
      const response = await GET(context);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.message).toContain("Nieprawidłowy format ID projektu");
      expect(mockGetProjectDetails).not.toHaveBeenCalled();
    });

    it("should accept valid UUID", async () => {
      const mockProject = createMockProjectDTO();
      mockGetProjectDetails.mockResolvedValue(mockProject);

      const validUuid = "550e8400-e29b-41d4-a716-446655440000";
      const context = createMockContext(validUuid);
      const response = await GET(context);

      expect(response.status).toBe(200);
      expect(mockGetProjectDetails).toHaveBeenCalledWith(validUuid, "client-123", "client");
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe("Error Handling", () => {
    const validProjectId = "550e8400-e29b-41d4-a716-446655440000";

    it("should handle project not found", async () => {
      const { ProjectError } = await import("@/lib/services/project.service");
      mockGetProjectDetails.mockRejectedValue(new ProjectError("Nie znaleziono projektu", "PROJECT_NOT_FOUND", 404));

      const context = createMockContext("550e8400-e29b-41d4-a716-446655440000");
      const response = await GET(context);

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error.code).toBe("PROJECT_NOT_FOUND");
      expect(body.error.message).toBe("Nie znaleziono projektu");
    });

    it("should handle service errors", async () => {
      const { ProjectError } = await import("@/lib/services/project.service");
      mockGetProjectDetails.mockRejectedValue(new ProjectError("Database error", "INTERNAL_ERROR", 500));

      const context = createMockContext(validProjectId);
      const response = await GET(context);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error.code).toBe("INTERNAL_ERROR");
    });

    it("should handle unexpected errors", async () => {
      mockGetProjectDetails.mockRejectedValue(new Error("Unexpected error"));

      const context = createMockContext(validProjectId);
      const response = await GET(context);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe("Edge Cases", () => {
    const validProjectId = "550e8400-e29b-41d4-a716-446655440000";

    it("should handle project with zero proposals", async () => {
      const mockProject = createMockProjectDTO();
      mockProject.proposals_count = 0;
      mockGetProjectDetails.mockResolvedValue(mockProject);

      const context = createMockContext(validProjectId);
      const response = await GET(context);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.proposals_count).toBe(0);
    });

    it("should handle project with null optional fields", async () => {
      const mockProject = createMockProjectDTO();
      mockProject.dimensions = null;
      mockProject.budget_range = null;
      mockProject.accepted_proposal_id = null;
      mockProject.accepted_price = null;
      mockGetProjectDetails.mockResolvedValue(mockProject);

      const context = createMockContext(validProjectId);
      const response = await GET(context);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.dimensions).toBeNull();
      expect(body.budget_range).toBeNull();
      expect(body.accepted_proposal_id).toBeNull();
      expect(body.accepted_price).toBeNull();
    });

    it("should handle different project statuses", async () => {
      const statuses: ("open" | "in_progress" | "completed" | "closed")[] = [
        "open",
        "in_progress",
        "completed",
        "closed",
      ];

      for (const status of statuses) {
        const mockProject = createMockProjectDTO();
        mockProject.status = status;
        mockGetProjectDetails.mockResolvedValue(mockProject);

        const context = createMockContext(validProjectId);
        const response = await GET(context);

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.status).toBe(status);
      }
    });
  });
});

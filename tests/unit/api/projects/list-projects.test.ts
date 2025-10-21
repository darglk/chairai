/**
 * Unit Tests: GET /api/projects
 *
 * Tests the project listing endpoint including authentication,
 * authorization, validation, and pagination.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/pages/api/projects/index";
import type { APIContext } from "astro";
import type { PaginatedResponseDTO, ProjectListItemDTO } from "@/types";

// Mock ProjectService
const mockListProjects = vi.fn();

vi.mock("@/lib/services/project.service", () => {
  return {
    ProjectService: vi.fn().mockImplementation(() => ({
      listProjects: mockListProjects,
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
  queryParams: Record<string, string> = {},
  user: { id: string; role: string } | null = { id: "artisan-123", role: "artisan" }
): APIContext {
  const url = new URL("http://localhost:3000/api/projects");
  Object.entries(queryParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return {
    url,
    request: {} as Request,
    locals: {
      supabase: {
        from: vi.fn(),
      } as unknown as APIContext["locals"]["supabase"],
      user: user as APIContext["locals"]["user"],
    },
    cookies: {} as APIContext["cookies"],
  } as unknown as APIContext;
}

/**
 * Creates mock paginated response
 */
function createMockPaginatedResponse(): PaginatedResponseDTO<ProjectListItemDTO> {
  return {
    data: [
      {
        id: "project-1",
        client_id: "client-1",
        generated_image: {
          id: "image-1",
          image_url: "https://storage.example.com/image1.png",
          prompt: "Modern oak table",
        },
        category: {
          id: "category-1",
          name: "Stoły",
        },
        material: {
          id: "material-1",
          name: "Dąb",
        },
        status: "open",
        dimensions: "200x100x75 cm",
        budget_range: "5000-8000 PLN",
        accepted_proposal_id: null,
        accepted_price: null,
        created_at: "2025-10-19T12:00:00Z",
        updated_at: "2025-10-19T12:00:00Z",
      },
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 1,
      total_pages: 1,
    },
  };
}

describe("GET /api/projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListProjects.mockReset();
  });

  // ============================================================================
  // SUCCESS CASES
  // ============================================================================

  describe("Success Cases", () => {
    it("should list projects with default parameters", async () => {
      const mockResponse = createMockPaginatedResponse();
      mockListProjects.mockResolvedValue(mockResponse);

      const context = createMockContext();
      const response = await GET(context);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(mockResponse);
      expect(mockListProjects).toHaveBeenCalledWith(
        {
          status: "open",
          category_id: undefined,
          material_id: undefined,
          page: 1,
          limit: 20,
        },
        "artisan-123",
        "artisan"
      );
    });

    it("should list projects with custom filters", async () => {
      const mockResponse = createMockPaginatedResponse();
      mockListProjects.mockResolvedValue(mockResponse);

      const validCategoryId = "550e8400-e29b-41d4-a716-446655440000";
      const validMaterialId = "550e8400-e29b-41d4-a716-446655440001";

      const context = createMockContext({
        status: "in_progress",
        category_id: validCategoryId,
        material_id: validMaterialId,
        page: "2",
        limit: "10",
      });

      const response = await GET(context);

      expect(response.status).toBe(200);
      expect(mockListProjects).toHaveBeenCalledWith(
        {
          status: "in_progress",
          category_id: validCategoryId,
          material_id: validMaterialId,
          page: 2,
          limit: 10,
        },
        "artisan-123",
        "artisan"
      );
    });

    it("should handle empty results", async () => {
      const emptyResponse: PaginatedResponseDTO<ProjectListItemDTO> = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          total_pages: 0,
        },
      };
      mockListProjects.mockResolvedValue(emptyResponse);

      const context = createMockContext();
      const response = await GET(context);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data).toEqual([]);
      expect(body.pagination.total).toBe(0);
    });
  });

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  describe("Authentication", () => {
    it("should reject unauthenticated requests", async () => {
      const context = createMockContext({}, null);
      const response = await GET(context);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error.code).toBe("UNAUTHORIZED");
      expect(mockListProjects).not.toHaveBeenCalled();
    });

    it("should reject requests without role", async () => {
      const context = createMockContext({}, { id: "user-123", role: "" });
      const response = await GET(context);

      expect(response.status).toBe(401);
      expect(mockListProjects).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // AUTHORIZATION
  // ============================================================================

  describe("Authorization", () => {
    it("should reject client users", async () => {
      const { ProjectError } = await import("@/lib/services/project.service");
      mockListProjects.mockRejectedValue(
        new ProjectError("Tylko rzemieślnicy mogą przeglądać listę projektów", "FORBIDDEN", 403)
      );

      const context = createMockContext({}, { id: "client-123", role: "client" });
      const response = await GET(context);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error.code).toBe("FORBIDDEN");
    });
  });

  // ============================================================================
  // VALIDATION
  // ============================================================================

  describe("Validation", () => {
    it("should reject invalid status", async () => {
      const context = createMockContext({
        status: "invalid_status",
      });

      const response = await GET(context);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(mockListProjects).not.toHaveBeenCalled();
    });

    it("should reject invalid category_id", async () => {
      const context = createMockContext({
        category_id: "not-a-uuid",
      });

      const response = await GET(context);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(mockListProjects).not.toHaveBeenCalled();
    });

    it("should reject invalid material_id", async () => {
      const context = createMockContext({
        material_id: "not-a-uuid",
      });

      const response = await GET(context);

      expect(response.status).toBe(400);
      expect(mockListProjects).not.toHaveBeenCalled();
    });

    it("should reject invalid page number", async () => {
      const context = createMockContext({
        page: "0",
      });

      const response = await GET(context);

      expect(response.status).toBe(400);
      expect(mockListProjects).not.toHaveBeenCalled();
    });

    it("should reject limit exceeding maximum", async () => {
      const context = createMockContext({
        limit: "101",
      });

      const response = await GET(context);

      expect(response.status).toBe(400);
      expect(mockListProjects).not.toHaveBeenCalled();
    });

    it("should accept valid UUID filters", async () => {
      const mockResponse = createMockPaginatedResponse();
      mockListProjects.mockResolvedValue(mockResponse);

      const validUuid = "550e8400-e29b-41d4-a716-446655440000";
      const context = createMockContext({
        category_id: validUuid,
        material_id: validUuid,
      });

      const response = await GET(context);

      expect(response.status).toBe(200);
      expect(mockListProjects).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe("Error Handling", () => {
    it("should handle service errors", async () => {
      const { ProjectError } = await import("@/lib/services/project.service");
      mockListProjects.mockRejectedValue(
        new ProjectError("Nie udało się pobrać listy projektów", "PROJECTS_FETCH_FAILED", 500)
      );

      const context = createMockContext();
      const response = await GET(context);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error.code).toBe("PROJECTS_FETCH_FAILED");
    });

    it("should handle unexpected errors", async () => {
      mockListProjects.mockRejectedValue(new Error("Unexpected error"));

      const context = createMockContext();
      const response = await GET(context);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
    });
  });
});

/**
 * Unit Tests: GET /api/projects/me
 *
 * Tests the client's projects listing endpoint including authentication,
 * authorization, validation, and pagination.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/pages/api/projects/me";
import type { APIContext } from "astro";
import type { PaginatedResponseDTO, ProjectDTO } from "@/types";

// Mock ProjectService
const mockListMyProjects = vi.fn();

vi.mock("@/lib/services/project.service", () => {
  return {
    ProjectService: vi.fn().mockImplementation(() => ({
      listMyProjects: mockListMyProjects,
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
  user: { id: string; role: string } | null = { id: "client-123", role: "client" }
): APIContext {
  const url = new URL("http://localhost:3000/api/projects/me");
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
 * Creates mock paginated response with client projects
 */
function createMockPaginatedResponse(): PaginatedResponseDTO<ProjectDTO> {
  return {
    data: [
      {
        id: "project-1",
        client_id: "client-123",
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
        proposals_count: 3,
        created_at: "2025-10-19T12:00:00Z",
        updated_at: "2025-10-19T12:00:00Z",
      },
      {
        id: "project-2",
        client_id: "client-123",
        generated_image: {
          id: "image-2",
          image_url: "https://storage.example.com/image2.png",
          prompt: "Leather armchair",
        },
        category: {
          id: "category-2",
          name: "Krzesła",
        },
        material: {
          id: "material-2",
          name: "Skóra",
        },
        status: "in_progress",
        dimensions: "80x90x100 cm",
        budget_range: "3000-5000 PLN",
        accepted_proposal_id: "proposal-1",
        accepted_price: 4200,
        proposals_count: 5,
        created_at: "2025-10-18T10:00:00Z",
        updated_at: "2025-10-19T14:30:00Z",
      },
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 2,
      total_pages: 1,
    },
  };
}

describe("GET /api/projects/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListMyProjects.mockReset();
  });

  // ============================================================================
  // SUCCESS CASES
  // ============================================================================

  describe("Success Cases", () => {
    it("should list client's projects with default parameters", async () => {
      const mockResponse = createMockPaginatedResponse();
      mockListMyProjects.mockResolvedValue(mockResponse);

      const context = createMockContext();
      const response = await GET(context);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(mockResponse);
      expect(mockListMyProjects).toHaveBeenCalledWith(
        {
          page: 1,
          limit: 20,
        },
        "client-123"
      );
    });

    it("should list projects with custom pagination", async () => {
      const mockResponse = createMockPaginatedResponse();
      mockListMyProjects.mockResolvedValue(mockResponse);

      const context = createMockContext({
        page: "2",
        limit: "10",
      });

      const response = await GET(context);

      expect(response.status).toBe(200);
      expect(mockListMyProjects).toHaveBeenCalledWith(
        {
          page: 2,
          limit: 10,
        },
        "client-123"
      );
    });

    it("should handle empty results for client with no projects", async () => {
      const emptyResponse: PaginatedResponseDTO<ProjectDTO> = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          total_pages: 0,
        },
      };
      mockListMyProjects.mockResolvedValue(emptyResponse);

      const context = createMockContext();
      const response = await GET(context);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data).toEqual([]);
      expect(body.pagination.total).toBe(0);
    });

    it("should return projects with proposals_count included", async () => {
      const mockResponse = createMockPaginatedResponse();
      mockListMyProjects.mockResolvedValue(mockResponse);

      const context = createMockContext();
      const response = await GET(context);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data[0]).toHaveProperty("proposals_count");
      expect(body.data[0].proposals_count).toBe(3);
      expect(body.data[1].proposals_count).toBe(5);
    });

    it("should accept maximum limit of 100", async () => {
      const mockResponse = createMockPaginatedResponse();
      mockListMyProjects.mockResolvedValue(mockResponse);

      const context = createMockContext({
        limit: "100",
      });

      const response = await GET(context);

      expect(response.status).toBe(200);
      expect(mockListMyProjects).toHaveBeenCalledWith(
        {
          page: 1,
          limit: 100,
        },
        "client-123"
      );
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
      expect(body.error.message).toBe("Wymagane uwierzytelnienie");
      expect(mockListMyProjects).not.toHaveBeenCalled();
    });

    it("should reject requests without role", async () => {
      const context = createMockContext({}, { id: "user-123", role: "" });
      const response = await GET(context);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error.code).toBe("UNAUTHORIZED");
      expect(mockListMyProjects).not.toHaveBeenCalled();
    });

    it("should reject requests with undefined user", async () => {
      const context = createMockContext({}, null);
      const response = await GET(context);

      expect(response.status).toBe(401);
      expect(mockListMyProjects).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // AUTHORIZATION
  // ============================================================================

  describe("Authorization", () => {
    it("should reject artisan users", async () => {
      const context = createMockContext({}, { id: "artisan-123", role: "artisan" });
      const response = await GET(context);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error.code).toBe("FORBIDDEN");
      expect(body.error.message).toBe("Tylko klienci mogą przeglądać swoje projekty");
      expect(mockListMyProjects).not.toHaveBeenCalled();
    });

    it("should only allow client role", async () => {
      const context = createMockContext({}, { id: "client-123", role: "client" });
      const mockResponse = createMockPaginatedResponse();
      mockListMyProjects.mockResolvedValue(mockResponse);

      const response = await GET(context);

      expect(response.status).toBe(200);
      expect(mockListMyProjects).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // VALIDATION
  // ============================================================================

  describe("Validation", () => {
    it("should reject page number less than 1", async () => {
      const context = createMockContext({
        page: "0",
      });

      const response = await GET(context);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.message).toBe("Błędne parametry zapytania");
      expect(mockListMyProjects).not.toHaveBeenCalled();
    });

    it("should reject negative page numbers", async () => {
      const context = createMockContext({
        page: "-1",
      });

      const response = await GET(context);

      expect(response.status).toBe(400);
      expect(mockListMyProjects).not.toHaveBeenCalled();
    });

    it("should reject limit exceeding maximum (101)", async () => {
      const context = createMockContext({
        limit: "101",
      });

      const response = await GET(context);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(mockListMyProjects).not.toHaveBeenCalled();
    });

    it("should reject zero or negative limits", async () => {
      const context = createMockContext({
        limit: "0",
      });

      const response = await GET(context);

      expect(response.status).toBe(400);
      expect(mockListMyProjects).not.toHaveBeenCalled();
    });

    it("should reject non-numeric page parameter", async () => {
      const context = createMockContext({
        page: "abc",
      });

      const response = await GET(context);

      expect(response.status).toBe(400);
      expect(mockListMyProjects).not.toHaveBeenCalled();
    });

    it("should reject non-numeric limit parameter", async () => {
      const context = createMockContext({
        limit: "xyz",
      });

      const response = await GET(context);

      expect(response.status).toBe(400);
      expect(mockListMyProjects).not.toHaveBeenCalled();
    });

    it("should use default values when parameters are missing", async () => {
      const mockResponse = createMockPaginatedResponse();
      mockListMyProjects.mockResolvedValue(mockResponse);

      const context = createMockContext({});
      const response = await GET(context);

      expect(response.status).toBe(200);
      expect(mockListMyProjects).toHaveBeenCalledWith(
        {
          page: 1,
          limit: 20,
        },
        "client-123"
      );
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe("Error Handling", () => {
    it("should handle service errors", async () => {
      const { ProjectError } = await import("@/lib/services/project.service");
      mockListMyProjects.mockRejectedValue(
        new ProjectError("Nie udało się pobrać listy projektów", "PROJECT_LIST_FAILED", 500)
      );

      const context = createMockContext();
      const response = await GET(context);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error.code).toBe("PROJECT_LIST_FAILED");
      expect(body.error.message).toBe("Nie udało się pobrać listy projektów");
    });

    it("should handle unexpected errors", async () => {
      mockListMyProjects.mockRejectedValue(new Error("Unexpected database error"));

      const context = createMockContext();
      const response = await GET(context);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
      expect(body.error.message).toBe("Wystąpił nieoczekiwany błąd");
    });

    it("should handle ProjectError with custom status code", async () => {
      const { ProjectError } = await import("@/lib/services/project.service");
      mockListMyProjects.mockRejectedValue(new ProjectError("Custom error", "CUSTOM_ERROR", 418));

      const context = createMockContext();
      const response = await GET(context);

      expect(response.status).toBe(418);
      const body = await response.json();
      expect(body.error.code).toBe("CUSTOM_ERROR");
    });
  });

  // ============================================================================
  // PAGINATION
  // ============================================================================

  describe("Pagination", () => {
    it("should return correct pagination metadata", async () => {
      const mockResponse: PaginatedResponseDTO<ProjectDTO> = {
        data: [],
        pagination: {
          page: 2,
          limit: 10,
          total: 25,
          total_pages: 3,
        },
      };
      mockListMyProjects.mockResolvedValue(mockResponse);

      const context = createMockContext({
        page: "2",
        limit: "10",
      });

      const response = await GET(context);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        total_pages: 3,
      });
    });

    it("should handle last page correctly", async () => {
      const mockResponse: PaginatedResponseDTO<ProjectDTO> = {
        data: [createMockPaginatedResponse().data[0]],
        pagination: {
          page: 3,
          limit: 20,
          total: 45,
          total_pages: 3,
        },
      };
      mockListMyProjects.mockResolvedValue(mockResponse);

      const context = createMockContext({
        page: "3",
      });

      const response = await GET(context);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.pagination.page).toBe(3);
      expect(body.pagination.total_pages).toBe(3);
    });
  });

  // ============================================================================
  // DATA INTEGRITY
  // ============================================================================

  describe("Data Integrity", () => {
    it("should only return projects for authenticated client", async () => {
      const mockResponse = createMockPaginatedResponse();
      mockListMyProjects.mockResolvedValue(mockResponse);

      const context = createMockContext({}, { id: "client-456", role: "client" });
      const response = await GET(context);

      expect(response.status).toBe(200);
      expect(mockListMyProjects).toHaveBeenCalledWith(
        {
          page: 1,
          limit: 20,
        },
        "client-456"
      );
    });

    it("should include all required project fields", async () => {
      const mockResponse = createMockPaginatedResponse();
      mockListMyProjects.mockResolvedValue(mockResponse);

      const context = createMockContext();
      const response = await GET(context);

      expect(response.status).toBe(200);
      const body = await response.json();
      const project = body.data[0];

      expect(project).toHaveProperty("id");
      expect(project).toHaveProperty("client_id");
      expect(project).toHaveProperty("generated_image");
      expect(project).toHaveProperty("category");
      expect(project).toHaveProperty("material");
      expect(project).toHaveProperty("status");
      expect(project).toHaveProperty("proposals_count");
      expect(project).toHaveProperty("created_at");
      expect(project).toHaveProperty("updated_at");
    });

    it("should include nested object properties", async () => {
      const mockResponse = createMockPaginatedResponse();
      mockListMyProjects.mockResolvedValue(mockResponse);

      const context = createMockContext();
      const response = await GET(context);

      expect(response.status).toBe(200);
      const body = await response.json();
      const project = body.data[0];

      expect(project.generated_image).toHaveProperty("id");
      expect(project.generated_image).toHaveProperty("image_url");
      expect(project.generated_image).toHaveProperty("prompt");

      expect(project.category).toHaveProperty("id");
      expect(project.category).toHaveProperty("name");

      expect(project.material).toHaveProperty("id");
      expect(project.material).toHaveProperty("name");
    });
  });
});

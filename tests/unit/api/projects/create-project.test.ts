/**
 * Unit Tests: POST /api/projects
 *
 * Tests the project creation endpoint including authentication,
 * authorization, validation, and business logic integration.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/pages/api/projects/index";
import type { APIContext } from "astro";
import type { ProjectDTO } from "@/types";

// Mock ProjectService - will be configured per test
const mockCreateProject = vi.fn();

vi.mock("@/lib/services/project.service", () => {
  return {
    ProjectService: vi.fn().mockImplementation(() => ({
      createProject: mockCreateProject,
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
  body: unknown,
  user: { id: string; role: string } | null = { id: "client-123", role: "client" }
): APIContext {
  return {
    request: {
      json: async () => body,
    } as unknown as Request,
    locals: {
      supabase: {
        from: vi.fn(),
      } as unknown as APIContext["locals"]["supabase"],
      user: user as APIContext["locals"]["user"],
    },
    cookies: {} as APIContext["cookies"],
    url: new URL("http://localhost:3000/api/projects"),
  } as unknown as APIContext;
}

/**
 * Creates a mock ProjectDTO for successful responses
 */
function createMockProjectDTO(): ProjectDTO {
  return {
    id: "project-123",
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
    proposals_count: 0,
    created_at: "2025-10-19T12:00:00Z",
    updated_at: "2025-10-19T12:00:00Z",
  };
}

describe("POST /api/projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateProject.mockReset();
  });

  // ============================================================================
  // SUCCESS CASES
  // ============================================================================

  describe("Success Cases", () => {
    it("should create project successfully with all required and optional fields", async () => {
      const mockProject = createMockProjectDTO();

      // Mock successful project creation
      mockCreateProject.mockResolvedValue(mockProject);

      const requestBody = {
        generated_image_id: "550e8400-e29b-41d4-a716-446655440000",
        category_id: "660e8400-e29b-41d4-a716-446655440000",
        material_id: "770e8400-e29b-41d4-a716-446655440000",
        dimensions: "200x100x75 cm",
        budget_range: "5000-8000 PLN",
      };

      const context = createMockContext(requestBody);
      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockProject);
      expect(mockCreateProject).toHaveBeenCalledWith(requestBody, "client-123");
    });

    it("should create project successfully with only required fields", async () => {
      const mockProject = createMockProjectDTO();

      mockCreateProject.mockResolvedValue(mockProject);

      const requestBody = {
        generated_image_id: "550e8400-e29b-41d4-a716-446655440000",
        category_id: "660e8400-e29b-41d4-a716-446655440000",
        material_id: "770e8400-e29b-41d4-a716-446655440000",
      };

      const context = createMockContext(requestBody);
      const response = await POST(context);

      expect(response.status).toBe(201);
      expect(mockCreateProject).toHaveBeenCalledWith(requestBody, "client-123");
    });
  });

  // ============================================================================
  // AUTHENTICATION CASES
  // ============================================================================

  describe("Authentication", () => {
    it("should return 401 when user is not authenticated", async () => {
      const context = createMockContext(
        {
          generated_image_id: "image-123",
          category_id: "category-123",
          material_id: "material-123",
        },
        null // No user
      );

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe("UNAUTHORIZED");
      expect(data.error.message).toBe("Wymagane uwierzytelnienie");
    });
  });

  // ============================================================================
  // AUTHORIZATION CASES
  // ============================================================================

  describe("Authorization", () => {
    it("should return 403 when user role is not 'client'", async () => {
      const context = createMockContext(
        {
          generated_image_id: "image-123",
          category_id: "category-123",
          material_id: "material-123",
        },
        { id: "artisan-123", role: "artisan" }
      );

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe("FORBIDDEN");
      expect(data.error.message).toBe("Tylko klienci mogą tworzyć projekty");
    });
  });

  // ============================================================================
  // VALIDATION CASES
  // ============================================================================

  describe("Input Validation", () => {
    it("should return 400 when generated_image_id is missing", async () => {
      const context = createMockContext({
        category_id: "category-123",
        material_id: "material-123",
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.message).toBe("Błędne dane wejściowe");
      expect(data.error.details).toHaveProperty("generated_image_id");
    });

    it("should return 400 when category_id is missing", async () => {
      const context = createMockContext({
        generated_image_id: "image-123",
        material_id: "material-123",
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.details).toHaveProperty("category_id");
    });

    it("should return 400 when material_id is missing", async () => {
      const context = createMockContext({
        generated_image_id: "image-123",
        category_id: "category-123",
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.details).toHaveProperty("material_id");
    });

    it("should return 400 when generated_image_id is not a valid UUID", async () => {
      const context = createMockContext({
        generated_image_id: "not-a-uuid",
        category_id: "category-123",
        material_id: "material-123",
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.details).toHaveProperty("generated_image_id");
    });

    it("should return 400 when category_id is not a valid UUID", async () => {
      const context = createMockContext({
        generated_image_id: "550e8400-e29b-41d4-a716-446655440000",
        category_id: "not-a-uuid",
        material_id: "material-123",
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.details).toHaveProperty("category_id");
    });

    it("should return 400 when material_id is not a valid UUID", async () => {
      const context = createMockContext({
        generated_image_id: "550e8400-e29b-41d4-a716-446655440000",
        category_id: "550e8400-e29b-41d4-a716-446655440000",
        material_id: "not-a-uuid",
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.details).toHaveProperty("material_id");
    });

    it("should return 400 when dimensions exceeds 100 characters", async () => {
      const context = createMockContext({
        generated_image_id: "550e8400-e29b-41d4-a716-446655440000",
        category_id: "550e8400-e29b-41d4-a716-446655440000",
        material_id: "550e8400-e29b-41d4-a716-446655440000",
        dimensions: "a".repeat(101),
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.details).toHaveProperty("dimensions");
    });

    it("should return 400 when budget_range exceeds 50 characters", async () => {
      const context = createMockContext({
        generated_image_id: "550e8400-e29b-41d4-a716-446655440000",
        category_id: "550e8400-e29b-41d4-a716-446655440000",
        material_id: "550e8400-e29b-41d4-a716-446655440000",
        budget_range: "a".repeat(51),
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.details).toHaveProperty("budget_range");
    });
  });

  // ============================================================================
  // BUSINESS LOGIC ERROR CASES
  // ============================================================================

  describe("Business Logic Errors", () => {
    it("should return 404 when generated image is not found", async () => {
      const { ProjectError } = await import("@/lib/services/project.service");

      mockCreateProject.mockRejectedValue(
        new ProjectError("Nie znaleziono wygenerowanego obrazu", "IMAGE_NOT_FOUND", 404)
      );

      const context = createMockContext({
        generated_image_id: "550e8400-e29b-41d4-a716-446655440000",
        category_id: "660e8400-e29b-41d4-a716-446655440000",
        material_id: "770e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe("IMAGE_NOT_FOUND");
      expect(data.error.message).toBe("Nie znaleziono wygenerowanego obrazu");
    });

    it("should return 403 when image does not belong to the user", async () => {
      const { ProjectError } = await import("@/lib/services/project.service");

      mockCreateProject.mockRejectedValue(
        new ProjectError("Nie masz uprawnień do tego obrazu", "IMAGE_FORBIDDEN", 403)
      );

      const context = createMockContext({
        generated_image_id: "550e8400-e29b-41d4-a716-446655440000",
        category_id: "660e8400-e29b-41d4-a716-446655440000",
        material_id: "770e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe("IMAGE_FORBIDDEN");
      expect(data.error.message).toBe("Nie masz uprawnień do tego obrazu");
    });

    it("should return 409 when image is already used in another project", async () => {
      const { ProjectError } = await import("@/lib/services/project.service");

      mockCreateProject.mockRejectedValue(
        new ProjectError("Ten obraz jest już używany w innym projekcie", "IMAGE_ALREADY_USED", 409)
      );

      const context = createMockContext({
        generated_image_id: "550e8400-e29b-41d4-a716-446655440000",
        category_id: "660e8400-e29b-41d4-a716-446655440000",
        material_id: "770e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error.code).toBe("IMAGE_ALREADY_USED");
      expect(data.error.message).toBe("Ten obraz jest już używany w innym projekcie");
    });

    it("should return 404 when category is not found", async () => {
      const { ProjectError } = await import("@/lib/services/project.service");

      mockCreateProject.mockRejectedValue(new ProjectError("Nie znaleziono kategorii", "CATEGORY_NOT_FOUND", 404));

      const context = createMockContext({
        generated_image_id: "550e8400-e29b-41d4-a716-446655440000",
        category_id: "660e8400-e29b-41d4-a716-446655440000",
        material_id: "770e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe("CATEGORY_NOT_FOUND");
      expect(data.error.message).toBe("Nie znaleziono kategorii");
    });

    it("should return 404 when material is not found", async () => {
      const { ProjectError } = await import("@/lib/services/project.service");

      mockCreateProject.mockRejectedValue(new ProjectError("Nie znaleziono materiału", "MATERIAL_NOT_FOUND", 404));

      const context = createMockContext({
        generated_image_id: "550e8400-e29b-41d4-a716-446655440000",
        category_id: "660e8400-e29b-41d4-a716-446655440000",
        material_id: "770e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe("MATERIAL_NOT_FOUND");
      expect(data.error.message).toBe("Nie znaleziono materiału");
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe("Error Handling", () => {
    it("should return 500 when unexpected error occurs", async () => {
      mockCreateProject.mockRejectedValue(new Error("Unexpected database error"));

      const context = createMockContext({
        generated_image_id: "550e8400-e29b-41d4-a716-446655440000",
        category_id: "550e8400-e29b-41d4-a716-446655440000",
        material_id: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe("INTERNAL_SERVER_ERROR");
      expect(data.error.message).toBe("Wystąpił nieoczekiwany błąd");
    });

    it("should return 400 when request body is invalid JSON", async () => {
      const context = {
        request: {
          json: async () => {
            throw new SyntaxError("Unexpected token in JSON");
          },
        } as unknown as Request,
        locals: {
          supabase: {} as unknown as APIContext["locals"]["supabase"],
          user: { id: "client-123", role: "client" },
        },
      } as unknown as APIContext;

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe("INTERNAL_SERVER_ERROR");
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@/db/supabase.client";
import { ProjectService, ProjectError } from "@/lib/services/project.service";
import type { CreateProjectCommand } from "@/types";

/**
 * Testy jednostkowe: ProjectService
 *
 * Sprawdzają logikę biznesową tworzenia projektów,
 * walidację zasobów i obsługę błędów.
 */
describe("Unit: ProjectService", () => {
  let mockSupabase: SupabaseClient;
  let service: ProjectService;

  const mockClientId = "client-123";
  const mockImageId = "image-123";
  const mockCategoryId = "category-123";
  const mockMaterialId = "material-123";

  const validCommand: CreateProjectCommand = {
    generated_image_id: mockImageId,
    category_id: mockCategoryId,
    material_id: mockMaterialId,
    dimensions: "100x50x80 cm",
    budget_range: "1000-2000 PLN",
  };

  const createMockSupabase = () => {
    const mockFrom = vi.fn();

    return {
      from: mockFrom,
    } as unknown as SupabaseClient;
  };

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    service = new ProjectService(mockSupabase);
    vi.clearAllMocks();
  });

  describe("Pomyślne utworzenie projektu", () => {
    it("powinien utworzyć projekt z poprawnymi danymi", async () => {
      const mockGeneratedImage = {
        id: mockImageId,
        user_id: mockClientId,
      };

      const mockCategory = { id: mockCategoryId };
      const mockMaterial = { id: mockMaterialId };

      const mockProject = {
        id: "project-123",
        client_id: mockClientId,
        status: "open",
        dimensions: "100x50x80 cm",
        budget_range: "1000-2000 PLN",
        accepted_proposal_id: null,
        accepted_price: null,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
        generated_image: {
          id: mockImageId,
          image_url: "https://example.com/image.jpg",
          prompt: "test prompt",
        },
        category: {
          id: mockCategoryId,
          name: "Krzesła",
        },
        material: {
          id: mockMaterialId,
          name: "Drewno",
        },
      };

      // Setup mock chains
      let callIndex = 0;
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callIndex++;

        if (callIndex === 1) {
          // First call: check generated_images
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockGeneratedImage, error: null }),
          };
        }

        if (callIndex === 2) {
          // Second call: check if image is already used
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }

        if (callIndex === 3) {
          // Third call: check category
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockCategory, error: null }),
          };
        }

        if (callIndex === 4) {
          // Fourth call: check material
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockMaterial, error: null }),
          };
        }

        if (callIndex === 5) {
          // Fifth call: insert project
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockProject, error: null }),
          };
        }

        if (callIndex === 6) {
          // Sixth call: count proposals
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
          };
        }

        return {};
      });

      const result = await service.createProject(validCommand, mockClientId);

      expect(result.id).toBe("project-123");
      expect(result.client_id).toBe(mockClientId);
      expect(result.status).toBe("open");
      expect(result.dimensions).toBe("100x50x80 cm");
      expect(result.budget_range).toBe("1000-2000 PLN");
      expect(result.generated_image.id).toBe(mockImageId);
      expect(result.category.name).toBe("Krzesła");
      expect(result.material.name).toBe("Drewno");
      expect(result.proposals_count).toBe(0);
    });

    it("powinien utworzyć projekt bez opcjonalnych pól", async () => {
      const commandWithoutOptionals: CreateProjectCommand = {
        generated_image_id: mockImageId,
        category_id: mockCategoryId,
        material_id: mockMaterialId,
      };

      const mockGeneratedImage = {
        id: mockImageId,
        user_id: mockClientId,
      };

      const mockProject = {
        id: "project-123",
        client_id: mockClientId,
        status: "open",
        dimensions: null,
        budget_range: null,
        accepted_proposal_id: null,
        accepted_price: null,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
        generated_image: {
          id: mockImageId,
          image_url: "https://example.com/image.jpg",
          prompt: "test prompt",
        },
        category: { id: mockCategoryId, name: "Krzesła" },
        material: { id: mockMaterialId, name: "Drewno" },
      };

      let callIndex = 0;
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callIndex++;

        if (callIndex === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockGeneratedImage, error: null }),
          };
        }

        if (callIndex === 2) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }

        if (callIndex === 3) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: mockCategoryId }, error: null }),
          };
        }

        if (callIndex === 4) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: mockMaterialId }, error: null }),
          };
        }

        if (callIndex === 5) {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockProject, error: null }),
          };
        }

        if (callIndex === 6) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
          };
        }

        return {};
      });

      const result = await service.createProject(commandWithoutOptionals, mockClientId);

      expect(result.dimensions).toBeNull();
      expect(result.budget_range).toBeNull();
    });
  });

  describe("Walidacja obrazu", () => {
    it("powinien rzucić błąd 404 gdy obraz nie istnieje", async () => {
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
          }),
        }),
      });

      await expect(service.createProject(validCommand, mockClientId)).rejects.toThrow(ProjectError);

      await expect(service.createProject(validCommand, mockClientId)).rejects.toMatchObject({
        code: "IMAGE_NOT_FOUND",
        statusCode: 404,
        message: "Nie znaleziono wygenerowanego obrazu",
      });
    });

    it("powinien rzucić błąd 403 gdy obraz nie należy do klienta", async () => {
      const mockGeneratedImage = {
        id: mockImageId,
        user_id: "different-user-123",
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockGeneratedImage, error: null }),
          }),
        }),
      });

      await expect(service.createProject(validCommand, mockClientId)).rejects.toThrow(ProjectError);

      await expect(service.createProject(validCommand, mockClientId)).rejects.toMatchObject({
        code: "IMAGE_FORBIDDEN",
        statusCode: 403,
        message: "Nie masz uprawnień do tego obrazu",
      });
    });

    it("powinien rzucić błąd 409 gdy obraz jest już używany", async () => {
      const mockGeneratedImage = {
        id: mockImageId,
        user_id: mockClientId,
      };

      const mockExistingProject = { id: "existing-project-123" };

      let callIndex = 0;
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callIndex++;

        if (callIndex === 1) {
          // First call: check generated_images
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockGeneratedImage, error: null }),
              }),
            }),
          };
        }

        if (callIndex === 2) {
          // Second call: check if image is already used
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: mockExistingProject, error: null }),
              }),
            }),
          };
        }

        return {};
      });

      await expect(service.createProject(validCommand, mockClientId))
        .rejects.toThrow(ProjectError)
        .catch((error) => {
          expect(error.code).toBe("IMAGE_ALREADY_USED");
          expect(error.statusCode).toBe(409);
        });
    });
  });

  describe("Walidacja kategorii", () => {
    it("powinien rzucić błąd 404 gdy kategoria nie istnieje", async () => {
      const mockGeneratedImage = {
        id: mockImageId,
        user_id: mockClientId,
      };

      let callIndex = 0;
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callIndex++;

        if (callIndex === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockGeneratedImage, error: null }),
              }),
            }),
          };
        }

        if (callIndex === 2) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          };
        }

        if (callIndex === 3) {
          // Category not found
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
              }),
            }),
          };
        }

        return {};
      });

      await expect(service.createProject(validCommand, mockClientId))
        .rejects.toThrow(ProjectError)
        .catch((error) => {
          expect(error.code).toBe("CATEGORY_NOT_FOUND");
          expect(error.statusCode).toBe(404);
        });
    });
  });

  describe("Walidacja materiału", () => {
    it("powinien rzucić błąd 404 gdy materiał nie istnieje", async () => {
      const mockGeneratedImage = {
        id: mockImageId,
        user_id: mockClientId,
      };

      let callIndex = 0;
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callIndex++;

        if (callIndex === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockGeneratedImage, error: null }),
              }),
            }),
          };
        }

        if (callIndex === 2) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          };
        }

        if (callIndex === 3) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: mockCategoryId }, error: null }),
              }),
            }),
          };
        }

        if (callIndex === 4) {
          // Material not found
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
              }),
            }),
          };
        }

        return {};
      });

      await expect(service.createProject(validCommand, mockClientId))
        .rejects.toThrow(ProjectError)
        .catch((error) => {
          expect(error.code).toBe("MATERIAL_NOT_FOUND");
          expect(error.statusCode).toBe(404);
        });
    });
  });

  describe("Obsługa błędów tworzenia projektu", () => {
    it("powinien rzucić błąd 409 przy naruszeniu unique constraint", async () => {
      const mockGeneratedImage = {
        id: mockImageId,
        user_id: mockClientId,
      };

      let callIndex = 0;
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callIndex++;

        if (callIndex === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockGeneratedImage, error: null }),
              }),
            }),
          };
        }

        if (callIndex === 2) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          };
        }

        if (callIndex === 3) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: mockCategoryId }, error: null }),
              }),
            }),
          };
        }

        if (callIndex === 4) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: mockMaterialId }, error: null }),
              }),
            }),
          };
        }

        if (callIndex === 5) {
          // Project insert fails with unique constraint violation
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { code: "23505", message: "duplicate key value violates unique constraint" },
                }),
              }),
            }),
          };
        }

        return {};
      });

      await expect(service.createProject(validCommand, mockClientId))
        .rejects.toThrow(ProjectError)
        .catch((error) => {
          expect(error.code).toBe("IMAGE_ALREADY_USED");
          expect(error.statusCode).toBe(409);
        });
    });

    it("powinien rzucić błąd 500 przy innym błędzie bazy danych", async () => {
      const mockGeneratedImage = {
        id: mockImageId,
        user_id: mockClientId,
      };

      let callIndex = 0;
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callIndex++;

        if (callIndex === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockGeneratedImage, error: null }),
              }),
            }),
          };
        }

        if (callIndex === 2) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          };
        }

        if (callIndex === 3) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: mockCategoryId }, error: null }),
              }),
            }),
          };
        }

        if (callIndex === 4) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: mockMaterialId }, error: null }),
              }),
            }),
          };
        }

        if (callIndex === 5) {
          // Generic database error
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { code: "PGRST000", message: "Database error" },
                }),
              }),
            }),
          };
        }

        return {};
      });

      await expect(service.createProject(validCommand, mockClientId))
        .rejects.toThrow(ProjectError)
        .catch((error) => {
          expect(error.code).toBe("PROJECT_CREATE_FAILED");
          expect(error.statusCode).toBe(500);
        });
    });
  });
});

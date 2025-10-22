/**
 * Integration tests for List My Projects API Endpoint
 *
 * GET /api/projects/me
 *
 * Tests the complete flow of listing client's projects including:
 * - Authentication and authorization
 * - Query parameter validation
 * - Database operations with real Supabase structure
 * - Pagination logic
 * - Data transformation and integrity
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { APIContext } from "astro";
import { GET } from "@/pages/api/projects/me";
import type { SupabaseClient } from "@/db/supabase.client";

// Mock helper to create APIContext
const createMockContext = (
  queryParams: Record<string, string> = {},
  user: { id: string; role: string } | null
): APIContext => {
  const url = new URL("http://localhost:3000/api/projects/me");
  Object.entries(queryParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return {
    url,
    request: {} as Request,
    params: {},
    locals: {
      user,
      supabase: createMockSupabaseClient(),
    },
  } as unknown as APIContext;
};

// Mock Supabase client with chainable query builder
const createMockSupabaseClient = () => {
  const mockFrom = vi.fn();

  return {
    from: mockFrom,
  } as unknown as SupabaseClient;
};

// Helper to create mock project data
const createMockProjectData = (clientId: string, overrides = {}) => ({
  id: "project-uuid-1",
  client_id: clientId,
  status: "open",
  dimensions: "200x100x75 cm",
  budget_range: "5000-8000 PLN",
  accepted_proposal_id: null,
  accepted_price: null,
  created_at: "2025-10-19T12:00:00Z",
  updated_at: "2025-10-19T12:00:00Z",
  generated_image: {
    id: "image-uuid-1",
    image_url: "https://storage.example.com/image1.png",
    prompt: "Modern oak table",
  },
  category: {
    id: "category-uuid-1",
    name: "Stoły",
  },
  material: {
    id: "material-uuid-1",
    name: "Dąb",
  },
  ...overrides,
});

describe("Integration: GET /api/projects/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Authentication and Authorization", () => {
    it("powinien zwrócić 401 gdy użytkownik nie jest zalogowany", async () => {
      const context = createMockContext({}, null);

      const response = await GET(context);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error.code).toBe("UNAUTHORIZED");
      expect(json.error.message).toBe("Wymagane uwierzytelnienie");
    });

    it("powinien zwrócić 401 gdy użytkownik nie ma roli", async () => {
      const mockUser = { id: "user-uuid", role: "" };
      const context = createMockContext({}, mockUser);

      const response = await GET(context);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error.code).toBe("UNAUTHORIZED");
    });

    it("powinien zwrócić 403 gdy użytkownik jest rzemieślnikiem", async () => {
      const mockUser = { id: "artisan-uuid", role: "artisan" };
      const context = createMockContext({}, mockUser);

      const response = await GET(context);
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error.code).toBe("FORBIDDEN");
      expect(json.error.message).toBe("Tylko klienci mogą przeglądać swoje projekty");
    });
  });

  describe("Query Parameter Validation", () => {
    it("powinien zwrócić 400 gdy page jest mniejsze niż 1", async () => {
      const mockUser = { id: "client-uuid", role: "client" };
      const context = createMockContext({ page: "0" }, mockUser);

      const response = await GET(context);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
      expect(json.error.message).toBe("Błędne parametry zapytania");
    });

    it("powinien zwrócić 400 gdy page jest ujemne", async () => {
      const mockUser = { id: "client-uuid", role: "client" };
      const context = createMockContext({ page: "-1" }, mockUser);

      const response = await GET(context);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("powinien zwrócić 400 gdy limit przekracza 100", async () => {
      const mockUser = { id: "client-uuid", role: "client" };
      const context = createMockContext({ limit: "101" }, mockUser);

      const response = await GET(context);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("powinien zwrócić 400 gdy limit jest 0 lub ujemny", async () => {
      const mockUser = { id: "client-uuid", role: "client" };
      const context = createMockContext({ limit: "0" }, mockUser);

      const response = await GET(context);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("powinien zwrócić 400 gdy page nie jest liczbą", async () => {
      const mockUser = { id: "client-uuid", role: "client" };
      const context = createMockContext({ page: "abc" }, mockUser);

      const response = await GET(context);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("powinien zwrócić 400 gdy limit nie jest liczbą", async () => {
      const mockUser = { id: "client-uuid", role: "client" };
      const context = createMockContext({ limit: "xyz" }, mockUser);

      const response = await GET(context);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("Successful Project Listing", () => {
    it("powinien zwrócić listę projektów klienta z domyślnymi parametrami", async () => {
      const mockUser = { id: "client-uuid", role: "client" };
      const context = createMockContext({}, mockUser);

      const mockProject = createMockProjectData(mockUser.id);

      // Mock database queries
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockRange = vi.fn().mockResolvedValue({
        data: [mockProject],
        error: null,
        count: 1,
      });

      // Mock proposals count query
      const mockProposalsSelect = vi.fn().mockReturnThis();
      const mockProposalsEq = vi.fn().mockResolvedValue({
        count: 3,
        error: null,
      });

      (context.locals.supabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          select: mockSelect,
          eq: mockEq,
          order: mockOrder,
          range: mockRange,
        })
        .mockReturnValueOnce({
          select: mockProposalsSelect,
          eq: mockProposalsEq,
        });

      const response = await GET(context);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(1);
      expect(json.data[0].id).toBe(mockProject.id);
      expect(json.data[0].client_id).toBe(mockUser.id);
      expect(json.data[0].proposals_count).toBe(3);
      expect(json.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        total_pages: 1,
      });

      // Verify correct query was made
      expect(mockEq).toHaveBeenCalledWith("client_id", mockUser.id);
      expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
      expect(mockRange).toHaveBeenCalledWith(0, 19); // First page with limit 20
    });

    it("powinien zwrócić listę z niestandardową paginacją", async () => {
      const mockUser = { id: "client-uuid", role: "client" };
      const context = createMockContext({ page: "2", limit: "10" }, mockUser);

      const mockProjects = [
        createMockProjectData(mockUser.id, { id: "project-uuid-11" }),
        createMockProjectData(mockUser.id, { id: "project-uuid-12" }),
      ];

      // Mock database queries
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockRange = vi.fn().mockResolvedValue({
        data: mockProjects,
        error: null,
        count: 25,
      });

      // Mock proposals count queries (called for each project)
      const mockProposalsSelect = vi.fn().mockReturnThis();
      const mockProposalsEq = vi.fn().mockResolvedValue({
        count: 0,
        error: null,
      });

      (context.locals.supabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          select: mockSelect,
          eq: mockEq,
          order: mockOrder,
          range: mockRange,
        })
        .mockReturnValue({
          select: mockProposalsSelect,
          eq: mockProposalsEq,
        });

      const response = await GET(context);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(2);
      expect(json.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        total_pages: 3,
      });

      // Verify correct pagination range
      expect(mockRange).toHaveBeenCalledWith(10, 19); // Second page with limit 10 (10-19)
    });

    it("powinien zwrócić pustą listę gdy klient nie ma projektów", async () => {
      const mockUser = { id: "client-uuid", role: "client" };
      const context = createMockContext({}, mockUser);

      // Mock database queries
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockRange = vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      (context.locals.supabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
        range: mockRange,
      });

      const response = await GET(context);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toEqual([]);
      expect(json.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        total_pages: 0,
      });
    });

    it("powinien zwrócić projekty z wszystkimi wymaganymi polami", async () => {
      const mockUser = { id: "client-uuid", role: "client" };
      const context = createMockContext({}, mockUser);

      const mockProject = createMockProjectData(mockUser.id, {
        status: "in_progress",
        accepted_proposal_id: "proposal-uuid",
        accepted_price: 4500,
      });

      // Mock database queries
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockRange = vi.fn().mockResolvedValue({
        data: [mockProject],
        error: null,
        count: 1,
      });

      // Mock proposals count query
      const mockProposalsSelect = vi.fn().mockReturnThis();
      const mockProposalsEq = vi.fn().mockResolvedValue({
        count: 5,
        error: null,
      });

      (context.locals.supabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          select: mockSelect,
          eq: mockEq,
          order: mockOrder,
          range: mockRange,
        })
        .mockReturnValueOnce({
          select: mockProposalsSelect,
          eq: mockProposalsEq,
        });

      const response = await GET(context);
      const json = await response.json();

      expect(response.status).toBe(200);
      const project = json.data[0];

      // Verify all required fields
      expect(project).toHaveProperty("id");
      expect(project).toHaveProperty("client_id");
      expect(project).toHaveProperty("status");
      expect(project).toHaveProperty("dimensions");
      expect(project).toHaveProperty("budget_range");
      expect(project).toHaveProperty("accepted_proposal_id");
      expect(project).toHaveProperty("accepted_price");
      expect(project).toHaveProperty("proposals_count");
      expect(project).toHaveProperty("created_at");
      expect(project).toHaveProperty("updated_at");

      // Verify nested objects
      expect(project.generated_image).toHaveProperty("id");
      expect(project.generated_image).toHaveProperty("image_url");
      expect(project.generated_image).toHaveProperty("prompt");

      expect(project.category).toHaveProperty("id");
      expect(project.category).toHaveProperty("name");

      expect(project.material).toHaveProperty("id");
      expect(project.material).toHaveProperty("name");
    });

    it("powinien zwrócić projekty posortowane od najnowszych", async () => {
      const mockUser = { id: "client-uuid", role: "client" };
      const context = createMockContext({}, mockUser);

      const mockProjects = [
        createMockProjectData(mockUser.id, {
          id: "project-uuid-2",
          created_at: "2025-10-21T12:00:00Z",
        }),
        createMockProjectData(mockUser.id, {
          id: "project-uuid-1",
          created_at: "2025-10-19T12:00:00Z",
        }),
      ];

      // Mock database queries
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockRange = vi.fn().mockResolvedValue({
        data: mockProjects,
        error: null,
        count: 2,
      });

      // Mock proposals count queries
      const mockProposalsSelect = vi.fn().mockReturnThis();
      const mockProposalsEq = vi.fn().mockResolvedValue({
        count: 0,
        error: null,
      });

      (context.locals.supabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          select: mockSelect,
          eq: mockEq,
          order: mockOrder,
          range: mockRange,
        })
        .mockReturnValue({
          select: mockProposalsSelect,
          eq: mockProposalsEq,
        });

      const response = await GET(context);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data[0].id).toBe("project-uuid-2"); // Newer project first
      expect(json.data[1].id).toBe("project-uuid-1");
      expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
    });
  });

  describe("Error Handling", () => {
    it("powinien zwrócić 500 gdy wystąpi błąd bazy danych", async () => {
      const mockUser = { id: "client-uuid", role: "client" };
      const context = createMockContext({}, mockUser);

      // Mock database error
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockRange = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database connection error" },
        count: null,
      });

      (context.locals.supabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
        range: mockRange,
      });

      const response = await GET(context);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error.code).toBe("PROJECT_LIST_FAILED");
      expect(json.error.message).toBe("Nie udało się pobrać listy projektów");
    });

    it("powinien obsłużyć nieoczekiwane błędy", async () => {
      const mockUser = { id: "client-uuid", role: "client" };
      const context = createMockContext({}, mockUser);

      // Mock unexpected error
      (context.locals.supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const response = await GET(context);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error.code).toBe("INTERNAL_SERVER_ERROR");
      expect(json.error.message).toBe("Wystąpił nieoczekiwany błąd");
    });
  });

  describe("Data Integrity", () => {
    it("powinien zwrócić tylko projekty należące do zalogowanego klienta", async () => {
      const mockUser = { id: "client-uuid-1", role: "client" };
      const context = createMockContext({}, mockUser);

      // Create projects for different clients
      const myProject = createMockProjectData("client-uuid-1", { id: "my-project" });

      // Mock database queries - should filter by client_id
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockRange = vi.fn().mockResolvedValue({
        data: [myProject],
        error: null,
        count: 1,
      });

      // Mock proposals count query
      const mockProposalsSelect = vi.fn().mockReturnThis();
      const mockProposalsEq = vi.fn().mockResolvedValue({
        count: 0,
        error: null,
      });

      (context.locals.supabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          select: mockSelect,
          eq: mockEq,
          order: mockOrder,
          range: mockRange,
        })
        .mockReturnValueOnce({
          select: mockProposalsSelect,
          eq: mockProposalsEq,
        });

      const response = await GET(context);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(1);
      expect(json.data[0].client_id).toBe("client-uuid-1");

      // Verify that query filters by client_id
      expect(mockEq).toHaveBeenCalledWith("client_id", "client-uuid-1");
    });

    it("powinien poprawnie liczyć propozycje dla każdego projektu", async () => {
      const mockUser = { id: "client-uuid", role: "client" };
      const context = createMockContext({}, mockUser);

      const mockProjects = [
        createMockProjectData(mockUser.id, { id: "project-1" }),
        createMockProjectData(mockUser.id, { id: "project-2" }),
      ];

      // Mock database queries
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockRange = vi.fn().mockResolvedValue({
        data: mockProjects,
        error: null,
        count: 2,
      });

      // Mock proposals count queries - different counts for each project
      const mockProposalsSelect = vi.fn().mockReturnThis();
      const mockProposalsEq = vi
        .fn()
        .mockResolvedValueOnce({
          count: 3,
          error: null,
        })
        .mockResolvedValueOnce({
          count: 5,
          error: null,
        });

      (context.locals.supabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          select: mockSelect,
          eq: mockEq,
          order: mockOrder,
          range: mockRange,
        })
        .mockReturnValue({
          select: mockProposalsSelect,
          eq: mockProposalsEq,
        });

      const response = await GET(context);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data[0].proposals_count).toBe(3);
      expect(json.data[1].proposals_count).toBe(5);
    });
  });
});

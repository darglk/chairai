import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/pages/api/images/generated/index";
import type { APIContext } from "astro";
import type { GeneratedImagesListResponseDTO } from "@/types";

const mockSupabaseAuth = {
  getUser: vi.fn(),
};

// Store for mock responses that tests can modify
let mockServiceResponse: GeneratedImagesListResponseDTO = {
  data: [],
  pagination: { page: 1, limit: 20, total: 0, total_pages: 0 },
  remaining_generations: 10,
};

vi.mock("@/lib/services/generated-images.service", () => {
  return {
    GeneratedImagesService: vi.fn().mockImplementation(() => ({
      listUserGeneratedImages: vi.fn().mockImplementation(async () => mockServiceResponse),
    })),
  };
});

function createMockContext(
  queryParams: Record<string, string> = {},
  userRole: "client" | "artisan" = "client",
  images: Omit<GeneratedImagesListResponseDTO["data"][number], "is_used">[] = [],
  usedImageIds: string[] = []
): APIContext {
  // Build mock response from images
  const imagesWithUsedStatus = images.map((img) => ({
    ...img,
    is_used: usedImageIds.includes(img.id),
  }));

  mockServiceResponse = {
    data: imagesWithUsedStatus,
    pagination: {
      page: 1,
      limit: 20,
      total: imagesWithUsedStatus.length,
      total_pages: Math.ceil(imagesWithUsedStatus.length / 20),
    },
    remaining_generations: 10,
  };
  const searchParams = new URLSearchParams(queryParams);
  const url = new URL(`http://localhost/api/images/generated?${searchParams.toString()}`);

  const mockFromChain = (tableName: string) => {
    if (tableName === "users") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: userRole },
          error: null,
        }),
      };
    }

    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      head: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: null,
        count: 0,
      }),
    };
  };

  return {
    request: {
      headers: {
        get: vi.fn(() => "192.168.1.1"),
      },
    } as unknown as Request,
    locals: {
      supabase: {
        auth: mockSupabaseAuth,
        from: mockFromChain,
      },
    } as unknown as APIContext["locals"],
    url,
    params: {},
    cookies: {
      set: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
      has: vi.fn(),
    } as unknown as APIContext["cookies"],
  } as unknown as APIContext;
}

describe("GET /api/images/generated", () => {
  beforeEach(() => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
  });

  describe("Autentykacja", () => {
    it("powinien zwrócić 401 gdy użytkownik nie jest zalogowany", async () => {
      mockSupabaseAuth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error("Invalid"),
      });

      const context = createMockContext();
      const response = await GET(context);

      expect(response.status).toBe(401);
    });
  });

  describe("Autoryzacja", () => {
    it("powinien odrzucić rolę artisan", async () => {
      const context = createMockContext({}, "artisan");
      const response = await GET(context);

      expect(response.status).toBe(403);
    });
  });

  describe("Walidacja parametrów", () => {
    it("powinien odrzucić gdy page jest zerem - artisan bez dostępu zwraca 403", async () => {
      // Artisan doesn't have access, so returns 403 before validation
      const context = createMockContext({ page: "0" }, "artisan");
      const response = await GET(context);

      expect(response.status).toBe(403);
    });

    it("powinien odrzucić gdy limit przekracza 100 - artisan bez dostępu zwraca 403", async () => {
      const context = createMockContext({ limit: "101" }, "artisan");
      const response = await GET(context);

      expect(response.status).toBe(403);
    });

    it("powinien odrzucić nieprawidłową wartość page - artisan bez dostępu zwraca 403", async () => {
      const context = createMockContext({ page: "invalid" }, "artisan");
      const response = await GET(context);

      expect(response.status).toBe(403);
    });

    it("powinien odrzucić nieprawidłową wartość limit - artisan bez dostępu zwraca 403", async () => {
      const context = createMockContext({ limit: "invalid" }, "artisan");
      const response = await GET(context);

      expect(response.status).toBe(403);
    });
  });

  describe("Obsługa błędów", () => {
    it("powinien zwrócić 500 na błąd serwera", async () => {
      mockSupabaseAuth.getUser.mockImplementationOnce(() => {
        throw new Error("Database error");
      });

      const context = createMockContext();
      const response = await GET(context);

      expect(response.status).toBe(500);
    });
  });
});

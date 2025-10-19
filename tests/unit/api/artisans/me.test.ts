import { describe, it, expect, vi, beforeEach } from "vitest";
import { PUT } from "@/pages/api/artisans/me";
import type { APIContext } from "astro";

const mockSupabaseAuth = {
  getUser: vi.fn(),
};

/**
 * Testy jednostkowe: PUT /api/artisans/me
 *
 * Sprawdzają endpoint tworzenia/aktualizacji profilu rzemieślnika,
 * autoryzację, walidację i obsługę błędów.
 */
describe("Unit: PUT /api/artisans/me", () => {
  function createMockContext(body: unknown, userRole = "artisan", userId = "artisan-123"): APIContext {
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

      if (tableName === "artisan_profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: null, // No existing profile with this NIP
            error: null,
          }),
          upsert: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              user_id: userId,
              company_name: (body as { company_name?: string })?.company_name || "Master Woodworks",
              nip: (body as { nip?: string })?.nip || "1234567890",
              is_public: false,
              updated_at: new Date().toISOString(),
            },
            error: null,
          }),
        };
      }

      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
    };

    return {
      request: {
        json: vi.fn().mockResolvedValue(body),
        headers: new Headers(),
      },
      locals: {
        supabase: {
          auth: {
            getUser: mockSupabaseAuth.getUser.mockResolvedValue({
              data: { user: { id: userId } },
              error: null,
            }),
          },
          from: vi.fn().mockImplementation(mockFromChain),
        },
      },
    } as unknown as APIContext;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Pomyślne utworzenie/aktualizacja profilu", () => {
    it("powinien zwrócić 200 i dane profilu dla poprawnego żądania", async () => {
      const validBody = {
        company_name: "Master Woodworks",
        nip: "1234567890",
      };

      const context = createMockContext(validBody);
      const response = await PUT(context);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.user_id).toBe("artisan-123");
      expect(data.company_name).toBe("Master Woodworks");
      expect(data.nip).toBe("1234567890");
      expect(data.is_public).toBe(false);
      expect(data.specializations).toEqual([]);
      expect(data.portfolio_images).toEqual([]);
    });

    it("powinien aktualizować istniejący profil", async () => {
      const updateBody = {
        company_name: "Updated Woodworks",
        nip: "1234567890",
      };

      const context = createMockContext(updateBody);
      const response = await PUT(context);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.company_name).toBe("Updated Woodworks");
    });
  });

  describe("Błędy autoryzacji", () => {
    it("powinien zwrócić 401 gdy użytkownik nie jest zalogowany", async () => {
      const context = createMockContext({ company_name: "Test", nip: "1234567890" });
      (context.locals.supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null },
        error: { message: "Unauthorized" },
      });

      const response = await PUT(context);

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error.code).toBe("UNAUTHORIZED");
    });

    it("powinien zwrócić 403 gdy użytkownik nie jest rzemieślnikiem", async () => {
      const context = createMockContext({ company_name: "Test", nip: "1234567890" }, "client");

      const response = await PUT(context);

      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error.code).toBe("FORBIDDEN");
      expect(data.error.message).toContain("rzemieślnicy");
    });

    it("powinien zwrócić 404 gdy nie znaleziono użytkownika", async () => {
      const context = createMockContext({ company_name: "Test", nip: "1234567890" });
      const mockFrom = context.locals.supabase.from as ReturnType<typeof vi.fn>;

      mockFrom.mockImplementation((tableName: string) => {
        if (tableName === "users") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "User not found" },
            }),
          };
        }
        return {};
      });

      const response = await PUT(context);

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error.code).toBe("USER_NOT_FOUND");
    });
  });

  describe("Błędy walidacji", () => {
    it("powinien zwrócić 422 gdy brak company_name", async () => {
      const invalidBody = {
        nip: "1234567890",
      };

      const context = createMockContext(invalidBody);
      const response = await PUT(context);

      expect(response.status).toBe(422);

      const data = await response.json();
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.details).toBeDefined();
    });

    it("powinien zwrócić 422 gdy company_name jest pusty", async () => {
      const invalidBody = {
        company_name: "",
        nip: "1234567890",
      };

      const context = createMockContext(invalidBody);
      const response = await PUT(context);

      expect(response.status).toBe(422);

      const data = await response.json();
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.details?.company_name).toContain("pusta");
    });

    it("powinien zwrócić 422 gdy brak NIP", async () => {
      const invalidBody = {
        company_name: "Master Woodworks",
      };

      const context = createMockContext(invalidBody);
      const response = await PUT(context);

      expect(response.status).toBe(422);

      const data = await response.json();
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("powinien zwrócić 422 gdy NIP ma nieprawidłowy format (za krótki)", async () => {
      const invalidBody = {
        company_name: "Master Woodworks",
        nip: "123",
      };

      const context = createMockContext(invalidBody);
      const response = await PUT(context);

      expect(response.status).toBe(422);

      const data = await response.json();
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.details?.nip).toContain("10 cyfr");
    });

    it("powinien zwrócić 422 gdy NIP zawiera litery", async () => {
      const invalidBody = {
        company_name: "Master Woodworks",
        nip: "12345abcde",
      };

      const context = createMockContext(invalidBody);
      const response = await PUT(context);

      expect(response.status).toBe(422);

      const data = await response.json();
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.details?.nip).toContain("10 cyfr");
    });

    it("powinien zwrócić 422 gdy NIP ma za dużo znaków", async () => {
      const invalidBody = {
        company_name: "Master Woodworks",
        nip: "12345678901",
      };

      const context = createMockContext(invalidBody);
      const response = await PUT(context);

      expect(response.status).toBe(422);

      const data = await response.json();
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("Konflikt NIP", () => {
    it("powinien zwrócić 409 gdy NIP jest już używany przez innego rzemieślnika", async () => {
      const validBody = {
        company_name: "Master Woodworks",
        nip: "1234567890",
      };

      const context = createMockContext(validBody);
      const mockFrom = context.locals.supabase.from as ReturnType<typeof vi.fn>;

      mockFrom.mockImplementation((tableName: string) => {
        if (tableName === "users") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { role: "artisan" },
              error: null,
            }),
          };
        }

        if (tableName === "artisan_profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { user_id: "other-artisan-456" }, // Different user has this NIP
              error: null,
            }),
          };
        }

        return {};
      });

      const response = await PUT(context);

      expect(response.status).toBe(409);

      const data = await response.json();
      expect(data.error.code).toBe("NIP_CONFLICT");
      expect(data.error.message).toContain("już używany");
    });
  });

  describe("Błędy bazy danych", () => {
    it("powinien zwrócić 500 gdy wystąpi błąd bazy danych", async () => {
      const validBody = {
        company_name: "Master Woodworks",
        nip: "1234567890",
      };

      const context = createMockContext(validBody);
      const mockFrom = context.locals.supabase.from as ReturnType<typeof vi.fn>;

      mockFrom.mockImplementation((tableName: string) => {
        if (tableName === "users") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { role: "artisan" },
              error: null,
            }),
          };
        }

        if (tableName === "artisan_profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Database error" },
            }),
          };
        }

        return {};
      });

      const response = await PUT(context);

      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error.code).toBe("NIP_CHECK_ERROR");
    });
  });
});

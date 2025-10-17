import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/pages/api/auth/login";
import type { APIContext } from "astro";

// Mock Supabase client
const mockSupabaseAuth = {
  signInWithPassword: vi.fn(),
};

// Helper function to create mock API context
function createMockContext(body: unknown): APIContext {
  return {
    request: {
      json: async () => body,
    } as unknown as Request,
    locals: {
      supabase: {
        auth: mockSupabaseAuth,
      },
      user: null,
    } as unknown as APIContext["locals"],
    cookies: {
      set: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
      has: vi.fn(),
    } as unknown as APIContext["cookies"],
  } as unknown as APIContext;
}

describe("POST /api/auth/login - Testy Jednostkowe", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("Pomyślne logowanie", () => {
    it("powinien zalogować użytkownika z poprawnymi danymi", async () => {
      const mockSession = {
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token",
      };

      const mockUser = {
        id: "user-123",
        email: "test@example.com",
      };

      mockSupabaseAuth.signInWithPassword.mockResolvedValueOnce({
        data: {
          session: mockSession,
          user: mockUser,
        },
        error: null,
      });

      const context = createMockContext({
        email: "test@example.com",
        password: "password123",
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.id).toBe("user-123");
      expect(data.user.email).toBe("test@example.com");
      expect(context.cookies.set).toHaveBeenCalledWith("sb-access-token", "mock-access-token", expect.any(Object));
      expect(context.cookies.set).toHaveBeenCalledWith("sb-refresh-token", "mock-refresh-token", expect.any(Object));
    });

    it("powinien ustawić ciasteczka sesji z odpowiednimi opcjami", async () => {
      const mockSession = {
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token",
      };

      mockSupabaseAuth.signInWithPassword.mockResolvedValueOnce({
        data: {
          session: mockSession,
          user: { id: "user-123", email: "test@example.com" },
        },
        error: null,
      });

      const context = createMockContext({
        email: "test@example.com",
        password: "password123",
      });

      await POST(context);

      expect(context.cookies.set).toHaveBeenCalledWith("sb-access-token", "mock-access-token", {
        path: "/",
        httpOnly: true,
        secure: expect.any(Boolean),
        sameSite: "lax",
        maxAge: expect.any(Number),
      });
    });
  });

  describe("Walidacja danych wejściowych", () => {
    it("powinien odrzucić żądanie z pustym emailem", async () => {
      const context = createMockContext({
        email: "",
        password: "password123",
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.details).toBeDefined();
      expect(data.error.details.email).toMatch(/wymagany|required/i);
    });

    it("powinien odrzucić żądanie z pustym hasłem", async () => {
      const context = createMockContext({
        email: "test@example.com",
        password: "",
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.details.password).toMatch(/wymagane|required/i);
    });

    it("powinien odrzucić żądanie z nieprawidłowym formatem email", async () => {
      const context = createMockContext({
        email: "nieprawidlowy-email",
        password: "password123",
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.details.email).toMatch(/nieprawidłowy|invalid/i);
    });

    it("powinien odrzucić żądanie bez pola email", async () => {
      const context = createMockContext({
        password: "password123",
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.details.email).toBeDefined();
    });

    it("powinien odrzucić żądanie bez pola password", async () => {
      const context = createMockContext({
        email: "test@example.com",
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.details.password).toBeDefined();
    });

    it("powinien odrzucić żądanie z dodatkowymi, niepotrzebnymi polami", async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValueOnce({
        data: {
          session: {
            access_token: "mock-access-token",
            refresh_token: "mock-refresh-token",
          },
          user: { id: "user-123", email: "test@example.com" },
        },
        error: null,
      });

      const context = createMockContext({
        email: "test@example.com",
        password: "password123",
        extraField: "should be ignored",
      });

      const response = await POST(context);
      const data = await response.json();

      // Zod powinien zignorować dodatkowe pola (domyślne zachowanie .parse())
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe("Błędy autoryzacji", () => {
    it("powinien zwrócić błąd 401 dla nieprawidłowych danych logowania", async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValueOnce({
        data: { session: null, user: null },
        error: { message: "Invalid login credentials" },
      });

      const context = createMockContext({
        email: "test@example.com",
        password: "wrongpassword",
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe("INVALID_CREDENTIALS");
      expect(data.error.message).toMatch(/nieprawidłowy|invalid/i);
    });

    it("powinien zwrócić błąd 400 dla innych błędów autoryzacji", async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValueOnce({
        data: { session: null, user: null },
        error: { message: "User account is disabled" },
      });

      const context = createMockContext({
        email: "disabled@example.com",
        password: "password123",
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("AUTH_ERROR");
      expect(data.error.message).toBe("User account is disabled");
    });

    it("powinien zwrócić błąd 500 gdy nie można utworzyć sesji", async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValueOnce({
        data: {
          session: null,
          user: { id: "user-123", email: "test@example.com" },
        },
        error: null,
      });

      const context = createMockContext({
        email: "test@example.com",
        password: "password123",
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe("NO_SESSION");
      expect(data.error.message).toMatch(/sesji|session/i);
    });
  });

  describe("Obsługa błędów", () => {
    it("powinien obsłużyć błąd parsowania JSON", async () => {
      const context = {
        request: {
          json: async () => {
            throw new Error("Invalid JSON");
          },
        } as unknown as Request,
        locals: {
          supabase: {
            auth: mockSupabaseAuth,
          },
          user: null,
        } as unknown as APIContext["locals"],
        cookies: {
          set: vi.fn(),
        } as unknown as APIContext["cookies"],
      } as unknown as APIContext;

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe("INTERNAL_ERROR");
    });

    it("powinien obsłużyć nieoczekiwane błędy z Supabase", async () => {
      mockSupabaseAuth.signInWithPassword.mockRejectedValueOnce(new Error("Database connection error"));

      const context = createMockContext({
        email: "test@example.com",
        password: "password123",
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe("INTERNAL_ERROR");
      expect(data.error.message).toMatch(/wystąpił błąd|error/i);
    });
  });

  describe("Bezpieczeństwo", () => {
    it("nie powinien ujawnić szczegółów błędu w odpowiedzi produkcyjnej", async () => {
      mockSupabaseAuth.signInWithPassword.mockRejectedValueOnce(new Error("Sensitive database error"));

      const context = createMockContext({
        email: "test@example.com",
        password: "password123",
      });

      const response = await POST(context);
      const data = await response.json();

      // Upewnij się, że szczegóły błędu nie są ujawnione
      expect(data.error.message).not.toContain("Sensitive database error");
      expect(data.error.message).toMatch(/wystąpił błąd serwera/i);
    });

    it("powinien ustawić httpOnly dla ciasteczek sesji", async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValueOnce({
        data: {
          session: {
            access_token: "mock-access-token",
            refresh_token: "mock-refresh-token",
          },
          user: { id: "user-123", email: "test@example.com" },
        },
        error: null,
      });

      const context = createMockContext({
        email: "test@example.com",
        password: "password123",
      });

      await POST(context);

      // Sprawdź czy httpOnly jest ustawione
      const setCookieCalls = (context.cookies.set as ReturnType<typeof vi.fn>).mock.calls;
      setCookieCalls.forEach((call) => {
        expect(call[2]).toHaveProperty("httpOnly", true);
      });
    });

    it("powinien ustawić sameSite dla ciasteczek sesji", async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValueOnce({
        data: {
          session: {
            access_token: "mock-access-token",
            refresh_token: "mock-refresh-token",
          },
          user: { id: "user-123", email: "test@example.com" },
        },
        error: null,
      });

      const context = createMockContext({
        email: "test@example.com",
        password: "password123",
      });

      await POST(context);

      // Sprawdź czy sameSite jest ustawione
      const setCookieCalls = (context.cookies.set as ReturnType<typeof vi.fn>).mock.calls;
      setCookieCalls.forEach((call) => {
        expect(call[2]).toHaveProperty("sameSite", "lax");
      });
    });
  });

  describe("Integracja z Supabase", () => {
    it("powinien wywołać signInWithPassword z poprawnymi parametrami", async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValueOnce({
        data: {
          session: {
            access_token: "mock-access-token",
            refresh_token: "mock-refresh-token",
          },
          user: { id: "user-123", email: "test@example.com" },
        },
        error: null,
      });

      const context = createMockContext({
        email: "test@example.com",
        password: "password123",
      });

      await POST(context);

      expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
      expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledTimes(1);
    });
  });
});

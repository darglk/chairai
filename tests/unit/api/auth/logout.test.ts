import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/pages/api/auth/logout";
import type { APIContext } from "astro";

// Mock Supabase client
const mockSupabaseAuth = {
  signOut: vi.fn(),
};

// Helper function to create mock API context
function createMockContext(): APIContext {
  return {
    request: new Request("http://localhost:4321/api/auth/logout", {
      method: "POST",
    }),
    locals: {
      supabase: {
        auth: mockSupabaseAuth,
      },
      user: {
        id: "user-123",
        email: "test@example.com",
      },
    } as unknown as APIContext["locals"],
    cookies: {
      set: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
      has: vi.fn(),
    } as unknown as APIContext["cookies"],
    redirect: vi.fn((url: string, status: number) => {
      return new Response(null, {
        status,
        headers: { Location: url },
      });
    }),
  } as unknown as APIContext;
}

describe("POST /api/auth/logout - Testy Jednostkowe", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("Pomyślne wylogowanie", () => {
    it("powinien wylogować użytkownika i przekierować na stronę główną", async () => {
      mockSupabaseAuth.signOut.mockResolvedValueOnce({
        error: null,
      });

      const context = createMockContext();
      const response = await POST(context);

      // Sprawdź, czy signOut został wywołany
      expect(mockSupabaseAuth.signOut).toHaveBeenCalledTimes(1);

      // Sprawdź, czy ciasteczka zostały usunięte
      expect(context.cookies.delete).toHaveBeenCalledWith("sb-access-token", { path: "/" });
      expect(context.cookies.delete).toHaveBeenCalledWith("sb-refresh-token", { path: "/" });

      // Sprawdź przekierowanie
      expect(response.status).toBe(302);
      expect(response.headers.get("Location")).toBe("/");
    });

    it("powinien usunąć oba ciasteczka sesji", async () => {
      mockSupabaseAuth.signOut.mockResolvedValueOnce({
        error: null,
      });

      const context = createMockContext();
      await POST(context);

      // Sprawdź, czy oba ciasteczka zostały usunięte
      expect(context.cookies.delete).toHaveBeenCalledWith("sb-access-token", { path: "/" });
      expect(context.cookies.delete).toHaveBeenCalledWith("sb-refresh-token", { path: "/" });
      expect(context.cookies.delete).toHaveBeenCalledTimes(2);
    });

    it("powinien przekierować na stronę główną po wylogowaniu", async () => {
      mockSupabaseAuth.signOut.mockResolvedValueOnce({
        error: null,
      });

      const context = createMockContext();
      const response = await POST(context);

      expect(response.status).toBe(302);
      expect(response.headers.get("Location")).toBe("/");
    });
  });

  describe("Obsługa błędów", () => {
    it("powinien usunąć ciasteczka i przekierować nawet gdy signOut rzuci błąd", async () => {
      mockSupabaseAuth.signOut.mockRejectedValueOnce(new Error("Supabase error"));

      const context = createMockContext();
      const response = await POST(context);

      // Mimo błędu, ciasteczka powinny zostać usunięte
      expect(context.cookies.delete).toHaveBeenCalledWith("sb-access-token", { path: "/" });
      expect(context.cookies.delete).toHaveBeenCalledWith("sb-refresh-token", { path: "/" });

      // I użytkownik powinien zostać przekierowany
      expect(response.status).toBe(302);
      expect(response.headers.get("Location")).toBe("/");
    });

    it("powinien obsłużyć błąd od Supabase i kontynuować wylogowanie", async () => {
      mockSupabaseAuth.signOut.mockResolvedValueOnce({
        error: {
          message: "Invalid session",
          status: 401,
        },
      });

      const context = createMockContext();
      const response = await POST(context);

      // Mimo błędu od Supabase, wylogowanie powinno się udać
      expect(context.cookies.delete).toHaveBeenCalledTimes(2);
      expect(response.status).toBe(302);
      expect(response.headers.get("Location")).toBe("/");
    });

    it("powinien usunąć ciasteczka nawet gdy użytkownik nie jest zalogowany", async () => {
      mockSupabaseAuth.signOut.mockResolvedValueOnce({
        error: null,
      });

      const context = createMockContext();
      // Symuluj brak zalogowanego użytkownika
      context.locals.user = null;

      const response = await POST(context);

      // Ciasteczka powinny zostać usunięte
      expect(context.cookies.delete).toHaveBeenCalledTimes(2);
      expect(response.status).toBe(302);
    });
  });

  describe("Bezpieczeństwo", () => {
    it("powinien zawsze usuwać ciasteczka niezależnie od wyniku operacji", async () => {
      mockSupabaseAuth.signOut.mockRejectedValueOnce(new Error("Network error"));

      const context = createMockContext();
      await POST(context);

      // Nawet przy błędzie sieciowym, ciasteczka muszą zostać usunięte
      expect(context.cookies.delete).toHaveBeenCalledWith("sb-access-token", { path: "/" });
      expect(context.cookies.delete).toHaveBeenCalledWith("sb-refresh-token", { path: "/" });
    });

    it("powinien używać prawidłowej ścieżki przy usuwaniu ciasteczek", async () => {
      mockSupabaseAuth.signOut.mockResolvedValueOnce({
        error: null,
      });

      const context = createMockContext();
      await POST(context);

      // Sprawdź, czy ścieżka jest ustawiona na "/"
      expect(context.cookies.delete).toHaveBeenCalledWith("sb-access-token", { path: "/" });
      expect(context.cookies.delete).toHaveBeenCalledWith("sb-refresh-token", { path: "/" });
    });
  });

  describe("Wielokrotne wylogowanie", () => {
    it("powinien obsłużyć wielokrotne wywołanie wylogowania bez błędów", async () => {
      mockSupabaseAuth.signOut.mockResolvedValue({
        error: null,
      });

      const context = createMockContext();

      // Pierwsze wylogowanie
      const response1 = await POST(context);
      expect(response1.status).toBe(302);

      // Resetuj mocki
      vi.clearAllMocks();

      // Drugie wylogowanie (użytkownik już wylogowany)
      const response2 = await POST(context);
      expect(response2.status).toBe(302);

      // Nie powinno być żadnych błędów
      expect(context.cookies.delete).toHaveBeenCalledTimes(2);
    });
  });
});

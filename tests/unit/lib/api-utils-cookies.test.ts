import { describe, it, expect, vi, beforeEach } from "vitest";
import { clearSessionCookies, setSessionCookies } from "@/lib/api-utils";
import type { APIContext } from "astro";

// Helper function to create mock API context
function createMockContext(): APIContext {
  return {
    cookies: {
      set: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
      has: vi.fn(),
    } as unknown as APIContext["cookies"],
  } as unknown as APIContext;
}

describe("clearSessionCookies - Testy Jednostkowe", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("Usuwanie ciasteczek sesji", () => {
    it("powinien usunąć ciasteczko sb-access-token", () => {
      const context = createMockContext();

      clearSessionCookies(context);

      expect(context.cookies.delete).toHaveBeenCalledWith("sb-access-token", { path: "/" });
    });

    it("powinien usunąć ciasteczko sb-refresh-token", () => {
      const context = createMockContext();

      clearSessionCookies(context);

      expect(context.cookies.delete).toHaveBeenCalledWith("sb-refresh-token", { path: "/" });
    });

    it("powinien usunąć oba ciasteczka jednocześnie", () => {
      const context = createMockContext();

      clearSessionCookies(context);

      expect(context.cookies.delete).toHaveBeenCalledTimes(2);
      expect(context.cookies.delete).toHaveBeenCalledWith("sb-access-token", { path: "/" });
      expect(context.cookies.delete).toHaveBeenCalledWith("sb-refresh-token", { path: "/" });
    });

    it("powinien używać prawidłowej ścieżki '/' przy usuwaniu ciasteczek", () => {
      const context = createMockContext();

      clearSessionCookies(context);

      expect(context.cookies.delete).toHaveBeenCalledWith("sb-access-token", { path: "/" });
      expect(context.cookies.delete).toHaveBeenCalledWith("sb-refresh-token", { path: "/" });
    });
  });

  describe("Wielokrotne wywołanie", () => {
    it("powinien działać poprawnie przy wielokrotnym wywołaniu", () => {
      const context = createMockContext();

      clearSessionCookies(context);
      clearSessionCookies(context);

      expect(context.cookies.delete).toHaveBeenCalledTimes(4);
    });
  });

  describe("Idempotentność", () => {
    it("nie powinien rzucać błędu gdy ciasteczka nie istnieją", () => {
      const context = createMockContext();

      expect(() => {
        clearSessionCookies(context);
      }).not.toThrow();
    });

    it("powinien działać niezależnie od tego czy ciasteczka istnieją", () => {
      const context = createMockContext();

      // Symuluj, że ciasteczka nie istnieją
      vi.mocked(context.cookies.has).mockReturnValue(false);

      clearSessionCookies(context);

      // Mimo że ciasteczka nie istnieją, funkcja powinna wywołać delete
      expect(context.cookies.delete).toHaveBeenCalledTimes(2);
    });
  });
});

describe("setSessionCookies - Testy Jednostkowe", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("Ustawianie ciasteczek sesji", () => {
    it("powinien ustawić ciasteczko sb-access-token z odpowiednimi opcjami", () => {
      const context = createMockContext();
      const accessToken = "test-access-token";
      const refreshToken = "test-refresh-token";

      setSessionCookies(context, accessToken, refreshToken);

      expect(context.cookies.set).toHaveBeenCalledWith("sb-access-token", accessToken, {
        path: "/",
        httpOnly: true,
        secure: expect.any(Boolean),
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    });

    it("powinien ustawić ciasteczko sb-refresh-token z odpowiednimi opcjami", () => {
      const context = createMockContext();
      const accessToken = "test-access-token";
      const refreshToken = "test-refresh-token";

      setSessionCookies(context, accessToken, refreshToken);

      expect(context.cookies.set).toHaveBeenCalledWith("sb-refresh-token", refreshToken, {
        path: "/",
        httpOnly: true,
        secure: expect.any(Boolean),
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    });

    it("powinien ustawić oba ciasteczka jednocześnie", () => {
      const context = createMockContext();
      const accessToken = "test-access-token";
      const refreshToken = "test-refresh-token";

      setSessionCookies(context, accessToken, refreshToken);

      expect(context.cookies.set).toHaveBeenCalledTimes(2);
    });
  });
});

describe("Integracja setSessionCookies i clearSessionCookies", () => {
  it("clearSessionCookies powinien usunąć ciasteczka ustawione przez setSessionCookies", () => {
    const context = createMockContext();
    const accessToken = "test-access-token";
    const refreshToken = "test-refresh-token";

    // Najpierw ustaw ciasteczka
    setSessionCookies(context, accessToken, refreshToken);

    expect(context.cookies.set).toHaveBeenCalledTimes(2);

    // Następnie usuń ciasteczka
    clearSessionCookies(context);

    expect(context.cookies.delete).toHaveBeenCalledWith("sb-access-token", { path: "/" });
    expect(context.cookies.delete).toHaveBeenCalledWith("sb-refresh-token", { path: "/" });
    expect(context.cookies.delete).toHaveBeenCalledTimes(2);
  });

  it("powinien używać tej samej ścieżki przy ustawianiu i usuwaniu ciasteczek", () => {
    const context = createMockContext();
    const accessToken = "test-access-token";
    const refreshToken = "test-refresh-token";

    setSessionCookies(context, accessToken, refreshToken);

    const setCallsPath = vi.mocked(context.cookies.set).mock.calls.map((call) => call[2]?.path);
    expect(setCallsPath).toEqual(["/", "/"]);

    clearSessionCookies(context);

    const deleteCallsPath = vi.mocked(context.cookies.delete).mock.calls.map((call) => call[1]?.path);
    expect(deleteCallsPath).toEqual(["/", "/"]);
  });
});

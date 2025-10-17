import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LogoutButton } from "@/components/auth/LogoutButton";

// Mock window.location
const mockLocation = {
  href: "",
  assign: vi.fn(),
  reload: vi.fn(),
  replace: vi.fn(),
};

// Mock fetch
global.fetch = vi.fn();

describe("LogoutButton - Testy Integracyjne", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockLocation.href = "http://localhost:4321/dashboard";

    // Mock window.location
    Object.defineProperty(window, "location", {
      value: mockLocation,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Renderowanie", () => {
    it("powinien renderować przycisk z domyślnym tekstem 'Wyloguj'", () => {
      render(<LogoutButton />);

      const button = screen.getByRole("button", { name: /wyloguj/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("Wyloguj");
    });

    it("powinien renderować przycisk z niestandardowym tekstem", () => {
      render(<LogoutButton>Wyloguj się</LogoutButton>);

      const button = screen.getByRole("button", { name: /wyloguj/i });
      expect(button).toHaveTextContent("Wyloguj się");
    });

    it("powinien renderować przycisk z odpowiednim aria-label", () => {
      render(<LogoutButton />);

      const button = screen.getByRole("button", { name: "Wyloguj się z systemu" });
      expect(button).toBeInTheDocument();
    });

    it("powinien przyjmować dodatkowe klasy CSS", () => {
      render(<LogoutButton className="custom-class" />);

      const button = screen.getByRole("button", { name: /wyloguj/i });
      expect(button).toHaveClass("custom-class");
    });

    it("powinien renderować przycisk (wariant ghost jest domyślny)", () => {
      render(<LogoutButton />);

      const button = screen.getByRole("button", { name: /wyloguj/i });
      // Sprawdzamy czy przycisk istnieje - wariant ghost jest domyślnym w komponencie
      expect(button).toBeInTheDocument();
    });

    it("powinien akceptować różne warianty przycisków", () => {
      render(<LogoutButton variant="destructive" />);

      const button = screen.getByRole("button", { name: /wyloguj/i });
      // Sprawdzamy czy przycisk istnieje z wariantem destructive
      expect(button).toBeInTheDocument();
    });
  });

  describe("Funkcjonalność wylogowania", () => {
    it("powinien wywołać fetch z prawidłowym URL i metodą POST", async () => {
      const user = userEvent.setup();

      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { Location: "/" },
        })
      );

      render(<LogoutButton />);

      const button = screen.getByRole("button", { name: /wyloguj/i });
      await user.click(button);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith("/api/auth/logout", {
          method: "POST",
          credentials: "same-origin",
        });
      });
    });

    it("powinien przekierować na stronę główną po pomyślnym wylogowaniu", async () => {
      const user = userEvent.setup();

      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { Location: "/" },
        })
      );

      render(<LogoutButton />);

      const button = screen.getByRole("button", { name: /wyloguj/i });
      await user.click(button);

      await waitFor(() => {
        expect(mockLocation.href).toBe("/");
      });
    });

    it("powinien wywołać callback onLogoutSuccess po pomyślnym wylogowaniu", async () => {
      const user = userEvent.setup();
      const onLogoutSuccess = vi.fn();

      // Mock fetch z odpowiedzią 200 (OK)
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(null, {
          status: 200,
        })
      );

      render(<LogoutButton onLogoutSuccess={onLogoutSuccess} />);

      const button = screen.getByRole("button", { name: /wyloguj/i });
      await user.click(button);

      await waitFor(() => {
        expect(onLogoutSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it("powinien wyświetlić tekst 'Wylogowywanie...' podczas procesu wylogowania", async () => {
      const user = userEvent.setup();

      // Mock fetch z opóźnieniem
      vi.mocked(fetch).mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve(
                new Response(null, {
                  status: 302,
                  headers: { Location: "/" },
                })
              );
            }, 100);
          })
      );

      render(<LogoutButton />);

      const button = screen.getByRole("button", { name: /wyloguj/i });
      await user.click(button);

      // Sprawdź, czy tekst zmienił się na "Wylogowywanie..."
      await waitFor(() => {
        expect(button).toHaveTextContent("Wylogowywanie...");
      });
    });

    it("powinien zablokować przycisk podczas procesu wylogowania", async () => {
      const user = userEvent.setup();

      // Mock fetch z opóźnieniem
      vi.mocked(fetch).mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve(
                new Response(null, {
                  status: 302,
                  headers: { Location: "/" },
                })
              );
            }, 100);
          })
      );

      render(<LogoutButton />);

      const button = screen.getByRole("button", { name: /wyloguj/i });
      await user.click(button);

      // Sprawdź, czy przycisk jest zablokowany
      await waitFor(() => {
        expect(button).toBeDisabled();
      });
    });

    it("powinien zapobiec wielokrotnym kliknięciom podczas wylogowania", async () => {
      const user = userEvent.setup();

      // Mock fetch z opóźnieniem
      vi.mocked(fetch).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve(
                new Response(null, {
                  status: 302,
                  headers: { Location: "/" },
                })
              );
            }, 100);
          })
      );

      render(<LogoutButton />);

      const button = screen.getByRole("button", { name: /wyloguj/i });

      // Kliknij wielokrotnie
      await user.click(button);
      await user.click(button);
      await user.click(button);

      // Fetch powinien być wywołany tylko raz
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Obsługa błędów", () => {
    it("powinien przekierować na stronę główną nawet w przypadku błędu fetch", async () => {
      const user = userEvent.setup();

      vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

      render(<LogoutButton />);

      const button = screen.getByRole("button", { name: /wyloguj/i });
      await user.click(button);

      await waitFor(() => {
        expect(mockLocation.href).toBe("/");
      });
    });

    it("powinien wywołać callback onLogoutError w przypadku błędu", async () => {
      const user = userEvent.setup();
      const onLogoutError = vi.fn();

      vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

      render(<LogoutButton onLogoutError={onLogoutError} />);

      const button = screen.getByRole("button", { name: /wyloguj/i });
      await user.click(button);

      await waitFor(() => {
        expect(onLogoutError).toHaveBeenCalledTimes(1);
        expect(onLogoutError).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    it("powinien obsłużyć odpowiedź z kodem błędu", async () => {
      const user = userEvent.setup();
      const onLogoutError = vi.fn();

      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
        })
      );

      render(<LogoutButton onLogoutError={onLogoutError} />);

      const button = screen.getByRole("button", { name: /wyloguj/i });
      await user.click(button);

      await waitFor(() => {
        expect(onLogoutError).toHaveBeenCalledTimes(1);
        // Mimo błędu, powinno przekierować
        expect(mockLocation.href).toBe("/");
      });
    });

    it("powinien przekierować na stronę główną nawet gdy callback sukcesu rzuci błąd", async () => {
      const user = userEvent.setup();
      const onLogoutSuccess = vi.fn(() => {
        throw new Error("Callback error");
      });

      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { Location: "/" },
        })
      );

      render(<LogoutButton onLogoutSuccess={onLogoutSuccess} />);

      const button = screen.getByRole("button", { name: /wyloguj/i });
      await user.click(button);

      // Mimo błędu w callback, powinno przekierować
      await waitFor(() => {
        expect(mockLocation.href).toBe("/");
      });
    });
  });

  describe("Accessibility", () => {
    it("powinien mieć odpowiedni aria-label", () => {
      render(<LogoutButton />);

      const button = screen.getByRole("button", { name: "Wyloguj się z systemu" });
      expect(button).toBeInTheDocument();
    });

    it("powinien być dostępny za pomocą klawiatury", async () => {
      const user = userEvent.setup();

      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { Location: "/" },
        })
      );

      render(<LogoutButton />);

      const button = screen.getByRole("button", { name: /wyloguj/i });

      // Symuluj nawigację Tab do przycisku i naciśnięcie Enter
      button.focus();
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith("/api/auth/logout", {
          method: "POST",
          credentials: "same-origin",
        });
      });
    });

    it("powinien komunikować stan ładowania dla screen readers", async () => {
      const user = userEvent.setup();

      vi.mocked(fetch).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve(
                new Response(null, {
                  status: 302,
                  headers: { Location: "/" },
                })
              );
            }, 100);
          })
      );

      render(<LogoutButton />);

      const button = screen.getByRole("button", { name: /wyloguj/i });
      await user.click(button);

      await waitFor(() => {
        expect(button).toHaveTextContent("Wylogowywanie...");
        expect(button).toBeDisabled();
      });
    });
  });

  describe("Różne scenariusze użycia", () => {
    it("powinien działać z wariantem destructive", async () => {
      const user = userEvent.setup();

      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { Location: "/" },
        })
      );

      render(<LogoutButton variant="destructive" />);

      const button = screen.getByRole("button", { name: /wyloguj/i });
      await user.click(button);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
    });

    it("powinien działać z niestandardowymi klasami CSS", async () => {
      const user = userEvent.setup();

      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { Location: "/" },
        })
      );

      render(<LogoutButton className="my-custom-class" />);

      const button = screen.getByRole("button", { name: /wyloguj/i });
      expect(button).toHaveClass("my-custom-class");

      await user.click(button);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
    });
  });
});

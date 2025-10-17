import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/auth/LoginForm";

// Mock fetch API
global.fetch = vi.fn();

describe("LoginForm - Testy Integracyjne", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("Renderowanie formularza", () => {
    it("powinien renderować wszystkie pola formularza", () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/e-?mail/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/hasło/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /zaloguj/i })).toBeInTheDocument();
    });

    it("pola formularza powinny być początkowo puste", () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/e-?mail/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/hasło/i) as HTMLInputElement;

      expect(emailInput.value).toBe("");
      expect(passwordInput.value).toBe("");
    });

    it("przycisk submit powinien być dostępny", () => {
      render(<LoginForm />);

      const submitButton = screen.getByRole("button", { name: /zaloguj/i });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe("Walidacja po stronie klienta", () => {
    it("powinien pokazać błąd gdy email jest pusty", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const passwordInput = screen.getByLabelText(/hasło/i);
      const submitButton = screen.getByRole("button", { name: /zaloguj/i });

      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/to pole jest wymagane/i)).toBeInTheDocument();
      });
    });

    it("powinien pokazać błąd gdy hasło jest puste", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/e-?mail/i);
      const submitButton = screen.getByRole("button", { name: /zaloguj/i });

      await user.type(emailInput, "test@example.com");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/to pole jest wymagane/i)).toBeInTheDocument();
      });
    });

    it("powinien wyczyścić błędy po ponownym submit z poprawnymi danymi", async () => {
      const user = userEvent.setup();
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<LoginForm />);

      const submitButton = screen.getByRole("button", { name: /zaloguj/i });

      // Pierwszy submit bez danych
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/to pole jest wymagane/i)).toBeInTheDocument();
      });

      // Drugi submit z danymi
      const emailInput = screen.getByLabelText(/e-?mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(/to pole jest wymagane/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("Integracja z API", () => {
    it("powinien wysłać poprawne dane do API", async () => {
      const user = userEvent.setup();
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });
      global.fetch = mockFetch;

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/e-?mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);
      const submitButton = screen.getByRole("button", { name: /zaloguj/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "test@example.com",
            password: "password123",
          }),
        });
      });
    });

    it("powinien pokazać stan loading podczas wysyłania", async () => {
      const user = userEvent.setup();
      let resolvePromise: ((value: unknown) => void) | undefined;
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(fetchPromise);

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/e-?mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);
      const submitButton = screen.getByRole("button", { name: /zaloguj/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      // Przycisk powinien być wyłączony podczas loading
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      // Cleanup
      if (resolvePromise) {
        resolvePromise({
          ok: true,
          json: async () => ({ success: true }),
        });
      }
    });

    it("powinien obsłużyć błąd walidacji z serwera", async () => {
      const user = userEvent.setup();
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            code: "VALIDATION_ERROR",
            message: "Błąd walidacji",
            details: {
              email: "Nieprawidłowy format adresu e-mail",
            },
          },
        }),
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/e-?mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);
      const submitButton = screen.getByRole("button", { name: /zaloguj/i });

      await user.type(emailInput, "invalid-email");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/nieprawidłowy format/i)).toBeInTheDocument();
      });
    });

    it("powinien obsłużyć błąd nieprawidłowych danych logowania", async () => {
      const user = userEvent.setup();
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Nieprawidłowy email lub hasło",
          },
        }),
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/e-?mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);
      const submitButton = screen.getByRole("button", { name: /zaloguj/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "wrongpassword");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/nieprawidłowy email lub hasło/i)).toBeInTheDocument();
      });
    });

    it("powinien obsłużyć błąd sieciowy", async () => {
      const user = userEvent.setup();
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network error"));

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/e-?mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);
      const submitButton = screen.getByRole("button", { name: /zaloguj/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/wystąpił błąd|nie udało się|network error/i)).toBeInTheDocument();
      });
    });
  });

  describe("Interakcje użytkownika", () => {
    it("powinien aktualizować wartość email podczas wpisywania", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/e-?mail/i) as HTMLInputElement;

      await user.type(emailInput, "test@example.com");

      expect(emailInput.value).toBe("test@example.com");
    });

    it("powinien aktualizować wartość hasła podczas wpisywania", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const passwordInput = screen.getByLabelText(/hasło/i) as HTMLInputElement;

      await user.type(passwordInput, "password123");

      expect(passwordInput.value).toBe("password123");
    });

    it("powinien umożliwić wysłanie formularza klawiszem Enter", async () => {
      const user = userEvent.setup();
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });
      global.fetch = mockFetch;

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/e-?mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123{Enter}");

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });

  describe("Accessibility", () => {
    it("pole email powinno mieć odpowiedni typ", () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/e-?mail/i);
      expect(emailInput).toHaveAttribute("type", "email");
    });

    it("pole hasła powinno mieć odpowiedni typ", () => {
      render(<LoginForm />);

      const passwordInput = screen.getByLabelText(/hasło/i);
      expect(passwordInput).toHaveAttribute("type", "password");
    });

    it("formularz powinien mieć odpowiednie aria-labels", () => {
      render(<LoginForm />);

      const form = screen.getByRole("form", { hidden: true }) || document.querySelector("form");
      expect(form).toBeInTheDocument();
    });

    it("błędy walidacji powinny być powiązane z polami", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const submitButton = screen.getByRole("button", { name: /zaloguj/i });
      await user.click(submitButton);

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/e-?mail/i);
        const errorMessage = screen.getByText(/to pole jest wymagane/i);
        expect(errorMessage).toBeInTheDocument();
        // Sprawdź czy błąd jest w kontekście pola email
        const emailField = emailInput.closest("div");
        expect(emailField).toContainElement(errorMessage);
      });
    });
  });
});

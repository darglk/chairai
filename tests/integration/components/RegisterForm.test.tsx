import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterForm } from "@/components/auth/RegisterForm";

// Mock fetch API
global.fetch = vi.fn();

describe("RegisterForm - Testy Integracyjne", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("Renderowanie formularza", () => {
    it("powinien renderować wszystkie pola formularza rejestracji", () => {
      render(<RegisterForm />);

      expect(screen.getByLabelText(/e-?mail/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^hasło$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/powtórz hasło|potwierdź hasło/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /zarejestruj/i })).toBeInTheDocument();
    });

    it("powinien renderować opcje typu konta", () => {
      render(<RegisterForm />);

      expect(screen.getByRole("radio", { name: /klient/i })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: /rzemieślnik/i })).toBeInTheDocument();
    });

    it("żadna opcja typu konta nie powinna być domyślnie zaznaczona", () => {
      render(<RegisterForm />);

      const clientRadio = screen.getByRole("radio", { name: /klient/i }) as HTMLInputElement;
      const artisanRadio = screen.getByRole("radio", {
        name: /rzemieślnik/i,
      }) as HTMLInputElement;

      expect(clientRadio.checked).toBe(false);
      expect(artisanRadio.checked).toBe(false);
    });
  });

  describe("Walidacja hasła", () => {
    it("powinien pokazać błąd gdy hasło jest za krótkie", async () => {
      const user = userEvent.setup();
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            code: "VALIDATION_ERROR",
            details: {
              password: "Hasło musi mieć co najmniej 8 znaków",
            },
          },
        }),
      });

      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/e-?mail/i);
      const passwordInput = screen.getByLabelText(/^hasło$/i);
      const confirmPasswordInput = screen.getByLabelText(/powtórz hasło|potwierdź hasło/i);
      const clientRadio = screen.getByRole("radio", { name: /klient/i });
      const submitButton = screen.getByRole("button", { name: /zarejestruj/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "Pass1");
      await user.type(confirmPasswordInput, "Pass1");
      await user.click(clientRadio);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/co najmniej 8 znaków/i)).toBeInTheDocument();
      });
    });

    it("powinien pokazać błąd gdy hasło nie zawiera wielkiej litery", async () => {
      const user = userEvent.setup();
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            code: "VALIDATION_ERROR",
            details: {
              password: "Hasło musi zawierać co najmniej jedną wielką literę",
            },
          },
        }),
      });

      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/e-?mail/i);
      const passwordInput = screen.getByLabelText(/^hasło$/i);
      const confirmPasswordInput = screen.getByLabelText(/powtórz hasło|potwierdź hasło/i);
      const clientRadio = screen.getByRole("radio", { name: /klient/i });
      const submitButton = screen.getByRole("button", { name: /zarejestruj/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");
      await user.click(clientRadio);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/wielką literę/i)).toBeInTheDocument();
      });
    });

    it("powinien pokazać błąd gdy hasła nie są zgodne", async () => {
      const user = userEvent.setup();
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            code: "VALIDATION_ERROR",
            details: {
              confirmPassword: "Hasła nie są zgodne",
            },
          },
        }),
      });

      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/e-?mail/i);
      const passwordInput = screen.getByLabelText(/^hasło$/i);
      const confirmPasswordInput = screen.getByLabelText(/powtórz hasło|potwierdź hasło/i);
      const clientRadio = screen.getByRole("radio", { name: /klient/i });
      const submitButton = screen.getByRole("button", { name: /zarejestruj/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "Password123");
      await user.type(confirmPasswordInput, "DifferentPassword123");
      await user.click(clientRadio);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/hasła nie są zgodne/i)).toBeInTheDocument();
      });
    });
  });

  describe("Wybór typu konta", () => {
    it("powinien pozwolić na wybór konta klienta", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const clientRadio = screen.getByRole("radio", { name: /klient/i }) as HTMLInputElement;

      await user.click(clientRadio);

      expect(clientRadio.checked).toBe(true);
    });

    it("powinien pozwolić na wybór konta rzemieślnika", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const artisanRadio = screen.getByRole("radio", {
        name: /rzemieślnik/i,
      }) as HTMLInputElement;

      await user.click(artisanRadio);

      expect(artisanRadio.checked).toBe(true);
    });

    it("powinien pozwolić na zmianę typu konta", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const clientRadio = screen.getByRole("radio", { name: /klient/i }) as HTMLInputElement;
      const artisanRadio = screen.getByRole("radio", {
        name: /rzemieślnik/i,
      }) as HTMLInputElement;

      await user.click(clientRadio);
      expect(clientRadio.checked).toBe(true);
      expect(artisanRadio.checked).toBe(false);

      await user.click(artisanRadio);
      expect(clientRadio.checked).toBe(false);
      expect(artisanRadio.checked).toBe(true);
    });
  });

  describe("Pomyślna rejestracja", () => {
    it("powinien wysłać poprawne dane do API", async () => {
      const user = userEvent.setup();
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });
      global.fetch = mockFetch;

      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/e-?mail/i);
      const passwordInput = screen.getByLabelText(/^hasło$/i);
      const confirmPasswordInput = screen.getByLabelText(/powtórz hasło|potwierdź hasło/i);
      const clientRadio = screen.getByRole("radio", { name: /klient/i });
      const submitButton = screen.getByRole("button", { name: /zarejestruj/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "Password123");
      await user.type(confirmPasswordInput, "Password123");
      await user.click(clientRadio);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/auth/register",
          expect.objectContaining({
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: "test@example.com",
              password: "Password123",
              confirmPassword: "Password123",
              accountType: "client",
            }),
          })
        );
      });
    });

    it("powinien wysłać 'artisan' jako accountType dla rzemieślnika", async () => {
      const user = userEvent.setup();
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });
      global.fetch = mockFetch;

      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/e-?mail/i);
      const passwordInput = screen.getByLabelText(/^hasło$/i);
      const confirmPasswordInput = screen.getByLabelText(/powtórz hasło|potwierdź hasło/i);
      const artisanRadio = screen.getByRole("radio", { name: /rzemieślnik/i });
      const submitButton = screen.getByRole("button", { name: /zarejestruj/i });

      await user.type(emailInput, "artisan@example.com");
      await user.type(passwordInput, "Password123");
      await user.type(confirmPasswordInput, "Password123");
      await user.click(artisanRadio);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/auth/register",
          expect.objectContaining({
            body: expect.stringContaining('"accountType":"artisan"'),
          })
        );
      });
    });
  });

  describe("Obsługa błędów", () => {
    it("powinien pokazać błąd gdy email już istnieje", async () => {
      const user = userEvent.setup();
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          error: {
            code: "EMAIL_EXISTS",
            message: "Użytkownik o tym adresie e-mail już istnieje",
          },
        }),
      });

      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/e-?mail/i);
      const passwordInput = screen.getByLabelText(/^hasło$/i);
      const confirmPasswordInput = screen.getByLabelText(/powtórz hasło|potwierdź hasło/i);
      const clientRadio = screen.getByRole("radio", { name: /klient/i });
      const submitButton = screen.getByRole("button", { name: /zarejestruj/i });

      await user.type(emailInput, "existing@example.com");
      await user.type(passwordInput, "Password123");
      await user.type(confirmPasswordInput, "Password123");
      await user.click(clientRadio);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/już istnieje/i)).toBeInTheDocument();
      });
    });

    it("powinien wyświetlić przycisk disabled podczas ładowania", async () => {
      const user = userEvent.setup();
      let resolvePromise: ((value: unknown) => void) | undefined;
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(fetchPromise);

      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/e-?mail/i);
      const passwordInput = screen.getByLabelText(/^hasło$/i);
      const confirmPasswordInput = screen.getByLabelText(/powtórz hasło|potwierdź hasło/i);
      const clientRadio = screen.getByRole("radio", { name: /klient/i });
      const submitButton = screen.getByRole("button", { name: /zarejestruj/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "Password123");
      await user.type(confirmPasswordInput, "Password123");
      await user.click(clientRadio);
      await user.click(submitButton);

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
  });

  describe("Accessibility", () => {
    it("pola hasła powinny mieć typ 'password'", () => {
      render(<RegisterForm />);

      const passwordInput = screen.getByLabelText(/^hasło$/i);
      const confirmPasswordInput = screen.getByLabelText(/powtórz hasło|potwierdź hasło/i);

      expect(passwordInput).toHaveAttribute("type", "password");
      expect(confirmPasswordInput).toHaveAttribute("type", "password");
    });

    it("radio buttons powinny być grupowane", () => {
      render(<RegisterForm />);

      const clientRadio = screen.getByRole("radio", { name: /klient/i });
      const artisanRadio = screen.getByRole("radio", { name: /rzemieślnik/i });

      // Oba radio buttons powinny mieć tę samą wartość name
      expect(clientRadio.getAttribute("name")).toBe(artisanRadio.getAttribute("name"));
    });
  });
});

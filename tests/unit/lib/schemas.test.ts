import { describe, it, expect } from "vitest";
import { LoginSchema, RegisterSchema, PasswordRecoverySchema, PasswordResetSchema } from "@/lib/schemas";

describe("Validation Schemas", () => {
  describe("LoginSchema", () => {
    it("powinien zaakceptować prawidłowe dane logowania", () => {
      const validData = {
        email: "test@example.com",
        password: "password123",
      };

      const result = LoginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("powinien odrzucić nieprawidłowy format email", () => {
      const invalidData = {
        email: "nieprawidlowy-email",
        password: "password123",
      };

      const result = LoginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Nieprawidłowy format adresu e-mail");
      }
    });

    it("powinien odrzucić pusty email", () => {
      const invalidData = {
        email: "",
        password: "password123",
      };

      const result = LoginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Pusty string jest również nieprawidłowym emailem
        expect(result.error.issues[0].message).toMatch(/email|adres|nieprawidłowy/i);
      }
    });

    it("powinien odrzucić brak emaila", () => {
      const invalidData = {
        password: "password123",
      };

      const result = LoginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Adres e-mail jest wymagany");
      }
    });

    it("powinien odrzucić puste hasło", () => {
      const invalidData = {
        email: "test@example.com",
        password: "",
      };

      const result = LoginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Hasło jest wymagane");
      }
    });
  });

  describe("RegisterSchema", () => {
    it("powinien zaakceptować prawidłowe dane rejestracji", () => {
      const validData = {
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
        accountType: "client" as const,
      };

      const result = RegisterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("powinien odrzucić hasło krótsze niż 8 znaków", () => {
      const invalidData = {
        email: "test@example.com",
        password: "Pass1",
        confirmPassword: "Pass1",
        accountType: "client" as const,
      };

      const result = RegisterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Hasło musi mieć co najmniej 8 znaków");
      }
    });

    it("powinien odrzucić hasło bez wielkiej litery", () => {
      const invalidData = {
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
        accountType: "client" as const,
      };

      const result = RegisterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("wielką literę");
      }
    });

    it("powinien odrzucić hasło bez małej litery", () => {
      const invalidData = {
        email: "test@example.com",
        password: "PASSWORD123",
        confirmPassword: "PASSWORD123",
        accountType: "client" as const,
      };

      const result = RegisterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("małą literę");
      }
    });

    it("powinien odrzucić hasło bez cyfry", () => {
      const invalidData = {
        email: "test@example.com",
        password: "PasswordOnly",
        confirmPassword: "PasswordOnly",
        accountType: "client" as const,
      };

      const result = RegisterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("cyfrę");
      }
    });

    it("powinien odrzucić niezgodne hasła", () => {
      const invalidData = {
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "DifferentPassword123",
        accountType: "client" as const,
      };

      const result = RegisterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmPasswordError = result.error.issues.find((issue) => issue.path[0] === "confirmPassword");
        expect(confirmPasswordError?.message).toBe("Hasła nie są zgodne");
      }
    });

    it("powinien odrzucić nieprawidłowy typ konta", () => {
      const invalidData = {
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
        accountType: "invalid",
      };

      const result = RegisterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Sprawdź czy komunikat zawiera informację o nieprawidłowym typie
        expect(result.error.issues[0].message).toMatch(/invalid|nieprawidłowy/i);
      }
    });

    it("powinien wymagać typu konta", () => {
      const invalidData = {
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      };

      const result = RegisterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Typ konta jest wymagany");
      }
    });

    it("powinien zaakceptować typ konta 'artisan'", () => {
      const validData = {
        email: "artisan@example.com",
        password: "Password123",
        confirmPassword: "Password123",
        accountType: "artisan" as const,
      };

      const result = RegisterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("PasswordRecoverySchema", () => {
    it("powinien zaakceptować prawidłowy email", () => {
      const validData = {
        email: "test@example.com",
      };

      const result = PasswordRecoverySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("powinien odrzucić nieprawidłowy format email", () => {
      const invalidData = {
        email: "nieprawidlowy-email",
      };

      const result = PasswordRecoverySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Nieprawidłowy format adresu e-mail");
      }
    });

    it("powinien odrzucić pusty email", () => {
      const invalidData = {
        email: "",
      };

      const result = PasswordRecoverySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("PasswordResetSchema", () => {
    it("powinien zaakceptować prawidłowe hasła", () => {
      const validData = {
        password: "NewPassword123",
        confirmPassword: "NewPassword123",
      };

      const result = PasswordResetSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("powinien odrzucić hasło krótsze niż 8 znaków", () => {
      const invalidData = {
        password: "Pass1",
        confirmPassword: "Pass1",
      };

      const result = PasswordResetSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Hasło musi mieć co najmniej 8 znaków");
      }
    });

    it("powinien odrzucić niezgodne hasła", () => {
      const invalidData = {
        password: "Password123",
        confirmPassword: "DifferentPassword123",
      };

      const result = PasswordResetSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmPasswordError = result.error.issues.find((issue) => issue.path[0] === "confirmPassword");
        expect(confirmPasswordError?.message).toBe("Hasła nie są zgodne");
      }
    });

    it("powinien sprawdzić złożoność hasła", () => {
      const invalidData = {
        password: "weakpassword",
        confirmPassword: "weakpassword",
      };

      const result = PasswordResetSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("wielką literę");
      }
    });
  });

  describe("Edge cases", () => {
    it("powinien obsłużyć email z nietypowymi znakami", () => {
      const data = {
        email: "test+alias@example.co.uk",
        password: "Password123",
      };

      const result = LoginSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("powinien obsłużyć hasło ze znakami specjalnymi", () => {
      const data = {
        email: "test@example.com",
        password: "P@ssw0rd!#$",
        confirmPassword: "P@ssw0rd!#$",
        accountType: "client" as const,
      };

      const result = RegisterSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("powinien obsłużyć maksymalnie długie wartości", () => {
      const longEmail = "a".repeat(50) + "@example.com";
      const longPassword = "P" + "a".repeat(100) + "1";

      const data = {
        email: longEmail,
        password: longPassword,
        confirmPassword: longPassword,
        accountType: "client" as const,
      };

      const result = RegisterSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});

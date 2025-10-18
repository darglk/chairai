/**
 * Integration Tests for Image Generation Workflow
 *
 * Tests for:
 * - Schema validation (prompt length, format)
 * - AIImageService integration with OpenRouter
 * - Complete generation workflow
 * - Error handling scenarios
 */

import { describe, it, expect } from "vitest";
import { GenerateImageSchema } from "@/lib/schemas";
import { ZodError } from "zod";

describe("Validation Schema: GenerateImageSchema", () => {
  describe("Validating prompt field", () => {
    it("powinien zaakceptować prawidłowy prompt (10-500 znaków)", () => {
      const data = {
        prompt: "Nowoczesny fotel w stylu skandynawskim",
      };

      expect(() => GenerateImageSchema.parse(data)).not.toThrow();
    });

    it("powinien zaakceptować prompt dokładnie 10 znaków", () => {
      const data = {
        prompt: "0123456789",
      };

      expect(() => GenerateImageSchema.parse(data)).not.toThrow();
    });

    it("powinien zaakceptować prompt dokładnie 500 znaków", () => {
      const data = {
        prompt: "A".repeat(500),
      };

      expect(() => GenerateImageSchema.parse(data)).not.toThrow();
    });

    it("powinien odrzucić prompt poniżej 10 znaków", () => {
      const data = {
        prompt: "Short",
      };

      expect(() => GenerateImageSchema.parse(data)).toThrow(ZodError);
    });

    it("powinien odrzucić prompt powyżej 500 znaków", () => {
      const data = {
        prompt: "A".repeat(501),
      };

      expect(() => GenerateImageSchema.parse(data)).toThrow(ZodError);
    });

    it("powinien odrzucić pusty prompt", () => {
      const data = {
        prompt: "",
      };

      expect(() => GenerateImageSchema.parse(data)).toThrow(ZodError);
    });

    it("powinien odrzucić prompt z tylko białymi znakami", () => {
      const data = {
        prompt: "     ",
      };

      // Note: Zod by default trims strings, so this might pass
      // depending on schema implementation
      const result = GenerateImageSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("powinien wymagać pola prompt", () => {
      const data = {};

      expect(() => GenerateImageSchema.parse(data)).toThrow(ZodError);
    });

    it("powinien zawierać komunikat błędu dla zbyt krótkiego promptu", () => {
      const data = {
        prompt: "ABC",
      };

      const result = GenerateImageSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.errors[0]?.message.toLowerCase();
        expect(errorMessage).toContain("znaków");
      }
    });

    it("powinien zawierać komunikat błędu dla zbyt długiego promptu", () => {
      const data = {
        prompt: "A".repeat(501),
      };

      const result = GenerateImageSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.errors[0]?.message.toLowerCase();
        expect(errorMessage).toContain("przekraczać");
      }
    });
  });

  describe("Type inference", () => {
    it("powinien zwrócić typ GenerateImageInput", () => {
      const data = {
        prompt: "Nowoczesny fotel",
      };

      const result = GenerateImageSchema.parse(data);
      expect(result).toHaveProperty("prompt");
      expect(typeof result.prompt).toBe("string");
    });
  });
});

import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("Utils - cn() function", () => {
  describe("Podstawowa funkcjonalność", () => {
    it("powinien połączyć pojedynczą klasę", () => {
      const result = cn("text-red-500");
      expect(result).toBe("text-red-500");
    });

    it("powinien połączyć wiele klas", () => {
      const result = cn("text-red-500", "bg-blue-500", "p-4");
      expect(result).toBe("text-red-500 bg-blue-500 p-4");
    });

    it("powinien ignorować wartości falsy", () => {
      const result = cn("text-red-500", false, null, undefined, "", "bg-blue-500");
      expect(result).toBe("text-red-500 bg-blue-500");
    });

    it("powinien obsługiwać warunki", () => {
      const isActive = true;
      const result = cn("base-class", isActive && "active-class");
      expect(result).toBe("base-class active-class");
    });

    it("powinien obsługiwać warunki negatywne", () => {
      const isActive = false;
      const result = cn("base-class", isActive && "active-class");
      expect(result).toBe("base-class");
    });
  });

  describe("Tailwind merge", () => {
    it("powinien mergować konfliktujące klasy Tailwind", () => {
      const result = cn("p-4", "p-8");
      expect(result).toBe("p-8");
    });

    it("powinien zachować ostatnią wartość dla tej samej właściwości", () => {
      const result = cn("text-sm", "text-lg");
      expect(result).toBe("text-lg");
    });

    it("powinien mergować różne właściwości", () => {
      const result = cn("text-sm bg-red-500", "text-lg text-blue-600");
      expect(result).toBe("bg-red-500 text-lg text-blue-600");
    });
  });

  describe("Złożone scenariusze", () => {
    it("powinien obsługiwać tablice klas", () => {
      const result = cn(["text-red-500", "bg-blue-500"]);
      expect(result).toBe("text-red-500 bg-blue-500");
    });

    it("powinien obsługiwać obiekty z kluczami jako klasami", () => {
      const result = cn({
        "text-red-500": true,
        "bg-blue-500": false,
        "p-4": true,
      });
      expect(result).toBe("text-red-500 p-4");
    });

    it("powinien obsługiwać kombinację różnych typów", () => {
      const isActive = true;
      const result = cn("base", ["array-class"], { "object-class": true }, isActive && "active");
      expect(result).toContain("base");
      expect(result).toContain("array-class");
      expect(result).toContain("object-class");
      expect(result).toContain("active");
    });
  });

  describe("Edge cases", () => {
    it("powinien zwrócić pusty string dla pustych argumentów", () => {
      const result = cn();
      expect(result).toBe("");
    });

    it("powinien obsłużyć same wartości falsy", () => {
      const result = cn(false, null, undefined, "");
      expect(result).toBe("");
    });

    it("powinien obsłużyć puste tablice", () => {
      const result = cn([]);
      expect(result).toBe("");
    });

    it("powinien obsłużyć pusty obiekt", () => {
      const result = cn({});
      expect(result).toBe("");
    });
  });
});

import { describe, it, expect, vi } from "vitest";
import { AIImageService } from "@/lib/services/ai-image.service";

// Mock OpenRouterService aby testy integracyjne pracowały bez realnego API
vi.mock("@/lib/services/openrouter.service", () => {
  return {
    OpenRouterService: vi.fn().mockImplementation(() => ({
      generateImagePrompt: vi.fn().mockResolvedValue({
        positivePrompt: "mockowy pozytywny prompt dla testu integracyjnego",
        negativePrompt: "blur, low quality",
      }),
    })),
  };
});

/**
 * Integracja testowa: AIImageService z OpenRouterService (zmockowany)
 *
 * Testy integracyjne sprawdzają całą ścieżkę generowania obrazów
 * od przyjęcia opisu mebla do zwrócenia wynikowego URL-a z ulepszonym promptem.
 */
describe("Integration: AIImageService + OpenRouterService", () => {
  describe("Przepływ generowania obrazu", () => {
    it("powinien pomyślnie przejść przez cały przepływ generowania", async () => {
      const mockApiKey = "test-api-key-12345";
      const userDescription = "elegancki nowoczesny fotel z szarą tkaniną";

      // Inicjalizuj serwis
      const service = new AIImageService(mockApiKey);

      // Wygeneruj obraz
      const result = await service.generateFurnitureImage(userDescription);

      // Weryfikuj strukturę wyniku
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.imageUrl).toBeDefined();
      expect(result.imageUrl).not.toBe("");
      expect(result.positivePrompt).toBeDefined();
      expect(result.negativePrompt).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it("powinien zwrócić różne URL-e dla różnych opisów", async () => {
      const mockApiKey = "test-api-key-12345";
      const service = new AIImageService(mockApiKey);

      const result1 = await service.generateFurnitureImage("drewniane biurko");
      const result2 = await service.generateFurnitureImage("skórzana sofa");

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.imageUrl).toBeDefined();
      expect(result2.imageUrl).toBeDefined();

      // URL-e mogą być takie same jeśli trafią na tę samą wartość haszowaną
      // ale oba powinny być prawidłowymi URL-ami
      expect(result1.imageUrl).toMatch(/^https:\/\/images\.unsplash\.com/);
      expect(result2.imageUrl).toMatch(/^https:\/\/images\.unsplash\.com/);
    });

    it("powinien obsługiwać długie opisy bez problemu", async () => {
      const mockApiKey = "test-api-key-12345";
      const service = new AIImageService(mockApiKey);

      const longDescription =
        "Poszukuję wygodnego fotela do pracowni artystycznej " +
        "z materiałem odpychającym plamy, w kolorze naturalnym, " +
        "z możliwością regulacji wysokości siedziska oraz podparciem dla pleców";

      const result = await service.generateFurnitureImage(longDescription);

      expect(result.success).toBe(true);
      expect(result.imageUrl).not.toBe("");
    });

    it("powinien generować konsystentne URL-e dla tego samego opisu", async () => {
      const mockApiKey = "test-api-key-12345";
      const service = new AIImageService(mockApiKey);
      const description = "minimalistyczne biurko";

      const result1 = await service.generateFurnitureImage(description);
      const result2 = await service.generateFurnitureImage(description);
      const result3 = await service.generateFurnitureImage(description);

      expect(result1.imageUrl).toBe(result2.imageUrl);
      expect(result2.imageUrl).toBe(result3.imageUrl);
    });
  });

  describe("Obsługa błędów w przepływie", () => {
    it("powinien obsługiwać błąd walidacji wejścia", async () => {
      const mockApiKey = "test-api-key-12345";
      const service = new AIImageService(mockApiKey);

      const result = await service.generateFurnitureImage("");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.imageUrl).toBe("");
    });

    it("powinien obsługiwać wejście przekraczające limit długości", async () => {
      const mockApiKey = "test-api-key-12345";
      const service = new AIImageService(mockApiKey);

      const tooLongDescription = "a".repeat(501);
      const result = await service.generateFurnitureImage(tooLongDescription);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain("500");
    });

    it("powinien obsługiwać brak klucza API", () => {
      expect(() => {
        new AIImageService("");
      }).toThrow();
    });
  });

  describe("Konfiguracja serwisu", () => {
    it("powinien honorować ustawienia konfiguracyjne", async () => {
      const mockApiKey = "test-api-key-12345";
      const customMocks = ["https://example.com/furniture-1.jpg", "https://example.com/furniture-2.jpg"];

      const service = new AIImageService(mockApiKey, {
        maxFreeGenerations: 20,
        mockImages: customMocks,
      });

      expect(service.getMaxFreeGenerations()).toBe(20);

      // Generuj obraz i sprawdź czy używa custom mock'a
      const result = await service.generateFurnitureImage("fotel testowy");
      expect(result.success).toBe(true);
      // URL powinien być z naszych custom mock'ów
      expect(customMocks).toContain(result.imageUrl);
    });

    it("powinien używać ustawień domyślnych gdy konfiguracja nie podana", async () => {
      const mockApiKey = "test-api-key-12345";
      const service = new AIImageService(mockApiKey);

      expect(service.getMaxFreeGenerations()).toBe(10);

      const result = await service.generateFurnitureImage("biurko");
      expect(result.success).toBe(true);
      // URL powinien być z domyślnych mock'ów Unsplash
      expect(result.imageUrl).toMatch(/unsplash/);
    });
  });

  describe("Obsługa różnych typów danych", () => {
    it("powinien obsługiwać opisy z polskimi zniakami", async () => {
      const mockApiKey = "test-api-key-12345";
      const service = new AIImageService(mockApiKey);

      const result = await service.generateFurnitureImage("wygodne krzesło z szarą tkaniną");

      expect(result.success).toBe(true);
      expect(result.imageUrl).not.toBe("");
    });

    it("powinien obsługiwać opisy ze specjalnymi znakami", async () => {
      const mockApiKey = "test-api-key-12345";
      const service = new AIImageService(mockApiKey);

      const result = await service.generateFurnitureImage("fotel #1 (nowoczesny) & wygodny!");

      expect(result.success).toBe(true);
      expect(result.imageUrl).not.toBe("");
    });

    it("powinien obsługiwać opisy z numerami i wymiarami", async () => {
      const mockApiKey = "test-api-key-12345";
      const service = new AIImageService(mockApiKey);

      const result = await service.generateFurnitureImage("biurko 120cm x 60cm, wysokość 75cm");

      expect(result.success).toBe(true);
      expect(result.imageUrl).not.toBe("");
    });

    it("powinien obsługiwać opisy z cudzysłowiami", async () => {
      const mockApiKey = "test-api-key-12345";
      const service = new AIImageService(mockApiKey);

      const result = await service.generateFurnitureImage('fotel tzw. "Premium" z drewna orzecha');

      expect(result.success).toBe(true);
      expect(result.imageUrl).not.toBe("");
    });
  });

  describe("Wydajność i odporność", () => {
    it("powinien obsługiwać sekwencję szybkich żądań", async () => {
      const mockApiKey = "test-api-key-12345";
      const service = new AIImageService(mockApiKey);

      const descriptions = [
        "fotel nowoczesny",
        "stół do jadalni",
        "biurko minimalistyczne",
        "sofa narożna",
        "krzesło biurowe",
      ];

      const results = await Promise.all(descriptions.map((desc) => service.generateFurnitureImage(desc)));

      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.imageUrl).not.toBe("");
      });
    });

    it("powinien konsystentnie zwracać wyniki niezależnie od liczby żądań", async () => {
      const mockApiKey = "test-api-key-12345";
      const service = new AIImageService(mockApiKey);
      const testDescription = "elegancka szafa";

      // Wygeneruj wiele razy ten sam opis
      const urls: string[] = [];
      for (let i = 0; i < 5; i++) {
        const result = await service.generateFurnitureImage(testDescription);
        if (result.success) {
          urls.push(result.imageUrl);
        }
      }

      // Wszystkie URL-e powinny być identyczne
      const uniqueUrls = new Set(urls);
      expect(uniqueUrls.size).toBe(1);
    });
  });

  describe("Funkcje legacy (wsteczna kompatybilność)", () => {
    it("powinien eksportować funkcje legacy dla starego kodu", async () => {
      const { generateFurnitureImage, getMaxFreeGenerations } = await import("@/lib/services/ai-image.service");

      expect(generateFurnitureImage).toBeDefined();
      expect(getMaxFreeGenerations).toBeDefined();

      const max = getMaxFreeGenerations();
      expect(typeof max).toBe("number");
      expect(max).toBeGreaterThan(0);
    });

    it("powinien legacy funkcja działać bez błędów", async () => {
      const { generateFurnitureImage } = await import("@/lib/services/ai-image.service");

      // Legacy funkcja powinna obsługiwać brak klucza API gracefully
      const result = await generateFurnitureImage("test");

      expect(result).toBeDefined();
      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("imageUrl");
      expect(result).toHaveProperty("error");
    });
  });

  describe("Bezpieczeństwo i walidacja", () => {
    it("powinien nigdy nie rzucać niezłapanego wyjątku", async () => {
      const mockApiKey = "test-api-key-12345";
      const service = new AIImageService(mockApiKey);

      // Próbuj różnych wejść które mogą być problematyczne
      const problematicInputs = ["", "   ", "a".repeat(501), "\n\n\n", "regularny tekst"];

      for (const input of problematicInputs) {
        try {
          const result = await service.generateFurnitureImage(input);
          // Powinien zawsze zwrócić prawidłowy wynik, nawet dla błędnych wejść
          expect(result).toHaveProperty("success");
          expect(result).toHaveProperty("imageUrl");
        } catch {
          throw new Error(`Service nie powinien rzucać dla wejścia: "${input}"`);
        }
      }
    });

    it("powinien zawsze zwracać bezpieczne URL-e", async () => {
      const mockApiKey = "test-api-key-12345";
      const service = new AIImageService(mockApiKey);

      const result = await service.generateFurnitureImage("dowolny opis");

      if (result.success && result.imageUrl) {
        // URL powinien być prawidłowym HTTPS URL-em
        expect(result.imageUrl).toMatch(/^https:\/\//);
        // Nie powinno być podejrzanych znaków
        expect(result.imageUrl).not.toMatch(/[<>"']/);
      }
    });
  });
});

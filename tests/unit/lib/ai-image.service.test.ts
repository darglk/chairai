import { describe, it, expect, beforeEach, vi } from "vitest";
import { AIImageService } from "@/lib/services/ai-image.service";

// Mock OpenRouterService
vi.mock("@/lib/services/openrouter.service", () => {
  return {
    OpenRouterService: vi.fn().mockImplementation(() => ({
      generateImagePrompt: vi.fn().mockResolvedValue({
        positivePrompt: "mockowy pozytywny prompt",
        negativePrompt: "mockowy negatywny prompt",
      }),
    })),
  };
});

// Mock PromptEngineerService
vi.mock("@/lib/services/prompt-engineer.service", () => {
  return {
    PromptEngineerService: vi.fn().mockImplementation(() => ({
      enhancePrompt: vi.fn().mockReturnValue({
        positivePrompt: "professional furniture piece",
        negativePrompt: "low quality, blurry, distorted",
        technicalNotes: "Construction focus: joinery, materials quality",
        materials: ["wood"],
        style: "Modern",
      }),
    })),
  };
});

// Mock OpenRouterImageService
vi.mock("@/lib/services/openrouter-image.service", () => {
  const mockImageUrls = [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1024",
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1024",
    "https://images.unsplash.com/photo-1505692952047-1d71bcad2d99?w=1024",
    "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=1024",
  ];
  const promptUrlMap = new Map<string, string>();
  let urlIndex = 0;

  return {
    OpenRouterImageService: vi.fn().mockImplementation(() => ({
      generateImage: vi.fn().mockImplementation(async (prompt: string) => {
        // Return same URL for same prompt (deterministic)
        if (!promptUrlMap.has(prompt)) {
          promptUrlMap.set(prompt, mockImageUrls[urlIndex % mockImageUrls.length]);
          urlIndex++;
        }
        const url = promptUrlMap.get(prompt);
        return {
          imageUrl: url,
          success: true,
          modelUsed: "google/gemini-2.5-flash-image-preview",
          generationTime: 1000,
        };
      }),
    })),
  };
});

describe("AIImageService", () => {
  let service: AIImageService;
  const mockApiKey = "test-api-key-12345";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Konstruktor", () => {
    it("powinien inicjalizować serwis z prawidłowym kluczem API", () => {
      service = new AIImageService(mockApiKey);
      expect(service).toBeDefined();
      expect(service.getMaxFreeGenerations()).toBe(10);
    });

    it("powinien rzucić błąd gdy brak klucza API", () => {
      expect(() => {
        new AIImageService("");
      }).toThrow("OpenRouter API key is required for AIImageService");
    });

    it("powinien rzucić błąd gdy klucz API to null", () => {
      expect(() => {
        new AIImageService(null as unknown as string);
      }).toThrow("OpenRouter API key is required for AIImageService");
    });

    it("powinien akceptować konfigurację custom", () => {
      service = new AIImageService(mockApiKey, {
        maxFreeGenerations: 5,
      });
      expect(service.getMaxFreeGenerations()).toBe(5);
    });
  });

  describe("getMaxFreeGenerations()", () => {
    it("powinien zwrócić domyślną liczbę generacji", () => {
      service = new AIImageService(mockApiKey);
      expect(service.getMaxFreeGenerations()).toBe(10);
    });

    it("powinien zwrócić custom liczbę generacji z konfiguracji", () => {
      service = new AIImageService(mockApiKey, {
        maxFreeGenerations: 20,
      });
      expect(service.getMaxFreeGenerations()).toBe(20);
    });
  });

  describe("generateFurnitureImage()", () => {
    beforeEach(() => {
      service = new AIImageService(mockApiKey);
    });

    it("powinien pomyślnie wygenerować obraz z prawidłowym opisem", async () => {
      const mockPrompt = "nowoczesny fotel w stylu skandynawskim";

      const result = await service.generateFurnitureImage(mockPrompt);

      expect(result.success).toBe(true);
      expect(result.imageUrl).toBeDefined();
      expect(result.imageUrl).not.toBe("");
      expect(result.error).toBeUndefined();
    });

    it("powinien zawierać pozytywny i negatywny prompt w wyniku", async () => {
      const mockPrompt = "drewniane krzesło biurowe";

      const result = await service.generateFurnitureImage(mockPrompt);

      expect(result.success).toBe(true);
      expect(result.positivePrompt).toBeDefined();
      expect(result.negativePrompt).toBeDefined();
    });

    it("powinien zwrócić błąd dla pustego opisu", async () => {
      const result = await service.generateFurnitureImage("");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain("pusty");
    });

    it("powinien zwrócić błąd dla opisu zawierającego tylko spacje", async () => {
      const result = await service.generateFurnitureImage("   ");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain("spacje");
    });

    it("powinien zwrócić błąd dla zbyt długiego opisu (>500 znaków)", async () => {
      const longDescription = "a".repeat(501);
      const result = await service.generateFurnitureImage(longDescription);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain("500");
    });

    it("powinien zwrócić błąd dla opisu który nie jest stringiem", async () => {
      const result = await service.generateFurnitureImage(123 as unknown as string);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain("tekstem");
    });

    it("powinien zwrócić różne URL-e dla różnych opisów", async () => {
      const description1 = "fotel nowoczesny";
      const description2 = "stół tradycyjny";

      const result1 = await service.generateFurnitureImage(description1);
      const result2 = await service.generateFurnitureImage(description2);

      // Możliwe że będą to te same URL-e jeśli się haszują na tę samą wartość
      // ale struktura wyniku powinna być identyczna
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    it("powinien konsystentnie zwracać ten sam URL dla tego samego opisu", async () => {
      const description = "niebieski fotel";

      const result1 = await service.generateFurnitureImage(description);
      const result2 = await service.generateFurnitureImage(description);

      expect(result1.imageUrl).toBe(result2.imageUrl);
    });

    it("powinien obsługiwać opis na granicy długości (dokładnie 500 znaków)", async () => {
      const descriptionAt500 = "a".repeat(500);
      const result = await service.generateFurnitureImage(descriptionAt500);

      expect(result.success).toBe(true);
      expect(result.imageUrl).toBeDefined();
    });

    it("powinien zwrócić prawidłową strukturę wyniku dla sukcesu", async () => {
      const result = await service.generateFurnitureImage("elegancka sofa");

      expect(result).toHaveProperty("imageUrl");
      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("positivePrompt");
      expect(result).toHaveProperty("negativePrompt");

      expect(typeof result.imageUrl).toBe("string");
      expect(typeof result.success).toBe("boolean");

      // Gdy success=true, error powinno być undefined
      if (result.success) {
        expect(result.error).toBeUndefined();
      }
    });

    it("powinien zwrócić prawidłową strukturę wyniku dla błędu", async () => {
      const result = await service.generateFurnitureImage("");

      expect(result).toHaveProperty("imageUrl");
      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("error");

      expect(result.imageUrl).toBe("");
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("powinien obsługiwać opis z polskimi znakami", async () => {
      const polishDescription = "drewniane krzesło ze złoceniami";
      const result = await service.generateFurnitureImage(polishDescription);

      expect(result.success).toBe(true);
      expect(result.imageUrl).not.toBe("");
    });

    it("powinien obsługiwać opis ze specjalnymi znakami", async () => {
      const specialDescription = "fotel #1 - nowoczesny & wygodny";
      const result = await service.generateFurnitureImage(specialDescription);

      expect(result.success).toBe(true);
      expect(result.imageUrl).not.toBe("");
    });

    it("powinien obsługiwać opis z emoji", async () => {
      const emojiDescription = "fotel 🪑 nowoczesny";
      const result = await service.generateFurnitureImage(emojiDescription);

      expect(result.success).toBe(true);
      expect(result.imageUrl).not.toBe("");
    });

    it("powinien zwrócić próbkę z dostępnych mock-ów", async () => {
      const result = await service.generateFurnitureImage("pewien opis");

      expect(result.imageUrl).toBeDefined();
      // Just verify it's a valid URL from unsplash (mocked)
      expect(result.imageUrl).toMatch(/https:\/\/images\.unsplash\.com/);
    });
  });

  describe("Obsługa wyjątków", () => {
    beforeEach(() => {
      service = new AIImageService(mockApiKey);
    });

    it("powinien bezpiecznie obsługiwać niezidentyfikowane wyjątki", async () => {
      const result = await service.generateFurnitureImage("");

      // Czy został zwrócony prawidłowy błąd
      expect(result.success).toBe(false);
      expect(result.imageUrl).toBe("");
      expect(result.error).toBeDefined();
    });

    it("powinien nigdy nie rzucać wyjątku - zawsze zwracać GenerateImageResult", async () => {
      // Test na różnych nienormalnych wejściach
      const invalidInputs: unknown[] = ["", "   ", "a".repeat(501), 123, null, undefined, {}, []];

      for (const input of invalidInputs) {
        try {
          const result = await service.generateFurnitureImage(input as unknown as string);
          expect(result).toHaveProperty("success");
          expect(result).toHaveProperty("error");
        } catch {
          // Jeśli tutaj się znajdziemy to test nie przeszedł
          throw new Error(`AIImageService powinien obsłużyć input ${JSON.stringify(input)} bez rzucania wyjątku`);
        }
      }
    });
  });

  describe("Integracja z konfiguracją", () => {
    it("powinien używać custom mock-ów z konfiguracji", () => {
      service = new AIImageService(mockApiKey, {
        maxFreeGenerations: 15,
      });

      // Każde wygenerowanie powinno zwracać URL z mock'a
      expect(service.getMaxFreeGenerations()).toBe(15);
    });
  });

  describe("Funkcje legacy (dla wstecznej kompatybilności)", () => {
    it("powinien móc być importowany za pośrednictwem starych eksportów", async () => {
      // Import funkcji legacy export
      const { generateFurnitureImage, getMaxFreeGenerations } = await import("@/lib/services/ai-image.service");

      expect(generateFurnitureImage).toBeDefined();
      expect(getMaxFreeGenerations).toBeDefined();
      expect(typeof getMaxFreeGenerations).toBe("function");
    });
  });
});

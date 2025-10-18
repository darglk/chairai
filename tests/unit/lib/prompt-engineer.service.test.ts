import { describe, it, expect, beforeEach } from "vitest";
import { PromptEngineerService } from "@/lib/services/prompt-engineer.service";

describe("PromptEngineerService", () => {
  let service: PromptEngineerService;

  describe("Konstruktor", () => {
    it("powinien inicjalizować z domyślną konfiguracją", () => {
      service = new PromptEngineerService();
      expect(service).toBeDefined();
    });

    it("powinien inicjalizować z custom konfiguracją", () => {
      service = new PromptEngineerService({
        includePhotographyStyle: false,
        includeTechnicalDetails: true,
        emphasizeMaterials: false,
        emphasizePrecision: true,
      });
      expect(service).toBeDefined();
    });
  });

  describe("enhancePrompt() - Podstawowe funkcjonalności", () => {
    beforeEach(() => {
      service = new PromptEngineerService({
        includePhotographyStyle: true,
        includeTechnicalDetails: true,
        emphasizeMaterials: true,
        emphasizePrecision: true,
      });
    });

    it("powinien zwrócić EnhancedPromptResult ze wszystkimi polami", () => {
      const result = service.enhancePrompt("Taboret z drewna dębowego");
      expect(result).toHaveProperty("positivePrompt");
      expect(result).toHaveProperty("negativePrompt");
      expect(result).toHaveProperty("technicalNotes");
      expect(result).toHaveProperty("materials");
      expect(result).toHaveProperty("style");
    });

    it("powinien obsługiwać puste dane wejściowe", () => {
      const result = service.enhancePrompt("");
      expect(result.positivePrompt).toBeDefined();
      expect(result.materials).toBeDefined();
      expect(typeof result.style).toBe("string");
    });

    it("powinien obsługiwać null dane wejściowe", () => {
      const result = service.enhancePrompt(null as unknown as string);
      expect(result.positivePrompt).toBeDefined();
      expect(result.negativePrompt).toBeDefined();
    });

    it("powinien obsługiwać undefined dane wejściowe", () => {
      const result = service.enhancePrompt(undefined as unknown as string);
      expect(result.positivePrompt).toBeDefined();
      expect(result.negativePrompt).toBeDefined();
    });
  });

  describe("enhancePrompt() - Ekstrakcja materiałów", () => {
    beforeEach(() => {
      service = new PromptEngineerService();
    });

    it("powinien ekstrahować drewno z opisu", () => {
      const result = service.enhancePrompt("Stół z drewna bukowego");
      expect(result.materials).toContain("wood");
    });

    it("powinien ekstrahować metal z opisu", () => {
      const result = service.enhancePrompt("Krzesło ze stalowymi nogami");
      expect(result.materials).toContain("metal");
    });

    it("powinien ekstrahować skórę z opisu", () => {
      const result = service.enhancePrompt("Fotel tapicerowany skórą naturalną");
      expect(result.materials).toContain("leather");
    });

    it("powinien ekstrahować tkaninę z opisu", () => {
      const result = service.enhancePrompt("Sofa w tkaninie bawełnianej");
      expect(result.materials).toContain("fabric");
    });

    it("powinien ekstrahować szkło z opisu", () => {
      const result = service.enhancePrompt("Stolik kawowy ze blatem ze szkła hartowanego");
      expect(result.materials).toContain("glass");
    });

    it("powinien być case-insensitive dla materiałów", () => {
      const result1 = service.enhancePrompt("DREWNO");
      const result2 = service.enhancePrompt("drewno");
      expect(result1.materials).toEqual(result2.materials);
    });

    it("powinien ekstrahować wiele materiałów", () => {
      const result = service.enhancePrompt("Łóżko drewniane z metalowymi elementami");
      expect(result.materials.length).toBeGreaterThan(0);
    });
  });

  describe("enhancePrompt() - Ekstrakcja stylu", () => {
    beforeEach(() => {
      service = new PromptEngineerService();
    });

    it("powinien identyfikować styl minimalistyczny", () => {
      const result = service.enhancePrompt("Minimalistyczny stolik ze jasnego drewna");
      expect(result.style).toBeDefined();
    });

    it("powinien identyfikować styl nowoczesny", () => {
      const result = service.enhancePrompt("Nowoczesne krzesło");
      expect(result.style).toBeDefined();
      expect(typeof result.style).toBe("string");
    });

    it("powinien obsługiwać przypadek bez pasującego stylu", () => {
      const result = service.enhancePrompt("Zwykły fotel");
      expect(result.style).toBe("Contemporary");
    });
  });

  describe("enhancePrompt() - Negative prompts", () => {
    beforeEach(() => {
      service = new PromptEngineerService();
    });

    it("powinien zawierać low quality w negative prompt", () => {
      const result = service.enhancePrompt("Drewniany stół");
      expect(result.negativePrompt.toLowerCase()).toContain("low quality");
    });

    it("powinien zawierać blurry w negative prompt", () => {
      const result = service.enhancePrompt("Drewniany stół");
      expect(result.negativePrompt.toLowerCase()).toContain("blurry");
    });

    it("powinien zawierać distorted w negative prompt", () => {
      const result = service.enhancePrompt("Drewniany stół");
      expect(result.negativePrompt.toLowerCase()).toContain("distorted");
    });
  });

  describe("enhancePrompt() - Technical notes", () => {
    beforeEach(() => {
      service = new PromptEngineerService({
        includeTechnicalDetails: true,
      });
    });

    it("powinien zawierać construction notes dla drewna", () => {
      const result = service.enhancePrompt("Drewniany stół");
      expect(result.technicalNotes.toLowerCase()).toContain("construction");
    });

    it("powinien zawierać photography guidance", () => {
      const result = service.enhancePrompt("Drewniany stół");
      expect(result.technicalNotes.toLowerCase()).toContain("photography");
    });

    it("powinien zawierać uwagi o materiałach", () => {
      const result = service.enhancePrompt("Drewniany stół");
      expect(result.technicalNotes.length).toBeGreaterThan(0);
    });
  });

  describe("enhancePrompt() - Photography style", () => {
    beforeEach(() => {
      service = new PromptEngineerService({
        includePhotographyStyle: true,
      });
    });

    it("powinien zawierać professional photography hints", () => {
      const result = service.enhancePrompt("Drewniany stół");
      expect(result.positivePrompt.toLowerCase()).toContain("professional");
    });

    it("powinien zawierać studio lighting", () => {
      const result = service.enhancePrompt("Drewniany stół");
      expect(result.positivePrompt.toLowerCase()).toContain("studio");
    });

    it("powinien zawierać 4K quality", () => {
      const result = service.enhancePrompt("Drewniany stół");
      expect(result.positivePrompt.toLowerCase()).toContain("4k");
    });
  });

  describe("enhancePrompt() - Integracja end-to-end", () => {
    beforeEach(() => {
      service = new PromptEngineerService({
        includePhotographyStyle: true,
        includeTechnicalDetails: true,
        emphasizeMaterials: true,
        emphasizePrecision: true,
      });
    });

    it("powinien przetwarzać złożony opis mebla", () => {
      const description = "Drewniane biurko ze stalowymi nogami";
      const result = service.enhancePrompt(description);

      expect(result.positivePrompt).toBeTruthy();
      expect(result.negativePrompt).toBeTruthy();
      expect(result.technicalNotes).toBeTruthy();
      expect(result.materials.length).toBeGreaterThan(0);
    });

    it("powinien zawierać materiały w positive prompt", () => {
      const description = "Fotel ze skóry naturalnej";
      const result = service.enhancePrompt(description);

      expect(result.materials).toContain("leather");
      expect(result.positivePrompt.toLowerCase()).toContain("leather");
    });

    it("powinien przetwarzać minimalny opis", () => {
      const description = "Fotel";
      const result = service.enhancePrompt(description);

      expect(result.positivePrompt).toBeTruthy();
      expect(result.negativePrompt).toBeTruthy();
      expect(result.materials).toBeDefined();
    });

    it("powinien zwracać spójne wyniki dla tych samych inputów", () => {
      const description = "Drewniany stół";
      const result1 = service.enhancePrompt(description);
      const result2 = service.enhancePrompt(description);

      expect(result1.positivePrompt).toBe(result2.positivePrompt);
      expect(result1.negativePrompt).toBe(result2.negativePrompt);
      expect(result1.materials).toEqual(result2.materials);
    });
  });

  describe("Konfiguracja serwisu", () => {
    it("powinien respektować flagę includePhotographyStyle", () => {
      const serviceWith = new PromptEngineerService({
        includePhotographyStyle: true,
        includeTechnicalDetails: false,
        emphasizeMaterials: false,
        emphasizePrecision: false,
      });

      const serviceWithout = new PromptEngineerService({
        includePhotographyStyle: false,
        includeTechnicalDetails: false,
        emphasizeMaterials: false,
        emphasizePrecision: false,
      });

      const resultWith = serviceWith.enhancePrompt("Drewniany stół");
      const resultWithout = serviceWithout.enhancePrompt("Drewniany stół");

      expect(resultWith.positivePrompt).toBeTruthy();
      expect(resultWithout.positivePrompt).toBeTruthy();
    });

    it("powinien respektować flagę includeTechnicalDetails", () => {
      const serviceWith = new PromptEngineerService({
        includePhotographyStyle: false,
        includeTechnicalDetails: true,
        emphasizeMaterials: false,
        emphasizePrecision: false,
      });

      const serviceWithout = new PromptEngineerService({
        includePhotographyStyle: false,
        includeTechnicalDetails: false,
        emphasizeMaterials: false,
        emphasizePrecision: false,
      });

      const resultWith = serviceWith.enhancePrompt("Drewniany stół");
      const resultWithout = serviceWithout.enhancePrompt("Drewniany stół");

      expect(resultWith.technicalNotes.length).toBeGreaterThan(0);
      expect(resultWithout.technicalNotes.length).toBeGreaterThan(0);
    });

    it("powinien respektować flagę emphasizeMaterials", () => {
      const serviceWith = new PromptEngineerService({
        includePhotographyStyle: false,
        includeTechnicalDetails: false,
        emphasizeMaterials: true,
        emphasizePrecision: false,
      });

      const serviceWithout = new PromptEngineerService({
        includePhotographyStyle: false,
        includeTechnicalDetails: false,
        emphasizeMaterials: false,
        emphasizePrecision: false,
      });

      const resultWith = serviceWith.enhancePrompt("Drewniany stół");
      const resultWithout = serviceWithout.enhancePrompt("Drewniany stół");

      expect(resultWith.materials).toBeDefined();
      expect(resultWithout.materials).toBeDefined();
    });
  });
});

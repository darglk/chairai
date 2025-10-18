import { describe, it, expect, beforeAll } from "vitest";
import { OpenRouterImageService } from "@/lib/services/openrouter-image.service";

/**
 * Integration test for OpenRouterImageService
 *
 * Tests actual image generation through OpenRouter API.
 * Requires valid API key with credits.
 *
 * WARNING: This test makes real API calls and will consume credits!
 */

let service: OpenRouterImageService;

describe("OpenRouterImageService - Integration Tests", () => {
  beforeAll(() => {
    const apiKey = process.env.PUBLIC_OPENROUTER_API_KEY;

    if (!apiKey) {
      // eslint-disable-next-line no-console
      console.warn("⚠️  PUBLIC_OPENROUTER_API_KEY not found - skipping integration tests");
      return;
    }

    service = new OpenRouterImageService({ apiKey });
  });

  it.skip("should generate image from simple prompt", async () => {
    if (!service) {
      // eslint-disable-next-line no-console
      console.log("Skipping - API key not configured");
      return;
    }

    const result = await service.generateImage("A modern wooden chair in minimalist style");

    expect(result.success).toBe(true);
    expect(result.imageUrl).toBeTruthy();
    expect(result.modelUsed).toBe("black-forest-labs/flux-pro");
    expect(result.generationTime).toBeGreaterThan(0);
  });

  it.skip("should generate image with negative prompt", async () => {
    if (!service) {
      // eslint-disable-next-line no-console
      console.log("Skipping - API key not configured");
      return;
    }

    const result = await service.generateImage(
      "Luxury leather sofa with gold accents, photorealistic, 4K",
      "blurry, low quality, deformed, cartoon"
    );

    expect(result.success).toBe(true);
    expect(result.imageUrl).toBeTruthy();
  });

  it("should validate prompt before API call", async () => {
    if (!service) {
      // eslint-disable-next-line no-console
      console.log("Skipping - API key not configured");
      return;
    }

    // Empty prompt should fail
    const result = await service.generateImage("");

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("should handle invalid API key gracefully", async () => {
    const invalidService = new OpenRouterImageService({ apiKey: "invalid-key" });

    const result = await invalidService.generateImage("test prompt");

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

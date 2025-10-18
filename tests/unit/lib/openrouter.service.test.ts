/**
 * Unit Tests: OpenRouterService
 *
 * Comprehensive test suite for OpenRouter API service.
 * Tests cover:
 * - Constructor initialization
 * - Prompt generation
 * - Error handling (validation, HTTP, network)
 * - Input validation
 * - Response parsing and validation
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { OpenRouterService } from "@/lib/services/openrouter.service";

// Mock fetch globally
global.fetch = vi.fn();

describe("OpenRouterService", () => {
  const mockApiKey = "test-api-key-12345";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Constructor", () => {
    it("should initialize service with valid API key", () => {
      const service = new OpenRouterService({ apiKey: mockApiKey });
      expect(service).toBeDefined();
    });

    it("should throw error when API key is missing", () => {
      expect(() => {
        new OpenRouterService({ apiKey: "" });
      }).toThrow("OpenRouter API key is required");
    });

    it("should throw error when API key is null", () => {
      expect(() => {
        new OpenRouterService({ apiKey: null as unknown as string });
      }).toThrow("OpenRouter API key is required");
    });

    it("should accept custom base URL", () => {
      const customUrl = "https://custom.api.com";
      const service = new OpenRouterService({
        apiKey: mockApiKey,
        baseUrl: customUrl,
      });
      expect(service).toBeDefined();
    });

    it("should use default base URL when not provided", () => {
      const service = new OpenRouterService({ apiKey: mockApiKey });
      expect(service).toBeDefined();
    });
  });

  describe("generateImagePrompt", () => {
    it("should successfully generate image prompt from user input", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                positivePrompt:
                  "cinematic photo of a comfortable armchair in a modern living room, minimalist design, soft fabric, warm lighting, 4k, photorealistic",
                negativePrompt: "blurry, low quality, cartoon, drawing, ugly, deformed",
              }),
            },
          },
        ],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const service = new OpenRouterService({ apiKey: mockApiKey });
      const result = await service.generateImagePrompt("comfortable armchair");

      expect(result).toHaveProperty("positivePrompt");
      expect(result).toHaveProperty("negativePrompt");
      expect(result.positivePrompt).toContain("armchair");
      expect(result.negativePrompt).toContain("blurry");
    });

    it("should throw ValidationError for empty input", async () => {
      const service = new OpenRouterService({ apiKey: mockApiKey });

      await expect(service.generateImagePrompt("")).rejects.toThrow("User input cannot be empty");
    });

    it("should throw ValidationError for whitespace-only input", async () => {
      const service = new OpenRouterService({ apiKey: mockApiKey });

      await expect(service.generateImagePrompt("   ")).rejects.toThrow("User input cannot contain only whitespace");
    });

    it("should throw ValidationError for input exceeding max length", async () => {
      const service = new OpenRouterService({ apiKey: mockApiKey });
      const longInput = "a".repeat(5001);

      await expect(service.generateImagePrompt(longInput)).rejects.toThrow(
        "User input exceeds maximum length of 5000 characters"
      );
    });

    it("should throw ValidationError for non-string input", async () => {
      const service = new OpenRouterService({ apiKey: mockApiKey });

      await expect(service.generateImagePrompt(123 as unknown as string)).rejects.toThrow(
        "User input must be a string"
      );
    });
  });

  describe("Error Handling", () => {
    describe("HTTP Errors", () => {
      it("should throw HttpError on 400 Bad Request", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({
            error: {
              message: "Invalid request format",
            },
          }),
        });

        const service = new OpenRouterService({ apiKey: mockApiKey });

        await expect(service.generateImagePrompt("test prompt")).rejects.toThrow(/Invalid request/);
      });

      it("should throw HttpError on 401 Unauthorized", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({
            error: {
              message: "Invalid API key",
            },
          }),
        });

        const service = new OpenRouterService({ apiKey: mockApiKey });

        await expect(service.generateImagePrompt("test prompt")).rejects.toThrow(
          /Invalid API key|Authentication failed/
        );
      });

      it("should throw HttpError on 429 Rate Limited", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: async () => ({
            error: {
              message: "Rate limit exceeded",
            },
          }),
        });

        const service = new OpenRouterService({ apiKey: mockApiKey });

        await expect(service.generateImagePrompt("test prompt")).rejects.toThrow(/Rate limit|too many requests/i);
      });

      it("should throw HttpError on 500 Server Error", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({
            error: {
              message: "Internal server error",
            },
          }),
        });

        const service = new OpenRouterService({ apiKey: mockApiKey });

        await expect(service.generateImagePrompt("test prompt")).rejects.toThrow(/server error/i);
      });

      it("should throw HttpError on 503 Service Unavailable", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: async () => ({}),
        });

        const service = new OpenRouterService({ apiKey: mockApiKey });

        await expect(service.generateImagePrompt("test prompt")).rejects.toThrow(/Service.*unavailable/i);
      });

      it("should handle error response with no message", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({}),
        });

        const service = new OpenRouterService({ apiKey: mockApiKey });

        await expect(service.generateImagePrompt("test prompt")).rejects.toThrow(/server error/i);
      });
    });

    describe("Network Errors", () => {
      it("should throw NetworkError on fetch failure", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new TypeError("Failed to fetch"));

        const service = new OpenRouterService({ apiKey: mockApiKey });

        await expect(service.generateImagePrompt("test prompt")).rejects.toThrow(/Network error/i);
      });

      it("should throw NetworkError on connection timeout", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
          new TypeError("The fetch operation timed out")
        );

        const service = new OpenRouterService({ apiKey: mockApiKey });

        await expect(service.generateImagePrompt("test prompt")).rejects.toThrow(/Network error/i);
      });
    });

    describe("Response Validation Errors", () => {
      it("should throw ValidationError when response has no content", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: {} }],
          }),
        });

        const service = new OpenRouterService({ apiKey: mockApiKey });

        await expect(service.generateImagePrompt("test prompt")).rejects.toThrow(
          /does not contain expected message content/i
        );
      });

      it("should throw ValidationError when response content is not JSON", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: "not valid json" } }],
          }),
        });

        const service = new OpenRouterService({ apiKey: mockApiKey });

        await expect(service.generateImagePrompt("test prompt")).rejects.toThrow(/not valid JSON/i);
      });

      it("should throw ValidationError when response missing required fields", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    positivePrompt: "test prompt",
                    // missing negativePrompt
                  }),
                },
              },
            ],
          }),
        });

        const service = new OpenRouterService({ apiKey: mockApiKey });

        await expect(service.generateImagePrompt("test prompt")).rejects.toThrow(/validation failed/i);
      });

      it("should throw ValidationError when positivePrompt is empty", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    positivePrompt: "",
                    negativePrompt: "test",
                  }),
                },
              },
            ],
          }),
        });

        const service = new OpenRouterService({ apiKey: mockApiKey });

        await expect(service.generateImagePrompt("test prompt")).rejects.toThrow(/validation failed/i);
      });

      it("should throw ValidationError when negativePrompt is empty", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    positivePrompt: "test",
                    negativePrompt: "",
                  }),
                },
              },
            ],
          }),
        });

        const service = new OpenRouterService({ apiKey: mockApiKey });

        await expect(service.generateImagePrompt("test prompt")).rejects.toThrow(/validation failed/i);
      });

      it("should handle API error in response body", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            error: {
              message: "API error occurred",
            },
          }),
        });

        const service = new OpenRouterService({ apiKey: mockApiKey });

        await expect(service.generateImagePrompt("test prompt")).rejects.toThrow(/API error/i);
      });
    });
  });

  describe("Request Payload", () => {
    it("should include correct headers in request", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  positivePrompt: "test",
                  negativePrompt: "test",
                }),
              },
            },
          ],
        }),
      });

      const service = new OpenRouterService({ apiKey: mockApiKey });
      await service.generateImagePrompt("test prompt");

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const options = fetchCall[1];

      expect(options.headers.Authorization).toBe(`Bearer ${mockApiKey}`);
      expect(options.headers["Content-Type"]).toBe("application/json");
      expect(options.method).toBe("POST");
    });

    it("should include response_format with json_schema", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  positivePrompt: "test",
                  negativePrompt: "test",
                }),
              },
            },
          ],
        }),
      });

      const service = new OpenRouterService({ apiKey: mockApiKey });
      await service.generateImagePrompt("test prompt");

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body.response_format.type).toBe("json_schema");
      expect(body.response_format.json_schema.schema.properties).toHaveProperty("positivePrompt");
      expect(body.response_format.json_schema.schema.properties).toHaveProperty("negativePrompt");
    });

    it("should include user content in messages", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  positivePrompt: "test",
                  negativePrompt: "test",
                }),
              },
            },
          ],
        }),
      });

      const userPrompt = "comfortable modern armchair";
      const service = new OpenRouterService({ apiKey: mockApiKey });
      await service.generateImagePrompt(userPrompt);

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body.messages).toContainEqual(
        expect.objectContaining({
          role: "user",
          content: userPrompt,
        })
      );
    });
  });

  describe("Successful Responses", () => {
    it("should return parsed prompt object with valid structure", async () => {
      const expectedPrompt = {
        positivePrompt: "detailed furniture description",
        negativePrompt: "blur, low quality",
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify(expectedPrompt),
              },
            },
          ],
        }),
      });

      const service = new OpenRouterService({ apiKey: mockApiKey });
      const result = await service.generateImagePrompt("test prompt");

      expect(result).toEqual(expectedPrompt);
      expect(typeof result.positivePrompt).toBe("string");
      expect(typeof result.negativePrompt).toBe("string");
    });

    it("should handle very long prompts correctly", async () => {
      const longPrompt = "a".repeat(4000); // Valid but long
      const response = {
        positivePrompt: "very detailed prompt: " + longPrompt,
        negativePrompt: "test",
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify(response),
              },
            },
          ],
        }),
      });

      const service = new OpenRouterService({ apiKey: mockApiKey });
      const result = await service.generateImagePrompt(longPrompt);

      expect(result).toEqual(response);
    });

    it("should handle special characters in prompts", async () => {
      const specialPrompt = 'furniture with "quotes", apostrophes\', and émojis 🎨';
      const response = {
        positivePrompt: "beautiful furniture with special characters",
        negativePrompt: "none",
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify(response),
              },
            },
          ],
        }),
      });

      const service = new OpenRouterService({ apiKey: mockApiKey });
      const result = await service.generateImagePrompt(specialPrompt);

      expect(result).toEqual(response);
    });
  });

  describe("Edge Cases", () => {
    it("should handle response with extra fields (should ignore them)", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  positivePrompt: "test",
                  negativePrompt: "test",
                  extraField: "should be ignored",
                  anotherExtra: 123,
                }),
              },
            },
          ],
        }),
      });

      const service = new OpenRouterService({ apiKey: mockApiKey });
      const result = await service.generateImagePrompt("test");

      expect(result).toHaveProperty("positivePrompt");
      expect(result).toHaveProperty("negativePrompt");
      expect((result as Record<string, unknown>).extraField).toBeUndefined();
    });

    it("should call API endpoint correctly", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  positivePrompt: "test",
                  negativePrompt: "test",
                }),
              },
            },
          ],
        }),
      });

      const service = new OpenRouterService({ apiKey: mockApiKey });
      await service.generateImagePrompt("test");

      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/chat/completions"), expect.any(Object));
    });
  });
});

/**
 * OpenRouter Service
 *
 * Service for communicating with the OpenRouter API to generate enhanced
 * image prompts using AI. Transforms user descriptions into detailed,
 * creative prompts optimized for text-to-image models.
 */

import { z } from "zod";
import { imagePromptSchema } from "@/lib/schemas";

// ============================================================================
// Types and Configuration
// ============================================================================

/**
 * Configuration object for OpenRouterService
 */
interface OpenRouterServiceConfig {
  apiKey: string;
  baseUrl?: string;
}

/**
 * Error types for OpenRouter service
 */
class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

class ValidationError extends OpenRouterError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

class HttpError extends OpenRouterError {
  constructor(message: string, status: number, code: string) {
    super(message, code, status);
    this.name = "HttpError";
  }
}

class NetworkError extends OpenRouterError {
  constructor(message: string) {
    super(message, "NETWORK_ERROR");
    this.name = "NetworkError";
  }
}

/**
 * OpenRouter API response structure
 */
interface OpenRouterResponse {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
  error?: {
    message?: string;
  };
}

// ============================================================================
// Configuration Constants
// ============================================================================

const OPENROUTER_CONFIG = {
  MODEL: "anthropic/claude-3.5-sonnet",
  TEMPERATURE: 0.7,
  MAX_TOKENS: 512,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
};

// ============================================================================
// OpenRouterService Class
// ============================================================================

export class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  /**
   * Initialize OpenRouterService with API configuration
   *
   * @param config Configuration object with API key and optional base URL
   * @throws {Error} If API key is not provided
   */
  constructor(config: OpenRouterServiceConfig) {
    if (!config.apiKey) {
      throw new Error("OpenRouter API key is required. Please set OPENROUTER_API_KEY environment variable.");
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://openrouter.ai/api/v1";
  }

  /**
   * Generate an enhanced image prompt from user input
   *
   * Transforms a simple user description into a detailed, creative prompt
   * optimized for AI image generation models, along with a negative prompt
   * to exclude common visual artifacts.
   *
   * @param userContent The user's description of the furniture
   * @returns Promise resolving to an object with positivePrompt and negativePrompt
   * @throws {ValidationError} If the API response cannot be parsed
   * @throws {HttpError} If the API returns an error status
   * @throws {NetworkError} If there's a network communication issue
   */
  async generateImagePrompt(userContent: string): Promise<z.infer<typeof imagePromptSchema>> {
    try {
      // Validate input
      this.validateUserInput(userContent);

      // Build the request payload
      const payload = this.buildRequestPayload(userContent);

      // Make the API request
      const response = await this.createChatCompletion(payload);

      // Parse and validate the response
      const imagePrompt = this.parseAndValidateResponse(response);

      return imagePrompt;
    } catch (error) {
      // Re-throw known errors as-is
      if (error instanceof OpenRouterError) {
        throw error;
      }

      // Wrap unknown errors
      if (error instanceof Error) {
        throw new NetworkError(`Unexpected error: ${error.message}`);
      }

      throw new NetworkError("An unknown error occurred");
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Validate user input before sending to API
   *
   * @param userContent The user's input
   * @throws {ValidationError} If input is invalid
   */
  private validateUserInput(userContent: string): void {
    if (!userContent) {
      throw new ValidationError("User input cannot be empty");
    }

    if (typeof userContent !== "string") {
      throw new ValidationError("User input must be a string");
    }

    if (userContent.trim().length === 0) {
      throw new ValidationError("User input cannot contain only whitespace");
    }

    if (userContent.length > 5000) {
      throw new ValidationError("User input exceeds maximum length of 5000 characters");
    }
  }

  /**
   * Build the complete request payload for OpenRouter API
   *
   * Constructs a properly formatted request object including system instructions,
   * user message, response format schema, and model parameters.
   *
   * @param userContent The user's furniture description
   * @returns Request payload object for the API
   */
  private buildRequestPayload(userContent: string): Record<string, unknown> {
    const systemPrompt = `You are an expert in interior design and creative writing, specializing in crafting detailed prompts for AI image generation models.

Your task: Take a user's furniture description and create TWO things:
1. A positive prompt (detailed, 50-100 words)
2. A negative prompt (20-40 words)

RESPOND EXACTLY IN THIS FORMAT (no markdown, no extra text):
{
  "positivePrompt": "your positive prompt here with specific materials colors textures style",
  "negativePrompt": "blurry low quality cartoon deformed ugly"
}

Example response:
{
  "positivePrompt": "Modern oak dining table, minimalist Scandinavian design, solid light wood top, sleek white steel legs, geometric lines, 8-seater rectangular, natural daylight, photorealistic, 4k",
  "negativePrompt": "blurry, low quality, cartoon, deformed, ugly, distorted, oversaturated"
}`;

    return {
      model: OPENROUTER_CONFIG.MODEL,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userContent,
        },
      ],
      temperature: OPENROUTER_CONFIG.TEMPERATURE,
      max_tokens: OPENROUTER_CONFIG.MAX_TOKENS,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "ImagePrompt",
          schema: {
            type: "object",
            properties: {
              positivePrompt: {
                type: "string",
                description: "Detailed positive prompt for image generation",
              },
              negativePrompt: {
                type: "string",
                description: "Negative prompt to exclude unwanted elements",
              },
            },
            required: ["positivePrompt", "negativePrompt"],
          },
        },
      },
    };
  }

  /**
   * Execute a chat completion request to OpenRouter API
   *
   * Sends the request with proper authentication headers and handles
   * HTTP errors appropriately.
   *
   * @param payload The request payload
   * @returns Promise resolving to the parsed API response
   * @throws {HttpError} If the API returns an error status
   * @throws {NetworkError} If there's a network communication issue
   */
  private async createChatCompletion(payload: Record<string, unknown>): Promise<OpenRouterResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://chairai.local",
          "X-Title": "Chair AI",
        },
        body: JSON.stringify(payload),
      });

      // Handle HTTP errors
      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        const errorMessage =
          ((errorData.error as Record<string, string> | undefined)?.message as string) ||
          this.getHttpErrorMessage(response.status);

        throw new HttpError(
          `OpenRouter API error: ${errorMessage}`,
          response.status,
          this.getHttpErrorCode(response.status)
        );
      }

      // Parse response
      const data = (await response.json()) as OpenRouterResponse;

      // Check for API errors in response body
      if (data.error) {
        throw new HttpError(`OpenRouter API error: ${data.error.message || "Unknown error"}`, 500, "API_ERROR");
      }

      return data;
    } catch (error) {
      // Re-throw known HTTP errors
      if (error instanceof HttpError) {
        throw error;
      }

      // Handle fetch errors (network issues)
      if (error instanceof TypeError) {
        throw new NetworkError(`Network error communicating with OpenRouter API: ${error.message}`);
      }

      // Re-throw OpenRouter errors
      if (error instanceof OpenRouterError) {
        throw error;
      }

      throw new NetworkError(`Failed to communicate with OpenRouter API: ${String(error)}`);
    }
  }

  /**
   * Parse and validate the API response
   *
   * Extracts the message content from the API response and validates it
   * against the imagePromptSchema using Zod.
   *
   * @param response The API response object
   * @returns Parsed and validated image prompt object
   * @throws {ValidationError} If the response cannot be parsed or validated
   */
  private parseAndValidateResponse(response: OpenRouterResponse): z.infer<typeof imagePromptSchema> {
    try {
      // Extract message content
      const messageContent = response.choices?.[0]?.message?.content;

      if (!messageContent) {
        throw new ValidationError("API response does not contain expected message content");
      }

      // eslint-disable-next-line no-console
      console.log("[parseAndValidateResponse] Raw messageContent:", messageContent.substring(0, 500));

      // Parse JSON from message content
      let parsedContent: unknown;
      try {
        // Remove markdown code blocks if present
        let jsonString = messageContent.trim();

        // Try to extract JSON from markdown code block if present
        const jsonBlockMatch = jsonString.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
        if (jsonBlockMatch && jsonBlockMatch[1]) {
          jsonString = jsonBlockMatch[1].trim();
          // eslint-disable-next-line no-console
          console.log("[parseAndValidateResponse] Extracted from markdown block");
        }

        // Try to extract JSON object if text contains it
        const objectMatch = jsonString.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          jsonString = objectMatch[0];
        }

        // eslint-disable-next-line no-console
        console.log("[parseAndValidateResponse] JSON string to parse:", jsonString.substring(0, 300));

        parsedContent = JSON.parse(jsonString);
        // eslint-disable-next-line no-console
        console.log(
          "[parseAndValidateResponse] Successfully parsed JSON:",
          JSON.stringify(parsedContent).substring(0, 300)
        );
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[parseAndValidateResponse] JSON parse error:", error);
        throw new ValidationError("API response content is not valid JSON");
      }

      // Validate against schema
      const validatedPrompt = imagePromptSchema.parse(parsedContent);

      return validatedPrompt;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.errors.map((err) => `${String(err.path.join("."))}: ${err.message}`).join("; ");
        throw new ValidationError(`API response validation failed: ${fieldErrors}`);
      }

      if (error instanceof ValidationError) {
        throw error;
      }

      throw new ValidationError(`Failed to parse API response: ${String(error)}`);
    }
  }

  /**
   * Get a human-readable error message for HTTP status code
   *
   * @param status HTTP status code
   * @returns Error message
   */
  private getHttpErrorMessage(status: number): string {
    const messages: Record<number, string> = {
      400: "Invalid request - please check your input",
      401: "Authentication failed - invalid API key",
      429: "Rate limit exceeded - please try again later",
      500: "OpenRouter API server error",
      503: "OpenRouter API service temporarily unavailable",
    };

    return messages[status] || `HTTP ${status} error`;
  }

  /**
   * Get an error code for HTTP status
   *
   * @param status HTTP status code
   * @returns Error code
   */
  private getHttpErrorCode(status: number): string {
    const codes: Record<number, string> = {
      400: "BAD_REQUEST",
      401: "UNAUTHORIZED",
      429: "RATE_LIMITED",
      500: "SERVER_ERROR",
      503: "SERVICE_UNAVAILABLE",
    };

    return codes[status] || "HTTP_ERROR";
  }
}

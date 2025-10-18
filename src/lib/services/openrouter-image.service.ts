/**
 * OpenRouter Image Generation Service
 *
 * Generates furniture images using OpenRouter's image generation models (Gemini Image Gen, etc).
 * Uses the /chat/completions endpoint with image modality support.
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

interface OpenRouterImageServiceConfig {
  apiKey: string;
  baseUrl?: string;
}

interface ImageGenerationResult {
  imageUrl: string;
  modelUsed: string;
  generationTime: number;
  success: boolean;
  error?: string;
}

interface ChatCompletionMessage {
  role: string;
  content: string;
  images?: {
    type: string;
    image_url: {
      url: string;
    };
  }[];
}

interface ChatCompletionResponse {
  choices?: {
    message?: ChatCompletionMessage;
  }[];
  error?: {
    message?: string;
    code?: string;
  };
}

// ============================================================================
// Error Classes
// ============================================================================

class OpenRouterImageError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = "OpenRouterImageError";
  }
}

class ValidationError extends OpenRouterImageError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

class HttpError extends OpenRouterImageError {
  constructor(
    message: string,
    public readonly status: number,
    code: string
  ) {
    super(message, code);
    this.name = "HttpError";
  }
}

class NetworkError extends OpenRouterImageError {
  constructor(message: string) {
    super(message, "NETWORK_ERROR");
    this.name = "NetworkError";
  }
}

// ============================================================================
// Configuration
// ============================================================================

const OPENROUTER_IMAGE_CONFIG = {
  // Use Gemini Image Generation model available on OpenRouter
  MODEL: "google/gemini-2.5-flash-image-preview",
  // This model supports image generation with modalities parameter
  // See: https://openrouter.ai/docs/features/multimodal/image-generation

  TIMEOUT_MS: 120000, // 2 minutes for image generation
  ASPECT_RATIO: "1:1", // 1024x1024 square
};

// ============================================================================
// OpenRouterImageService Class
// ============================================================================

export class OpenRouterImageService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  /**
   * Initialize OpenRouterImageService with API configuration
   *
   * @param config Configuration object with API key
   * @throws {Error} If API key is not provided
   */
  constructor(config: OpenRouterImageServiceConfig) {
    if (!config.apiKey) {
      throw new Error("OpenRouter API key is required");
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://openrouter.ai/api/v1";
  }

  /**
   * Generate an image from a prompt using OpenRouter with Gemini Image Generation
   *
   * @param prompt The enhanced positive prompt for image generation
   * @param negativePrompt Optional negative prompt to exclude elements (may not be used by all models)
   * @returns Promise resolving to an ImageGenerationResult
   * @throws {ValidationError} If the prompt is invalid
   * @throws {HttpError} If the API returns an error
   * @throws {NetworkError} If there's a network issue
   */
  async generateImage(prompt: string, negativePrompt?: string): Promise<ImageGenerationResult> {
    const startTime = performance.now();

    try {
      this.validatePrompt(prompt);

      // Combine prompts for better results
      const combinedPrompt = this.combineProfessionalPrompt(prompt, negativePrompt);
      const payload = this.buildRequestPayload(combinedPrompt);
      const response = await this.callChatAPI(payload);
      const imageUrl = this.extractImageUrl(response);

      const generationTime = Math.round(performance.now() - startTime);

      return {
        imageUrl,
        modelUsed: OPENROUTER_IMAGE_CONFIG.MODEL,
        generationTime,
        success: true,
      };
    } catch (error) {
      const generationTime = Math.round(performance.now() - startTime);

      // eslint-disable-next-line no-console
      console.error("[OpenRouterImageService] Generation failed:", error);

      if (error instanceof OpenRouterImageError) {
        return {
          imageUrl: "",
          modelUsed: OPENROUTER_IMAGE_CONFIG.MODEL,
          generationTime,
          success: false,
          error: error.message,
        };
      }

      if (error instanceof Error) {
        return {
          imageUrl: "",
          modelUsed: OPENROUTER_IMAGE_CONFIG.MODEL,
          generationTime,
          success: false,
          error: error.message,
        };
      }

      return {
        imageUrl: "",
        modelUsed: OPENROUTER_IMAGE_CONFIG.MODEL,
        generationTime,
        success: false,
        error: "Unknown error occurred",
      };
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Validate the prompt before sending to API
   *
   * @param prompt The prompt to validate
   * @throws {ValidationError} If prompt is invalid
   */
  private validatePrompt(prompt: string): void {
    if (!prompt) {
      throw new ValidationError("Prompt cannot be empty");
    }

    if (typeof prompt !== "string") {
      throw new ValidationError("Prompt must be a string");
    }

    if (prompt.trim().length === 0) {
      throw new ValidationError("Prompt cannot contain only whitespace");
    }

    if (prompt.length > 2000) {
      throw new ValidationError("Prompt exceeds maximum length of 2000 characters");
    }
  }

  /**
   * Combine positive and negative prompts into a professional prompt format
   *
   * @param positivePrompt The positive prompt describing what to generate
   * @param negativePrompt Optional negative prompt describing what to avoid
   * @returns Combined professional prompt
   */
  private combineProfessionalPrompt(positivePrompt: string, negativePrompt?: string): string {
    let combined = `Generate a professional, high-quality furniture image:\n${positivePrompt}`;

    if (negativePrompt && negativePrompt.trim()) {
      combined += `\n\nAvoid: ${negativePrompt}`;
    }

    combined +=
      "\n\nRequirements: photorealistic, professional photography, well-lit, high resolution, product photography quality";

    return combined;
  }

  /**
   * Build the request payload for the chat completions API with image generation
   *
   * @param prompt The combined prompt with positive and negative guidance
   * @returns Request payload object
   */
  private buildRequestPayload(prompt: string): Record<string, unknown> {
    return {
      model: OPENROUTER_IMAGE_CONFIG.MODEL,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      // Enable image generation modality
      modalities: ["image", "text"],
      // Aspect ratio for Gemini models
      image_config: {
        aspect_ratio: OPENROUTER_IMAGE_CONFIG.ASPECT_RATIO,
      },
    };
  }

  /**
   * Call the OpenRouter chat completions API with image generation enabled
   *
   * @param payload The request payload
   * @returns Promise resolving to the API response
   * @throws {HttpError} If the API returns an error
   * @throws {NetworkError} If there's a network issue
   */
  private async callChatAPI(payload: Record<string, unknown>): Promise<ChatCompletionResponse> {
    try {
      // eslint-disable-next-line no-console
      console.log("[OpenRouterImageService] Calling chat API with model:", OPENROUTER_IMAGE_CONFIG.MODEL);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), OPENROUTER_IMAGE_CONFIG.TIMEOUT_MS);

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
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

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
        const data = (await response.json()) as ChatCompletionResponse;

        // Check for API errors in response body
        if (data.error) {
          throw new HttpError(
            `OpenRouter API error: ${data.error.message || "Unknown error"}`,
            500,
            data.error.code || "API_ERROR"
          );
        }

        return data;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      // Re-throw known errors
      if (error instanceof OpenRouterImageError) {
        throw error;
      }

      // Handle timeout
      if (error instanceof Error && error.name === "AbortError") {
        throw new NetworkError("Image generation request timed out (exceeded 120 seconds)");
      }

      // Handle fetch errors
      if (error instanceof TypeError) {
        throw new NetworkError(`Network error communicating with OpenRouter API: ${error.message}`);
      }

      throw new NetworkError(`Failed to communicate with OpenRouter API: ${String(error)}`);
    }
  }

  /**
   * Extract the image URL from the chat completion response
   *
   * Images are returned in the assistant message in base64 format
   *
   * @param response The chat completion response
   * @returns The image URL (base64 data URL)
   * @throws {ValidationError} If the image cannot be extracted
   */
  private extractImageUrl(response: ChatCompletionResponse): string {
    if (!response.choices || response.choices.length === 0) {
      throw new ValidationError("API response does not contain choices");
    }

    const message = response.choices[0].message;

    if (!message) {
      throw new ValidationError("API response does not contain message");
    }

    if (!message.images || message.images.length === 0) {
      throw new ValidationError(`API response does not contain images. Message content: ${message.content}`);
    }

    const imageUrl = message.images[0]?.image_url?.url;

    if (!imageUrl) {
      throw new ValidationError("API response does not contain valid image URL");
    }

    // eslint-disable-next-line no-console
    console.log("[OpenRouterImageService] Successfully extracted image URL, length:", imageUrl.length);

    return imageUrl;
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
      402: "Insufficient credits - please add funds to your OpenRouter account",
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
      402: "INSUFFICIENT_CREDITS",
      429: "RATE_LIMITED",
      500: "SERVER_ERROR",
      503: "SERVICE_UNAVAILABLE",
    };

    return codes[status] || "HTTP_ERROR";
  }
}

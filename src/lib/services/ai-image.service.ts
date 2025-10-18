/**
 * AI Image Generation Service
 *
 * Service for generating furniture images using AI.
 * Orchestrates the image generation workflow by:
 * 1. Enhancing user prompts using OpenRouter LLM
 * 2. Generating images based on enhanced prompts
 * 3. Managing generation quotas and tracking
 */

import { OpenRouterService } from "./openrouter.service";
import { imagePromptSchema } from "@/lib/schemas";
import { z } from "zod";

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Result of image generation operation
 */
export interface GenerateImageResult {
  imageUrl: string;
  success: boolean;
  error?: string;
  positivePrompt?: string;
  negativePrompt?: string;
}

/**
 * Furniture image generation service
 */
export class AIImageService {
  private readonly openrouterService: OpenRouterService;
  private readonly config: AIImageServiceConfig;

  // ============================================================================
  // Configuration
  // ============================================================================

  private static readonly DEFAULT_CONFIG: AIImageServiceConfig = {
    maxFreeGenerations: 10,
    generationTimeout: 30000,
    mockImagesEnabled: false,
    mockImages: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80",
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&q=80",
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80",
      "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&q=80",
      "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=800&q=80",
    ],
  };

  /**
   * Initialize AIImageService
   *
   * @param openrouterApiKey API key for OpenRouter service
   * @param config Optional configuration overrides
   * @throws {Error} If openrouterApiKey is not provided
   */
  constructor(openrouterApiKey: string, config?: Partial<AIImageServiceConfig>) {
    if (!openrouterApiKey) {
      throw new Error("OpenRouter API key is required for AIImageService");
    }

    this.openrouterService = new OpenRouterService({ apiKey: openrouterApiKey });
    this.config = { ...AIImageService.DEFAULT_CONFIG, ...config };
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Generate a furniture image based on user description
   *
   * Workflow:
   * 1. Validates user input
   * 2. Enhances prompt using OpenRouter LLM
   * 3. Generates image based on enhanced prompt
   * 4. Returns image URL or error
   *
   * @param userDescription - User's description of the furniture
   * @returns Promise with generated image URL and metadata
   * @throws {Error} If API requests fail or input is invalid
   */
  async generateFurnitureImage(userDescription: string): Promise<GenerateImageResult> {
    try {
      // Validate input
      this.validateUserInput(userDescription);

      // Generate enhanced prompt using OpenRouter
      const enhancedPrompt = await this.generateEnhancedPrompt(userDescription);

      // For now, return mock image URL (in production, would generate actual image)
      const mockImageUrl = this.getMockImageUrl(enhancedPrompt.positivePrompt);

      return {
        imageUrl: mockImageUrl,
        success: true,
        positivePrompt: enhancedPrompt.positivePrompt,
        negativePrompt: enhancedPrompt.negativePrompt,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Nieznany błąd podczas generowania obrazu";

      return {
        imageUrl: "",
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get the maximum number of free generations allowed per client
   *
   * @returns Maximum number of free generations
   */
  getMaxFreeGenerations(): number {
    return this.config.maxFreeGenerations;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Validate user input before processing
   *
   * @param userDescription User's furniture description
   * @throws {Error} If input is invalid
   */
  private validateUserInput(userDescription: string): void {
    if (!userDescription) {
      throw new Error("Opis mebla nie może być pusty");
    }

    if (typeof userDescription !== "string") {
      throw new Error("Opis mebla musi być tekstem");
    }

    if (userDescription.trim().length === 0) {
      throw new Error("Opis mebla nie może zawierać tylko spacje");
    }

    if (userDescription.length > 500) {
      throw new Error("Opis mebla nie może być dłuższy niż 500 znaków");
    }
  }

  /**
   * Generate enhanced prompt using OpenRouter
   *
   * Takes a simple user description and transforms it into detailed,
   * creative prompts optimized for image generation.
   *
   * @param userDescription User's furniture description
   * @returns Enhanced positive and negative prompts
   * @throws {Error} If OpenRouter API request fails
   */
  private async generateEnhancedPrompt(userDescription: string): Promise<z.infer<typeof imagePromptSchema>> {
    try {
      const enhancedPrompt = await this.openrouterService.generateImagePrompt(userDescription);
      return enhancedPrompt;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Błąd podczas generowania ulepszenia prompt'u";
      throw new Error(`Nie udało się wygenerować prompt'u: ${errorMessage}`);
    }
  }

  /**
   * Get a mock image URL for development
   *
   * Uses a hash of the positive prompt to select a consistent mock image.
   *
   * @param positivePrompt The positive prompt to hash
   * @returns Mock image URL
   */
  private getMockImageUrl(positivePrompt: string): string {
    const hash = positivePrompt.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const imageIndex = hash % this.config.mockImages.length;
    return this.config.mockImages[imageIndex];
  }
}

// ============================================================================
// Configuration Interface
// ============================================================================

interface AIImageServiceConfig {
  maxFreeGenerations: number;
  generationTimeout: number;
  mockImagesEnabled: boolean;
  mockImages: string[];
}

const DEFAULT_MAX_FREE_GENERATIONS = 10;

// ============================================================================
// Legacy Function Exports (for backward compatibility)
// ============================================================================

/**
 * Generate furniture image using AI (legacy function export)
 *
 * @deprecated Use AIImageService class instead
 * @param prompt - Text description of the furniture to generate
 * @returns Promise with image URL or error
 */
export async function generateFurnitureImage(prompt: string): Promise<GenerateImageResult> {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return {
      imageUrl: "",
      success: false,
      error: "OpenRouter API key is not configured",
    };
  }

  try {
    const service = new AIImageService(apiKey);
    return await service.generateFurnitureImage(prompt);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Nieznany błąd podczas generowania obrazu";
    return {
      imageUrl: "",
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get the maximum number of free generations (legacy function export)
 *
 * @deprecated Use AIImageService class instead
 * @returns Maximum number of free generations
 */
export function getMaxFreeGenerations(): number {
  return DEFAULT_MAX_FREE_GENERATIONS;
}

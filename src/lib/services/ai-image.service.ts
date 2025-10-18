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
import { OpenRouterImageService } from "./openrouter-image.service";
import { PromptEngineerService } from "./prompt-engineer.service";
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
  private readonly openrouterImageService: OpenRouterImageService;
  private readonly promptEngineer: PromptEngineerService;
  private readonly config: AIImageServiceConfig;

  // ============================================================================
  // Configuration
  // ============================================================================

  private static readonly DEFAULT_CONFIG: AIImageServiceConfig = {
    maxFreeGenerations: 10,
    generationTimeout: 30000,
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
    this.openrouterImageService = new OpenRouterImageService({ apiKey: openrouterApiKey });
    this.promptEngineer = new PromptEngineerService({
      includePhotographyStyle: true,
      includeTechnicalDetails: true,
      emphasizeMaterials: true,
      emphasizePrecision: true,
    });
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

      // Generate actual image using OpenRouter Image Generation API
      const generationResult = await this.openrouterImageService.generateImage(
        enhancedPrompt.positivePrompt,
        enhancedPrompt.negativePrompt
      );

      if (!generationResult.success) {
        return {
          imageUrl: "",
          success: false,
          error: generationResult.error || "Nie udało się wygenerować obrazu",
          positivePrompt: enhancedPrompt.positivePrompt,
          negativePrompt: enhancedPrompt.negativePrompt,
        };
      }

      return {
        imageUrl: generationResult.imageUrl,
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
   * Generate enhanced prompt using PromptEngineerService and OpenRouter
   *
   * Process:
   * 1. Use PromptEngineerService to locally enhance the user description
   * 2. Send the enhanced description to OpenRouter for AI refinement
   * 3. Return the final prompt pair for image generation
   *
   * @param userDescription User's furniture description
   * @returns Enhanced positive and negative prompts
   * @throws {Error} If OpenRouter API request fails
   */
  private async generateEnhancedPrompt(userDescription: string): Promise<z.infer<typeof imagePromptSchema>> {
    try {
      // Step 1: Local enhancement using PromptEngineerService
      const localEnhancement = this.promptEngineer.enhancePrompt(userDescription);

      // Step 2: Use OpenRouter to further refine the prompt
      // Send the locally enhanced prompt for AI refinement
      const openrouterRefined = await this.openrouterService.generateImagePrompt(
        `${userDescription}\n\nDesign context: ${localEnhancement.style} style, Materials: ${localEnhancement.materials.join(", ")}`
      );

      // Step 3: Combine both enhancements
      // Use OpenRouter's response as primary, with our technical guidance
      return {
        positivePrompt: `${openrouterRefined.positivePrompt}\n${localEnhancement.technicalNotes}`,
        negativePrompt: openrouterRefined.negativePrompt,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Błąd podczas generowania ulepszenia prompt'u";
      throw new Error(`Nie udało się wygenerować prompt'u: ${errorMessage}`);
    }
  }
}

// ============================================================================
// Configuration Interface
// ============================================================================

interface AIImageServiceConfig {
  maxFreeGenerations: number;
  generationTimeout: number;
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
  const apiKey = import.meta.env.PUBLIC_OPENROUTER_API_KEY;

  // eslint-disable-next-line no-console
  console.log("[generateFurnitureImage] PUBLIC_OPENROUTER_API_KEY:", !!apiKey);

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

/**
 * AI Image Generation Service
 *
 * Service for generating furniture images using AI.
 * Currently uses a mock implementation for development.
 * TODO: Integrate with real AI service (e.g., DALL-E, Stable Diffusion)
 */

/**
 * Configuration for AI image generation
 */
const AI_IMAGE_CONFIG = {
  // Maximum number of free generations per client
  MAX_FREE_GENERATIONS: 10,
  // Timeout for AI generation request (in milliseconds)
  GENERATION_TIMEOUT: 30000,
  // Mock image URLs for development
  MOCK_IMAGES: [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80",
    "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&q=80",
    "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80",
    "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&q=80",
    "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=800&q=80",
  ],
};

export interface GenerateImageResult {
  imageUrl: string;
  success: boolean;
  error?: string;
}

/**
 * Generate furniture image using AI based on text prompt
 *
 * @param prompt - Text description of the furniture to generate
 * @returns Promise with image URL or error
 */
export async function generateFurnitureImage(prompt: string): Promise<GenerateImageResult> {
  try {
    // TODO: Replace with actual AI service integration
    // For now, return a mock image URL based on prompt hash

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Generate a pseudo-random index based on prompt
    const hash = prompt.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const imageIndex = hash % AI_IMAGE_CONFIG.MOCK_IMAGES.length;
    const imageUrl = AI_IMAGE_CONFIG.MOCK_IMAGES[imageIndex];

    return {
      imageUrl,
      success: true,
    };
  } catch (error) {
    // Log error for debugging (in production, use proper logging service)

    return {
      imageUrl: "",
      success: false,
      error: error instanceof Error ? error.message : "Nieznany błąd podczas generowania obrazu",
    };
  }
}

/**
 * Get the maximum number of free generations allowed per client
 */
export function getMaxFreeGenerations(): number {
  return AI_IMAGE_CONFIG.MAX_FREE_GENERATIONS;
}

/**
 * Generate Image API Endpoint
 *
 * POST /api/images/generate
 * Generates furniture image using AI based on text prompt.
 * Workflow:
 * 1. Authenticates user
 * 2. Checks rate limits
 * 3. Validates prompt
 * 4. Enhances prompt using OpenRouter
 * 5. Generates image
 * 6. Saves to database
 */

import type { APIRoute } from "astro";
import { GenerateImageSchema } from "@/lib/schemas";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-utils";
import { AIImageService } from "@/lib/services/ai-image.service";
import { checkImageGenerationRateLimit } from "@/lib/rate-limit";
import { ZodError } from "zod";
import type { GenerateImageResponseDTO } from "@/types";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return createErrorResponse("UNAUTHORIZED", "Musisz być zalogowany, aby generować obrazy", 401);
    }

    // Get client IP address for rate limiting
    const xForwardedFor = context.request.headers.get("x-forwarded-for");
    const clientIp = xForwardedFor ?? context.request.headers.get("client-ip") ?? "unknown";

    // Check rate limit
    const rateLimitResult = checkImageGenerationRateLimit(user.id, clientIp);
    if (!rateLimitResult.allowed) {
      return createErrorResponse(
        "RATE_LIMIT_EXCEEDED",
        `Zbyt wiele żądań. Spróbuj ponownie za ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)} sekund`,
        429
      );
    }

    // Get user role from database
    const { data: userData, error: userError } = await context.locals.supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return createErrorResponse("USER_NOT_FOUND", "Nie znaleziono użytkownika", 404);
    }

    // Only clients can generate images
    if (userData.role !== "client") {
      return createErrorResponse("FORBIDDEN", "Tylko klienci mogą generować obrazy", 403);
    }

    // Parse and validate request body
    const body = await context.request.json();
    const validatedData = GenerateImageSchema.parse(body);

    // Count existing generated images for user
    const { count, error: countError } = await context.locals.supabase
      .from("generated_images")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (countError) {
      return createErrorResponse("DATABASE_ERROR", "Nie udało się sprawdzić liczby wygenerowanych obrazów", 500);
    }

    // Get max generations for user
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return createErrorResponse("CONFIGURATION_ERROR", "Usługa generowania obrazów jest niedostępna", 503);
    }

    const aiImageService = new AIImageService(apiKey);
    const maxGenerations = aiImageService.getMaxFreeGenerations();
    const remainingGenerations = maxGenerations - (count ?? 0);

    // Check if user has reached generation limit
    if (remainingGenerations <= 0) {
      return createErrorResponse(
        "GENERATION_LIMIT_REACHED",
        `Osiągnięto limit ${maxGenerations} darmowych generacji`,
        429
      );
    }

    // Generate image with enhanced prompt using AI service
    const aiResult = await aiImageService.generateFurnitureImage(validatedData.prompt);

    if (!aiResult.success || !aiResult.imageUrl) {
      return createErrorResponse("AI_GENERATION_FAILED", aiResult.error || "Nie udało się wygenerować obrazu", 503);
    }

    // Prepare database entry with original and enhanced prompts
    const databaseEntry = {
      user_id: user.id,
      prompt: validatedData.prompt,
      enhanced_positive_prompt: aiResult.positivePrompt || validatedData.prompt,
      enhanced_negative_prompt: aiResult.negativePrompt || "",
      image_url: aiResult.imageUrl,
    };

    // Save generated image to database
    const { data: imageData, error: insertError } = await context.locals.supabase
      .from("generated_images")
      .insert(databaseEntry)
      .select()
      .single();

    if (insertError || !imageData) {
      return createErrorResponse("DATABASE_ERROR", "Nie udało się zapisać wygenerowanego obrazu", 500);
    }

    // Check if image is used in any project
    const { count: projectCount } = await context.locals.supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("generated_image_id", imageData.id);

    // Prepare response
    const response: GenerateImageResponseDTO = {
      id: imageData.id,
      user_id: imageData.user_id,
      prompt: imageData.prompt,
      image_url: imageData.image_url,
      created_at: imageData.created_at,
      is_used: (projectCount ?? 0) > 0,
      remaining_generations: remainingGenerations - 1,
    };

    return createSuccessResponse(response, 201);
  } catch (error) {
    // Handle validation errors from Zod
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};

      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });

      return createErrorResponse("VALIDATION_ERROR", "Błąd walidacji danych", 422, fieldErrors);
    }

    // Handle API errors
    if (error instanceof Error) {
      const errorMessage = error.message;
      if (errorMessage.includes("rate limit") || errorMessage.includes("RATE_LIMITED")) {
        return createErrorResponse("RATE_LIMITED", "Zbyt wiele żądań. Spróbuj ponownie później.", 429);
      }
      if (errorMessage.includes("UNAUTHORIZED")) {
        return createErrorResponse("API_UNAUTHORIZED", "Błąd autentykacji z usługą AI", 503);
      }
    }

    // Handle unexpected errors
    return createErrorResponse("INTERNAL_ERROR", "Wystąpił błąd serwera. Spróbuj ponownie później.", 500);
  }
};

/**
 * Image Generation API Endpoint - POST /api/images/generate
 *
 * Enables authenticated clients to generate AI-powered furniture images.
 *
 * AUTHENTICATION: Required (Supabase Auth token)
 * AUTHORIZATION: Only users with role "client" can generate images
 * RATE LIMITING: Limited by user's generation quota (default: 10 per month)
 *
 * WORKFLOW:
 * 1. Extract and validate authentication token
 * 2. Fetch user data and verify authentication
 * 3. Check rate limiting / generation quota
 * 4. Verify user role is "client"
 * 5. Validate request body (prompt: 10-500 characters)
 * 6. Generate enhanced prompt using OpenRouter AI
 * 7. Generate image based on enhanced prompt
 * 8. Upload image to Supabase Storage
 * 9. Save metadata to database (generated_images table)
 * 10. Return 201 Created with image data and remaining quota
 *
 * REQUEST BODY:
 * {
 *   "prompt": "A modern oak dining table with metal legs"
 * }
 *
 * SUCCESS RESPONSE (201 Created):
 * {
 *   "id": "550e8400-e29b-41d4-a716-446655440000",
 *   "user_id": "user-123",
 *   "prompt": "A modern oak dining table with metal legs",
 *   "image_url": "https://...",
 *   "created_at": "2025-10-18T12:30:45Z",
 *   "is_used": false,
 *   "remaining_generations": 9
 * }
 *
 * ERROR RESPONSES:
 * - 400 Bad Request: Invalid JSON body
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 403 Forbidden: User role is not "client" or quota exceeded
 * - 404 Not Found: User not found
 * - 422 Unprocessable Entity: Validation error (prompt length)
 * - 429 Too Many Requests: Rate limit exceeded or quota reached
 * - 500 Internal Server Error: Database or unexpected errors
 * - 503 Service Unavailable: AI service (OpenRouter) unavailable
 */

import type { APIRoute } from "astro";
import { GenerateImageSchema } from "@/lib/schemas";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-utils";
import { AIImageService } from "@/lib/services/ai-image.service";
import { checkImageGenerationRateLimit } from "@/lib/rate-limit";
import { ZodError } from "zod";
import type { GenerateImageResponseDTO } from "@/types";

export const prerender = false;

/**
 * POST handler for image generation endpoint.
 *
 * Implements the complete workflow for AI image generation:
 * authentication → validation → rate limiting → generation → persistence
 *
 * @param context - Astro APIContext containing request, locals (Supabase client), and cookies
 * @returns Response with 201 status and image data, or error response with appropriate status code
 *
 * @throws {Error} Unexpected errors are caught and returned as 500 Internal Server Error
 */
export const POST: APIRoute = async (context) => {
  try {
    // ========================================================================
    // STEP 1: Authentication
    // Verify user is logged in using Supabase Auth token from context
    // ========================================================================

    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return createErrorResponse("UNAUTHORIZED", "Musisz być zalogowany, aby generować obrazy", 401);
    }

    // ========================================================================
    // STEP 2: Rate Limiting
    // Check if user has exceeded rate limit for this request
    // ========================================================================

    const xForwardedFor = context.request.headers.get("x-forwarded-for");
    const clientIp = xForwardedFor ?? context.request.headers.get("client-ip") ?? "unknown";

    const rateLimitResult = checkImageGenerationRateLimit(user.id, clientIp);
    if (!rateLimitResult.allowed) {
      return createErrorResponse(
        "RATE_LIMIT_EXCEEDED",
        `Zbyt wiele żądań. Spróbuj ponownie za ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)} sekund`,
        429
      );
    }

    // ========================================================================
    // STEP 3: Authorization - Role Check
    // Verify user has "client" role (only clients can generate images)
    // ========================================================================

    const { data: userData, error: userError } = await context.locals.supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return createErrorResponse("USER_NOT_FOUND", "Nie znaleziono użytkownika", 404);
    }

    if (userData.role !== "client") {
      return createErrorResponse("FORBIDDEN", "Tylko klienci mogą generować obrazy", 403);
    }

    // ========================================================================
    // STEP 4: Input Validation
    // Parse and validate request body using Zod schema
    // ========================================================================

    const body = await context.request.json();
    const validatedData = GenerateImageSchema.parse(body);

    // ========================================================================
    // STEP 5: Check Generation Quota
    // Count existing generated images and verify user hasn't exceeded limit
    // ========================================================================

    const { count, error: countError } = await context.locals.supabase
      .from("generated_images")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (countError) {
      return createErrorResponse("DATABASE_ERROR", "Nie udało się sprawdzić liczby wygenerowanych obrazów", 500);
    }

    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return createErrorResponse("CONFIGURATION_ERROR", "Usługa generowania obrazów jest niedostępna", 503);
    }

    const aiImageService = new AIImageService(apiKey);
    const maxGenerations = aiImageService.getMaxFreeGenerations();
    const remainingGenerations = maxGenerations - (count ?? 0);

    if (remainingGenerations <= 0) {
      return createErrorResponse(
        "GENERATION_LIMIT_REACHED",
        `Osiągnięto limit ${maxGenerations} darmowych generacji`,
        429
      );
    }

    // ========================================================================
    // STEP 6: AI Image Generation
    // Generate enhanced prompt and create image using OpenRouter service
    // ========================================================================

    const aiResult = await aiImageService.generateFurnitureImage(validatedData.prompt);

    if (!aiResult.success || !aiResult.imageUrl) {
      return createErrorResponse("AI_GENERATION_FAILED", aiResult.error || "Nie udało się wygenerować obrazu", 503);
    }

    // ========================================================================
    // STEP 7: Persist to Database
    // Save generated image metadata to the generated_images table
    // ========================================================================

    const databaseEntry = {
      user_id: user.id,
      prompt: validatedData.prompt,
      enhanced_positive_prompt: aiResult.positivePrompt || validatedData.prompt,
      enhanced_negative_prompt: aiResult.negativePrompt || "",
      image_url: aiResult.imageUrl,
    };

    const { data: imageData, error: insertError } = await context.locals.supabase
      .from("generated_images")
      .insert(databaseEntry)
      .select()
      .single();

    if (insertError || !imageData) {
      return createErrorResponse("DATABASE_ERROR", "Nie udało się zapisać wygenerowanego obrazu", 500);
    }

    // ========================================================================
    // STEP 8: Check Image Usage
    // Determine if this image is already used in any project
    // ========================================================================

    const { count: projectCount } = await context.locals.supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("generated_image_id", imageData.id);

    // ========================================================================
    // STEP 9: Build Response
    // Return GenerateImageResponseDTO with image data and remaining quota
    // ========================================================================

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
    // ========================================================================
    // ERROR HANDLING
    // Process different error types and return appropriate HTTP responses
    // ========================================================================

    // Validation errors from Zod schema
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};

      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });

      return createErrorResponse("VALIDATION_ERROR", "Błąd walidacji danych", 422, fieldErrors);
    }

    // Handle API and service errors with specific patterns
    if (error instanceof Error) {
      const errorMessage = error.message;

      // Rate limiting errors from OpenRouter
      if (errorMessage.includes("rate limit") || errorMessage.includes("RATE_LIMITED")) {
        return createErrorResponse("RATE_LIMITED", "Zbyt wiele żądań. Spróbuj ponownie później.", 429);
      }

      // Authentication errors from external services
      if (errorMessage.includes("UNAUTHORIZED")) {
        return createErrorResponse("API_UNAUTHORIZED", "Błąd autentykacji z usługą AI", 503);
      }
    }

    // Log unexpected errors for debugging (in production)
    // eslint-disable-next-line no-console
    console.error("Unexpected error in image generation endpoint:", error);

    // Generic error response for unexpected errors
    return createErrorResponse("INTERNAL_ERROR", "Wystąpił błąd serwera. Spróbuj ponownie później.", 500);
  }
};

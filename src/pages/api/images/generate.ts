/**
 * Generate Image API Endpoint
 *
 * POST /api/images/generate
 * Generates furniture image using AI based on text prompt.
 * Enforces 10 free generations limit per client.
 */

import type { APIRoute } from "astro";
import { GenerateImageSchema } from "@/lib/schemas";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-utils";
import { generateFurnitureImage, getMaxFreeGenerations } from "@/lib/services/ai-image.service";
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

    // Get user role from metadata or database
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

    const maxGenerations = getMaxFreeGenerations();
    const remainingGenerations = maxGenerations - (count ?? 0);

    // Check if user has reached generation limit
    if (remainingGenerations <= 0) {
      return createErrorResponse(
        "GENERATION_LIMIT_REACHED",
        `Osiągnięto limit ${maxGenerations} darmowych generacji`,
        429
      );
    }

    // Generate image using AI service
    const aiResult = await generateFurnitureImage(validatedData.prompt);

    if (!aiResult.success || !aiResult.imageUrl) {
      return createErrorResponse("AI_GENERATION_FAILED", aiResult.error || "Nie udało się wygenerować obrazu", 503);
    }

    // Save generated image to database
    const { data: imageData, error: insertError } = await context.locals.supabase
      .from("generated_images")
      .insert({
        user_id: user.id,
        prompt: validatedData.prompt,
        image_url: aiResult.imageUrl,
      })
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

    // Handle unexpected errors
    return createErrorResponse("INTERNAL_ERROR", "Wystąpił błąd serwera. Spróbuj ponownie później.", 500);
  }
};

/**
 * List Generated Images API Endpoint
 *
 * GET /api/images/generated
 * Returns paginated list of user's generated images with filtering options.
 */

import type { APIRoute } from "astro";
import { GeneratedImagesQuerySchema } from "@/lib/schemas";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-utils";
import { getMaxFreeGenerations } from "@/lib/services/ai-image.service";
import { ZodError } from "zod";
import type { GeneratedImagesListResponseDTO, GeneratedImageDTO } from "@/types";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return createErrorResponse("UNAUTHORIZED", "Musisz być zalogowany", 401);
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

    // Only clients can access generated images
    if (userData.role !== "client") {
      return createErrorResponse("FORBIDDEN", "Tylko klienci mogą przeglądać wygenerowane obrazy", 403);
    }

    // Parse and validate query parameters
    const url = new URL(context.request.url);
    const queryParams = {
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
      unused_only: url.searchParams.get("unused_only"),
    };

    const validatedQuery = GeneratedImagesQuerySchema.parse(queryParams);

    // Build query
    let query = context.locals.supabase
      .from("generated_images")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Apply unused_only filter if requested
    if (validatedQuery.unused_only) {
      // Get IDs of images that are used in projects
      const { data: usedImages } = await context.locals.supabase.from("projects").select("generated_image_id");

      if (usedImages && usedImages.length > 0) {
        const usedImageIds = usedImages.map((p) => p.generated_image_id);
        query = query.not("id", "in", `(${usedImageIds.join(",")})`);
      }
    }

    // Apply pagination
    const offset = (validatedQuery.page - 1) * validatedQuery.limit;
    query = query.range(offset, offset + validatedQuery.limit - 1);

    // Execute query
    const { data: images, error: queryError, count } = await query;

    if (queryError) {
      return createErrorResponse("DATABASE_ERROR", "Nie udało się pobrać obrazów", 500);
    }

    // Check which images are used in projects
    const imageIds = images?.map((img) => img.id) || [];
    let usedImageIds: string[] = [];

    if (imageIds.length > 0) {
      const { data: projects } = await context.locals.supabase
        .from("projects")
        .select("generated_image_id")
        .in("generated_image_id", imageIds);

      usedImageIds = projects?.map((p) => p.generated_image_id) || [];
    }

    // Map to DTO with is_used flag
    const imageDTOs: GeneratedImageDTO[] = (images || []).map((img) => ({
      id: img.id,
      user_id: img.user_id,
      prompt: img.prompt,
      image_url: img.image_url,
      created_at: img.created_at,
      is_used: usedImageIds.includes(img.id),
    }));

    // Count total generations for user
    const { count: totalGenerations } = await context.locals.supabase
      .from("generated_images")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    const maxGenerations = getMaxFreeGenerations();
    const remainingGenerations = maxGenerations - (totalGenerations ?? 0);

    // Prepare response
    const response: GeneratedImagesListResponseDTO = {
      data: imageDTOs,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total: count ?? 0,
        total_pages: Math.ceil((count ?? 0) / validatedQuery.limit),
      },
      remaining_generations: Math.max(0, remainingGenerations),
    };

    return createSuccessResponse(response);
  } catch (error) {
    // Handle validation errors from Zod
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};

      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });

      return createErrorResponse("VALIDATION_ERROR", "Błąd walidacji parametrów", 422, fieldErrors);
    }

    // Handle unexpected errors
    return createErrorResponse("INTERNAL_ERROR", "Wystąpił błąd serwera. Spróbuj ponownie później.", 500);
  }
};

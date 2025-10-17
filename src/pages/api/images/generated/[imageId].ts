/**
 * Generated Image Details API Endpoint
 *
 * GET /api/images/generated/{imageId}
 * Returns details of a specific generated image.
 *
 * DELETE /api/images/generated/{imageId}
 * Deletes a generated image (only if not used in a project).
 */

import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-utils";
import type { GeneratedImageDTO } from "@/types";

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

    const { imageId } = context.params;

    if (!imageId) {
      return createErrorResponse("INVALID_REQUEST", "Brak identyfikatora obrazu", 400);
    }

    // Get image from database
    const { data: image, error: imageError } = await context.locals.supabase
      .from("generated_images")
      .select("*")
      .eq("id", imageId)
      .eq("user_id", user.id)
      .single();

    if (imageError || !image) {
      return createErrorResponse("NOT_FOUND", "Nie znaleziono obrazu", 404);
    }

    // Check if image is used in any project
    const { count } = await context.locals.supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("generated_image_id", image.id);

    // Prepare response
    const response: GeneratedImageDTO = {
      id: image.id,
      user_id: image.user_id,
      prompt: image.prompt,
      image_url: image.image_url,
      created_at: image.created_at,
      is_used: (count ?? 0) > 0,
    };

    return createSuccessResponse(response);
  } catch {
    // Handle unexpected errors
    return createErrorResponse("INTERNAL_ERROR", "Wystąpił błąd serwera. Spróbuj ponownie później.", 500);
  }
};

export const DELETE: APIRoute = async (context) => {
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

    // Only clients can delete generated images
    if (userData.role !== "client") {
      return createErrorResponse("FORBIDDEN", "Tylko klienci mogą usuwać wygenerowane obrazy", 403);
    }

    const { imageId } = context.params;

    if (!imageId) {
      return createErrorResponse("INVALID_REQUEST", "Brak identyfikatora obrazu", 400);
    }

    // Get image from database and verify ownership
    const { data: image, error: imageError } = await context.locals.supabase
      .from("generated_images")
      .select("*")
      .eq("id", imageId)
      .eq("user_id", user.id)
      .single();

    if (imageError || !image) {
      return createErrorResponse("NOT_FOUND", "Nie znaleziono obrazu", 404);
    }

    // Check if image is used in any project
    const { data: projects } = await context.locals.supabase
      .from("projects")
      .select("id")
      .eq("generated_image_id", image.id)
      .limit(1);

    if (projects && projects.length > 0) {
      return createErrorResponse("IMAGE_IN_USE", "Nie można usunąć obrazu użytego w projekcie", 400);
    }

    // Delete image from database
    const { error: deleteError } = await context.locals.supabase
      .from("generated_images")
      .delete()
      .eq("id", imageId)
      .eq("user_id", user.id);

    if (deleteError) {
      return createErrorResponse("DATABASE_ERROR", "Nie udało się usunąć obrazu", 500);
    }

    // Return success with no content
    return new Response(null, { status: 204 });
  } catch {
    // Handle unexpected errors
    return createErrorResponse("INTERNAL_ERROR", "Wystąpił błąd serwera. Spróbuj ponownie później.", 500);
  }
};

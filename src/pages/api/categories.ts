/**
 * Categories Dictionary Endpoint
 *
 * GET /api/categories
 *
 * Fetches all furniture categories available in the system.
 * This is a public endpoint that does not require authentication.
 *
 * @route GET /api/categories
 * @returns {Object} { data: CategoryDTO[] } - Array of all categories
 * @statusCode 200 - Successfully retrieved categories
 * @statusCode 500 - Internal server error
 *
 * @example
 * // Request
 * GET /api/categories
 *
 * // Response (200 OK)
 * {
 *   "data": [
 *     { "id": "uuid-1", "name": "Krzesła" },
 *     { "id": "uuid-2", "name": "Stoły" }
 *   ]
 * }
 *
 * // Response (500 Internal Server Error)
 * {
 *   "error": {
 *     "code": "INTERNAL_SERVER_ERROR",
 *     "message": "Wystąpił nieoczekiwany błąd serwera."
 *   }
 * }
 */

import type { APIContext } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../lib/api-utils";
import { DictionaryService } from "../../lib/services/dictionary.service";

export const prerender = false;

/**
 * GET handler for categories endpoint
 *
 * Retrieves all furniture categories from the database.
 * Handles errors gracefully and returns standardized error responses.
 */
export async function GET({ locals }: APIContext): Promise<Response> {
  try {
    // Retrieve Supabase client from Astro context
    const supabase = locals.supabase;

    if (!supabase) {
      return createErrorResponse("INTERNAL_SERVER_ERROR", "Nieskonifurowany klient bazy danych.", 500);
    }

    // Initialize DictionaryService with Supabase client
    const dictionaryService = new DictionaryService(supabase);

    // Fetch categories from database
    const categories = await dictionaryService.getCategories();

    // Return successful response with categories data
    return createSuccessResponse({ data: categories }, 200);
  } catch {
    // Return standardized error response
    return createErrorResponse("INTERNAL_SERVER_ERROR", "Wystąpił nieoczekiwany błąd serwera.", 500);
  }
}

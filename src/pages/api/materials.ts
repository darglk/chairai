/**
 * Materials Dictionary Endpoint
 *
 * GET /api/materials
 *
 * Fetches all furniture materials available in the system.
 * This is a public endpoint that does not require authentication.
 *
 * @route GET /api/materials
 * @returns {Object} { data: MaterialDTO[] } - Array of all materials
 * @statusCode 200 - Successfully retrieved materials
 * @statusCode 500 - Internal server error
 *
 * @example
 * // Request
 * GET /api/materials
 *
 * // Response (200 OK)
 * {
 *   "data": [
 *     { "id": "uuid-1", "name": "Drewno" },
 *     { "id": "uuid-2", "name": "Metal" }
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
 * GET handler for materials endpoint
 *
 * Retrieves all furniture materials from the database.
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

    // Fetch materials from database
    const materials = await dictionaryService.getMaterials();

    // Return successful response with materials data
    return createSuccessResponse({ data: materials }, 200);
  } catch {
    // Return standardized error response
    return createErrorResponse("INTERNAL_SERVER_ERROR", "Wystąpił nieoczekiwany błąd serwera.", 500);
  }
}

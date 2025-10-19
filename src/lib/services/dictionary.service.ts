/**
 * Dictionary Service
 *
 * Service responsible for fetching dictionary resources (categories, materials, specializations)
 * from the Supabase database. These are reference data used throughout the application.
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type { CategoryDTO, MaterialDTO, SpecializationDTO } from "../../types";

/**
 * Service for managing dictionary/reference data
 *
 * Provides methods to retrieve static dictionary data from database tables.
 * Data is read-only and typically cached due to infrequent changes.
 */
export class DictionaryService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Fetches all furniture categories from the database
   *
   * @returns Promise containing array of CategoryDTO objects
   * @throws Error if database query fails
   *
   * @example
   * const categories = await dictionaryService.getCategories();
   * // Returns: [{ id: "uuid-1", name: "Krzesła" }, ...]
   */
  async getCategories(): Promise<CategoryDTO[]> {
    const { data, error } = await this.supabase.from("categories").select("*");

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Fetches all furniture materials from the database
   *
   * @returns Promise containing array of MaterialDTO objects
   * @throws Error if database query fails
   *
   * @example
   * const materials = await dictionaryService.getMaterials();
   * // Returns: [{ id: "uuid-1", name: "Drewno" }, ...]
   */
  async getMaterials(): Promise<MaterialDTO[]> {
    const { data, error } = await this.supabase.from("materials").select("*");

    if (error) {
      throw new Error(`Failed to fetch materials: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Fetches all artisan specializations from the database
   *
   * @returns Promise containing array of SpecializationDTO objects
   * @throws Error if database query fails
   *
   * @example
   * const specializations = await dictionaryService.getSpecializations();
   * // Returns: [{ id: "uuid-1", name: "Stoliarstwo" }, ...]
   */
  async getSpecializations(): Promise<SpecializationDTO[]> {
    const { data, error } = await this.supabase.from("specializations").select("*");

    if (error) {
      throw new Error(`Failed to fetch specializations: ${error.message}`);
    }

    return data || [];
  }
}

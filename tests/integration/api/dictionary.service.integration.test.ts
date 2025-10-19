import { describe, it, expect, vi, beforeEach } from "vitest";
import { DictionaryService } from "@/lib/services/dictionary.service";
import type { SupabaseClient } from "@/db/supabase.client";
import type { CategoryDTO, MaterialDTO, SpecializationDTO } from "@/types";

/**
 * Integration Tests: DictionaryService
 *
 * Tests the Dictionary Service integration with Supabase database
 * by mocking the Supabase client to verify correct query execution,
 * error handling, and data transformation.
 */
describe("Integration: DictionaryService", () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    // Create a mock Supabase client with chainable methods
    mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn(),
      }),
    } as unknown as SupabaseClient;
  });

  describe("getCategories()", () => {
    it("should fetch categories from the database successfully", async () => {
      // Arrange: Mock successful database response
      const mockCategories: CategoryDTO[] = [
        { id: "cat-1", name: "Krzesła" },
        { id: "cat-2", name: "Stoły" },
        { id: "cat-3", name: "Regały" },
      ];

      const selectMock = vi.fn().mockResolvedValue({
        data: mockCategories,
        error: null,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: selectMock,
      } as unknown as ReturnType<typeof mockSupabase.from>);

      // Act: Call the service method
      const service = new DictionaryService(mockSupabase);
      const result = await service.getCategories();

      // Assert: Verify the result and database interaction
      expect(result).toEqual(mockCategories);
      expect(mockSupabase.from).toHaveBeenCalledWith("categories");
      expect(selectMock).toHaveBeenCalledWith("*");
    });

    it("should return empty array when no categories exist", async () => {
      // Arrange: Mock empty database response
      const selectMock = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: selectMock,
      } as unknown as ReturnType<typeof mockSupabase.from>);

      // Act
      const service = new DictionaryService(mockSupabase);
      const result = await service.getCategories();

      // Assert
      expect(result).toEqual([]);
    });

    it("should throw error when database query fails", async () => {
      // Arrange: Mock database error
      const dbError = new Error("Database connection failed");
      const selectMock = vi.fn().mockResolvedValue({
        data: null,
        error: dbError,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: selectMock,
      } as unknown as ReturnType<typeof mockSupabase.from>);

      // Act & Assert
      const service = new DictionaryService(mockSupabase);
      await expect(service.getCategories()).rejects.toThrow();
    });
  });

  describe("getMaterials()", () => {
    it("should fetch materials from the database successfully", async () => {
      // Arrange: Mock successful database response
      const mockMaterials: MaterialDTO[] = [
        { id: "mat-1", name: "Drewno" },
        { id: "mat-2", name: "Metal" },
        { id: "mat-3", name: "Tkanina" },
      ];

      const selectMock = vi.fn().mockResolvedValue({
        data: mockMaterials,
        error: null,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: selectMock,
      } as unknown as ReturnType<typeof mockSupabase.from>);

      // Act
      const service = new DictionaryService(mockSupabase);
      const result = await service.getMaterials();

      // Assert
      expect(result).toEqual(mockMaterials);
      expect(mockSupabase.from).toHaveBeenCalledWith("materials");
      expect(selectMock).toHaveBeenCalledWith("*");
    });

    it("should return empty array when no materials exist", async () => {
      // Arrange
      const selectMock = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: selectMock,
      } as unknown as ReturnType<typeof mockSupabase.from>);

      // Act
      const service = new DictionaryService(mockSupabase);
      const result = await service.getMaterials();

      // Assert
      expect(result).toEqual([]);
    });

    it("should throw error when database query fails", async () => {
      // Arrange
      const dbError = new Error("Database timeout");
      const selectMock = vi.fn().mockResolvedValue({
        data: null,
        error: dbError,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: selectMock,
      } as unknown as ReturnType<typeof mockSupabase.from>);

      // Act & Assert
      const service = new DictionaryService(mockSupabase);
      await expect(service.getMaterials()).rejects.toThrow();
    });
  });

  describe("getSpecializations()", () => {
    it("should fetch specializations from the database successfully", async () => {
      // Arrange
      const mockSpecializations: SpecializationDTO[] = [
        { id: "spec-1", name: "Stoliarstwo" },
        { id: "spec-2", name: "Tapicerstwo" },
        { id: "spec-3", name: "Projektowanie" },
      ];

      const selectMock = vi.fn().mockResolvedValue({
        data: mockSpecializations,
        error: null,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: selectMock,
      } as unknown as ReturnType<typeof mockSupabase.from>);

      // Act
      const service = new DictionaryService(mockSupabase);
      const result = await service.getSpecializations();

      // Assert
      expect(result).toEqual(mockSpecializations);
      expect(mockSupabase.from).toHaveBeenCalledWith("specializations");
      expect(selectMock).toHaveBeenCalledWith("*");
    });

    it("should return empty array when no specializations exist", async () => {
      // Arrange
      const selectMock = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: selectMock,
      } as unknown as ReturnType<typeof mockSupabase.from>);

      // Act
      const service = new DictionaryService(mockSupabase);
      const result = await service.getSpecializations();

      // Assert
      expect(result).toEqual([]);
    });

    it("should throw error when database query fails", async () => {
      // Arrange
      const dbError = new Error("Network error");
      const selectMock = vi.fn().mockResolvedValue({
        data: null,
        error: dbError,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: selectMock,
      } as unknown as ReturnType<typeof mockSupabase.from>);

      // Act & Assert
      const service = new DictionaryService(mockSupabase);
      await expect(service.getSpecializations()).rejects.toThrow();
    });
  });
});

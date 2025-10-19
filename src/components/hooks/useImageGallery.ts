import { useState, useEffect, useCallback } from "react";
import type { GeneratedImageDTO, PaginationMetaDTO, ApiErrorDTO, GeneratedImagesListResponseDTO } from "@/types";

/**
 * Custom hook for managing image gallery state and API interactions
 *
 * Handles:
 * - Fetching paginated images from API
 * - Loading states
 * - Error handling with proper error types
 * - Page navigation
 * - Filtering by unused images
 *
 * @returns Gallery state and controls
 */
export function useImageGallery() {
  const [images, setImages] = useState<GeneratedImageDTO[]>([]);
  const [pagination, setPagination] = useState<PaginationMetaDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiErrorDTO | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showOnlyUnused, setShowOnlyUnused] = useState(false);

  const fetchImages = useCallback(async (page: number, unusedOnly: boolean) => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        unused_only: unusedOnly.toString(),
      });
      const response = await fetch(`/api/images/generated?${queryParams}`);

      // Handle HTTP errors
      if (!response.ok) {
        // Try to parse error response
        try {
          const errorData: ApiErrorDTO = await response.json();
          setError(errorData);
        } catch {
          // Fallback if response is not JSON
          setError({
            error: {
              code: `HTTP_${response.status}`,
              message: `Błąd serwera (${response.status}): ${response.statusText}`,
            },
          });
        }
        return;
      }

      // Parse successful response
      const data: GeneratedImagesListResponseDTO = await response.json();
      setImages(data.data);
      setPagination(data.pagination);
    } catch (err) {
      // Handle network errors or other unexpected errors
      const message = err instanceof Error ? err.message : "Nie udało się pobrać obrazów.";
      setError({
        error: {
          code: "FETCH_ERROR",
          message: message,
        },
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages(currentPage, showOnlyUnused);
  }, [currentPage, showOnlyUnused, fetchImages]);

  const toggleUnusedFilter = useCallback(() => {
    setShowOnlyUnused((prev) => !prev);
    setCurrentPage(1); // Reset to first page when filter changes
  }, []);

  return {
    images,
    pagination,
    isLoading,
    error,
    currentPage,
    setCurrentPage,
    showOnlyUnused,
    toggleUnusedFilter,
  };
}

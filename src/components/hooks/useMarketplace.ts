import { useState, useEffect, useCallback } from "react";
import type {
  ProjectDTO,
  CategoryDTO,
  MaterialDTO,
  PaginationMetaDTO,
  ApiErrorDTO,
  PaginatedResponseDTO,
} from "../../types";

export interface MarketplaceFilters {
  search?: string;
  categoryId?: string;
  materialId?: string;
}

interface UseMarketplaceReturn {
  projects: ProjectDTO[];
  pagination: PaginationMetaDTO | null;
  filters: MarketplaceFilters;
  page: number;
  isLoading: boolean;
  error: ApiErrorDTO | null;
  categories: CategoryDTO[];
  materials: MaterialDTO[];
  setFilters: (newFilters: Partial<MarketplaceFilters>) => void;
  setPage: (page: number) => void;
}

const ITEMS_PER_PAGE = 20;
const DEBOUNCE_DELAY = 300; // ms

export function useMarketplace(): UseMarketplaceReturn {
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [pagination, setPagination] = useState<PaginationMetaDTO | null>(null);
  const [filters, setFiltersState] = useState<MarketplaceFilters>({});
  const [page, setPageState] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiErrorDTO | null>(null);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [materials, setMaterials] = useState<MaterialDTO[]>([]);

  // Load categories and materials on mount
  useEffect(() => {
    const loadDictionaries = async () => {
      try {
        const [categoriesResponse, materialsResponse] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/materials"),
        ]);

        if (!categoriesResponse.ok || !materialsResponse.ok) {
          throw new Error("Failed to load dictionaries");
        }

        const categoriesData = await categoriesResponse.json();
        const materialsData = await materialsResponse.json();

        setCategories(categoriesData.data || []);
        setMaterials(materialsData.data || []);
      } catch {
        // Silent catch - dictionaries are not critical, filters will just be empty
      }
    };

    loadDictionaries();
  }, []);

  // Sync filters and page with URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const urlFilters: MarketplaceFilters = {};
    const search = params.get("search");
    const categoryId = params.get("category_id");
    const materialId = params.get("material_id");
    const urlPage = params.get("page");

    if (search) urlFilters.search = search;
    if (categoryId) urlFilters.categoryId = categoryId;
    if (materialId) urlFilters.materialId = materialId;

    setFiltersState(urlFilters);
    if (urlPage) setPageState(parseInt(urlPage, 10));
  }, []);

  // Load projects when filters or page change (with debouncing for search)
  useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Build query parameters
        const params = new URLSearchParams();
        params.set("status", "open"); // Only show open projects in marketplace
        params.set("page", page.toString());
        params.set("limit", ITEMS_PER_PAGE.toString());

        if (filters.categoryId) {
          params.set("category_id", filters.categoryId);
        }
        if (filters.materialId) {
          params.set("material_id", filters.materialId);
        }

        // Call API
        const response = await fetch(`/api/projects?${params.toString()}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Failed to load projects");
        }

        const data: PaginatedResponseDTO<ProjectDTO> = await response.json();

        // Filter by search on client side (if provided)
        let filteredProjects = data.data;
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredProjects = filteredProjects.filter(
            (p) =>
              p.category.name.toLowerCase().includes(searchLower) ||
              p.material.name.toLowerCase().includes(searchLower) ||
              p.generated_image.prompt?.toLowerCase().includes(searchLower)
          );
        }

        setProjects(filteredProjects);
        setPagination(data.pagination);
      } catch (err) {
        setError({
          error: {
            code: "LOAD_PROJECTS_ERROR",
            message: err instanceof Error ? err.message : "Nie udało się załadować projektów",
          },
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce search filter
    const timeoutId = setTimeout(
      () => {
        loadProjects();
      },
      filters.search ? DEBOUNCE_DELAY : 0
    );

    return () => clearTimeout(timeoutId);
  }, [filters, page]);

  // Update URL when filters or page change
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.search) params.set("search", filters.search);
    if (filters.categoryId) params.set("category_id", filters.categoryId);
    if (filters.materialId) params.set("material_id", filters.materialId);
    if (page > 1) params.set("page", page.toString());

    const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;

    window.history.replaceState({}, "", newUrl);
  }, [filters, page]);

  const setFilters = useCallback((newFilters: Partial<MarketplaceFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
    setPageState(1); // Reset to first page when filters change
  }, []);

  const setPage = useCallback((newPage: number) => {
    setPageState(newPage);
  }, []);

  return {
    projects,
    pagination,
    filters,
    page,
    isLoading,
    error,
    categories,
    materials,
    setFilters,
    setPage,
  };
}

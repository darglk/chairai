import { useMarketplace } from "../hooks/useMarketplace";
import ProjectFilters from "./ProjectFilters";
import ProjectList from "./ProjectList";
import PaginationControls from "./PaginationControls";
import type { ProjectDTO } from "../../types";

export interface ProjectCardViewModel {
  id: string;
  imageUrl: string;
  categoryName: string;
  materialName: string;
  budgetRange: string | null;
  dimensions: string | null;
  createdAt: string;
}

function transformProjectToViewModel(project: ProjectDTO): ProjectCardViewModel {
  return {
    id: project.id,
    imageUrl: project.generated_image.image_url,
    categoryName: project.category.name,
    materialName: project.material.name,
    budgetRange: project.budget_range,
    dimensions: project.dimensions,
    createdAt: project.created_at,
  };
}

export default function MarketplaceView() {
  const { projects, pagination, filters, isLoading, error, categories, materials, setFilters, setPage } =
    useMarketplace();

  // Transform projects to view models
  const projectViewModels = projects.map(transformProjectToViewModel);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Rynek Projektów</h1>
          <p className="mt-2 text-gray-600">Przeglądaj i aplikuj na otwarte zlecenia od klientów</p>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <ProjectFilters
            filters={filters}
            categories={categories}
            materials={materials}
            onFilterChange={setFilters}
            isLoading={isLoading}
          />
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800" role="alert">
            <p className="font-semibold">Wystąpił błąd</p>
            <p className="text-sm">{error.error.message}</p>
          </div>
        )}

        {/* Project List */}
        {!error && (
          <>
            <ProjectList projects={projectViewModels} isLoading={isLoading} />

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="mt-8">
                <PaginationControls pagination={pagination} onPageChange={setPage} isLoading={isLoading} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

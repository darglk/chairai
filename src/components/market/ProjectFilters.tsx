import { useState } from "react";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Filter } from "lucide-react";
import type { MarketplaceFilters } from "../hooks/useMarketplace";
import type { CategoryDTO, MaterialDTO } from "../../types";

interface ProjectFiltersProps {
  filters: MarketplaceFilters;
  categories: CategoryDTO[];
  materials: MaterialDTO[];
  onFilterChange: (newFilters: Partial<MarketplaceFilters>) => void;
  isLoading: boolean;
}

export default function ProjectFilters({
  filters,
  categories,
  materials,
  onFilterChange,
  isLoading,
}: ProjectFiltersProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ search: e.target.value || undefined });
  };

  const handleCategoryChange = (value: string) => {
    onFilterChange({ categoryId: value === "all" ? undefined : value });
  };

  const handleMaterialChange = (value: string) => {
    onFilterChange({ materialId: value === "all" ? undefined : value });
  };

  const handleResetFilters = () => {
    onFilterChange({ search: undefined, categoryId: undefined, materialId: undefined });
    setIsDialogOpen(false);
  };

  const FiltersContent = () => (
    <div className="space-y-4">
      {/* Search Input */}
      <div>
        <label htmlFor="search" className="mb-2 block text-sm font-medium text-gray-700">
          Szukaj
        </label>
        <Input
          id="search"
          type="text"
          placeholder="Wyszukaj projekty..."
          value={filters.search || ""}
          onChange={handleSearchChange}
          disabled={isLoading}
          aria-label="Wyszukaj projekty"
        />
      </div>

      {/* Category Select */}
      <div>
        <label htmlFor="category" className="mb-2 block text-sm font-medium text-gray-700">
          Kategoria
        </label>
        <Select value={filters.categoryId || "all"} onValueChange={handleCategoryChange} disabled={isLoading}>
          <SelectTrigger id="category" aria-label="Wybierz kategorię">
            <SelectValue placeholder="Wszystkie kategorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie kategorie</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Material Select */}
      <div>
        <label htmlFor="material" className="mb-2 block text-sm font-medium text-gray-700">
          Materiał
        </label>
        <Select value={filters.materialId || "all"} onValueChange={handleMaterialChange} disabled={isLoading}>
          <SelectTrigger id="material" aria-label="Wybierz materiał">
            <SelectValue placeholder="Wszystkie materiały" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie materiały</SelectItem>
            {materials.map((material) => (
              <SelectItem key={material.id} value={material.id}>
                {material.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reset Button */}
      <Button variant="outline" onClick={handleResetFilters} disabled={isLoading} className="w-full">
        Wyczyść filtry
      </Button>
    </div>
  );

  return (
    <>
      {/* Desktop Filters */}
      <div className="hidden rounded-lg border bg-white p-4 shadow-sm md:block">
        <FiltersContent />
      </div>

      {/* Mobile Filters - Dialog */}
      <div className="md:hidden">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Filter className="mr-2 h-4 w-4" />
              Filtry
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Filtry projektów</DialogTitle>
            </DialogHeader>
            <FiltersContent />
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

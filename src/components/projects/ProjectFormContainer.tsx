import React from "react";
import type { CategoryDTO, MaterialDTO } from "@/types";
import SelectedImageView from "./SelectedImageView";
import FormField from "./FormField";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useProjectForm } from "./hooks/useProjectForm";

interface ProjectFormContainerProps {
  imageId: string;
  imageUrl: string;
  imagePrompt: string | null;
  categories: CategoryDTO[];
  materials: MaterialDTO[];
}

const ProjectFormContainer: React.FC<ProjectFormContainerProps> = ({
  imageId,
  imageUrl,
  imagePrompt,
  categories,
  materials,
}) => {
  const { formData, errors, isLoading, handleChange, handleBlur, handleSubmit, handleCancel } = useProjectForm({
    imageId,
  });

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Utwórz nowy projekt</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Wypełnij formularz, aby przekształcić wygenerowany obraz w projekt dostępny dla rzemieślników.
        </p>
      </div>

      <SelectedImageView imageUrl={imageUrl} prompt={imagePrompt} />

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div
            className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md animate-in fade-in slide-in-from-top-2 duration-300"
            role="alert"
            aria-live="assertive"
          >
            <p className="text-sm font-medium">{errors.general}</p>
          </div>
        )}

        <FormField
          label="Kategoria"
          name="category_id"
          value={formData.category_id}
          error={errors.category_id}
          onChange={(value: string) => handleChange("category_id", value)}
          onBlur={() => handleBlur("category_id")}
          type="select"
          options={categories.map((cat) => ({ id: cat.id, name: cat.name }))}
          required
        />

        <FormField
          label="Materiał"
          name="material_id"
          value={formData.material_id}
          error={errors.material_id}
          onChange={(value: string) => handleChange("material_id", value)}
          onBlur={() => handleBlur("material_id")}
          type="select"
          options={materials.map((mat) => ({ id: mat.id, name: mat.name }))}
          required
        />

        <FormField
          label="Wymiary"
          name="dimensions"
          value={formData.dimensions}
          error={errors.dimensions}
          onChange={(value: string) => handleChange("dimensions", value)}
          onBlur={() => handleBlur("dimensions")}
          type="text"
          placeholder="np. 120cm x 80cm x 75cm"
        />

        <FormField
          label="Zakres budżetu"
          name="budget_range"
          value={formData.budget_range}
          error={errors.budget_range}
          onChange={(value: string) => handleChange("budget_range", value)}
          onBlur={() => handleBlur("budget_range")}
          type="text"
          placeholder="np. 2000-3000 PLN"
        />

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Anuluj
          </Button>
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {isLoading ? "Tworzenie..." : "Utwórz projekt"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProjectFormContainer;

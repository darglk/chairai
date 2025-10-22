import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";
import type { ProjectDTO, PaginatedResponseDTO } from "@/types";

/**
 * Available Projects List
 *
 * Displays a preview of recent projects available in marketplace
 * Shows up to 3 projects with option to view all
 */
export function AvailableProjectsList() {
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/projects?status=open&page=1&limit=3");

        if (!response.ok) {
          throw new Error("Failed to fetch projects");
        }

        const data: PaginatedResponseDTO<ProjectDTO> = await response.json();
        setProjects(data.data);
      } catch {
        setError("Nie udało się załadować projektów");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-muted p-3 mb-4">
            <ExternalLink className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium mb-1">Brak dostępnych projektów</p>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Obecnie nie ma nowych projektów oczekujących na ofertę
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href="/market">Przejdź do Marketplace</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          <a href={`/projects/${project.id}`} className="block">
            <div className="aspect-video relative bg-muted">
              <img
                src={project.generated_image.image_url}
                alt={project.generated_image.prompt || "Projekt"}
                className="object-cover w-full h-full"
              />
            </div>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-sm">{project.category.name}</p>
                  <p className="text-xs text-muted-foreground">{project.material.name}</p>
                </div>
              </div>
              {project.budget_range && (
                <p className="text-sm text-muted-foreground mb-2">Budżet: {project.budget_range}</p>
              )}
              {project.dimensions && <p className="text-xs text-muted-foreground">Wymiary: {project.dimensions}</p>}
            </CardContent>
          </a>
        </Card>
      ))}
    </div>
  );
}

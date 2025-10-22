import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProjectDTO } from "@/types";

interface ProjectInfoProps {
  project: ProjectDTO & {
    client: {
      id: string;
      email: string;
    };
  };
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  open: { label: "Otwarty", variant: "default" },
  in_progress: { label: "W realizacji", variant: "secondary" },
  completed: { label: "Zakończony", variant: "outline" },
  closed: { label: "Zamknięty", variant: "destructive" },
};

/**
 * ProjectInfo Component
 *
 * Displays main project information including image, category, material,
 * dimensions, budget, and status.
 */
export function ProjectInfo({ project }: ProjectInfoProps) {
  const statusInfo = statusLabels[project.status] || statusLabels.open;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">Szczegóły Projektu</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {project.category.name} • {project.material.name}
            </p>
          </div>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Project Image */}
        <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
          <img
            src={project.generated_image.image_url}
            alt={project.generated_image.prompt || "Projekt"}
            className="object-cover w-full h-full"
          />
        </div>

        {/* Project Details Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Kategoria</h3>
            <p className="text-base">{project.category.name}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Materiał</h3>
            <p className="text-base">{project.material.name}</p>
          </div>

          {project.dimensions && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Wymiary</h3>
              <p className="text-base">{project.dimensions}</p>
            </div>
          )}

          {project.budget_range && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Budżet</h3>
              <p className="text-base">{project.budget_range}</p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Data utworzenia</h3>
            <p className="text-base">{new Date(project.created_at).toLocaleDateString("pl-PL")}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Liczba ofert</h3>
            <p className="text-base">{project.proposals_count}</p>
          </div>
        </div>

        {/* Prompt if available */}
        {project.generated_image.prompt && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Opis wizji</h3>
            <p className="text-base text-muted-foreground italic">{project.generated_image.prompt}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

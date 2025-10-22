import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Plus, Users, Clock, CheckCircle, XCircle } from "lucide-react";
import type { ProjectDTO } from "../../types";

/**
 * Client Projects List
 *
 * Displays list of client's projects with their status
 * Shows projects in different states: open, awaiting proposals, in progress, completed
 */
export function ClientProjectsList() {
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/projects/me");

        if (!response.ok) {
          throw new Error("Nie udało się pobrać projektów");
        }

        const data = await response.json();
        setProjects(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Wystąpił błąd");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const getStatusInfo = (status: ProjectDTO["status"]) => {
    switch (status) {
      case "open":
        return {
          label: "Otwarte",
          variant: "default" as const,
          icon: Clock,
        };
      case "in_progress":
        return {
          label: "W realizacji",
          variant: "secondary" as const,
          icon: Users,
        };
      case "completed":
        return {
          label: "Zakończone",
          variant: "default" as const,
          icon: CheckCircle,
        };
      case "closed":
        return {
          label: "Zamknięte",
          variant: "outline" as const,
          icon: XCircle,
        };
      default:
        return {
          label: status,
          variant: "outline" as const,
          icon: Clock,
        };
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 w-48 rounded bg-gray-200" />
            </CardHeader>
            <CardContent>
              <div className="h-32 w-full rounded bg-gray-200" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-red-100 p-4 mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Wystąpił błąd</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">{error}</p>
          <Button onClick={() => window.location.reload()}>Spróbuj ponownie</Button>
        </CardContent>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-muted p-4 mb-4">
            <FolderOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Nie masz jeszcze żadnych projektów</h3>
          <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
            Rozpocznij od wygenerowania obrazu swojego wymarzonego mebla, a następnie przekształć go w projekt, aby
            otrzymać oferty od rzemieślników
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild>
              <a href="/generate">
                <Plus className="h-4 w-4 mr-2" />
                Wygeneruj obraz
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/gallery">
                <FolderOpen className="h-4 w-4 mr-2" />
                Przeglądaj galerię
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => {
        const statusInfo = getStatusInfo(project.status);
        const StatusIcon = statusInfo.icon;

        return (
          <Card key={project.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{project.category.name}</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={statusInfo.variant}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {statusInfo.label}
                    </Badge>
                    <Badge variant="outline">
                      <Users className="mr-1 h-3 w-3" />
                      {project.proposals_count} {project.proposals_count === 1 ? "oferta" : "ofert"}
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/projects/${project.id}`}>Zobacz szczegóły</a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-lg">
                  <img
                    src={project.generated_image.image_url}
                    alt={project.category.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span className="font-medium">Materiał:</span>
                      <span className="ml-2">{project.material.name}</span>
                    </div>
                    {project.dimensions && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span className="font-medium">Wymiary:</span>
                        <span className="ml-2">{project.dimensions}</span>
                      </div>
                    )}
                    {project.budget_range && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span className="font-medium">Budżet:</span>
                        <span className="ml-2">{project.budget_range}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Utworzono: {new Date(project.created_at).toLocaleDateString("pl-PL")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

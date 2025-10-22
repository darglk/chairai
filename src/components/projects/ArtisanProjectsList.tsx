import { useEffect, useState } from "react";
import { Loader2, AlertCircle, Package } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { MyProposalDTO, ApiErrorDTO } from "@/types";

interface ArtisanProjectsListProps {
  status?: string;
}

/**
 * Artisan Projects List Component
 *
 * Displays list of artisan's projects with filtering by status
 */
export default function ArtisanProjectsList({ status }: ArtisanProjectsListProps) {
  const [projects, setProjects] = useState<MyProposalDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiErrorDTO | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const statusLabels: Record<string, string> = {
    open: "Otwarte",
    in_progress: "W realizacji",
    completed: "Zakończone",
    closed: "Zamknięte",
  };

  const statusLabel = status && status in statusLabels ? statusLabels[status] : "Wszystkie";

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: "12",
        });

        if (status) {
          params.set("status", status);
        }

        const response = await fetch(`/api/proposals/me?${params}`);

        if (!response.ok) {
          const errorData: ApiErrorDTO = await response.json();
          setError(errorData);
          return;
        }

        const data = await response.json();
        setProjects(data.data || []);
        setTotalPages(data.pagination?.total_pages || 1);
      } catch {
        setError({
          error: {
            code: "NETWORK_ERROR",
            message: "Nie udało się połączyć z serwerem",
          },
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [status, currentPage]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Ładowanie projektów...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Błąd</AlertTitle>
          <AlertDescription>{error.error.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Moje Projekty - {statusLabel}</h1>
        <p className="text-muted-foreground">
          {status === "completed"
            ? "Projekty które zrealizowałeś"
            : status === "in_progress"
              ? "Projekty w trakcie realizacji"
              : "Wszystkie Twoje oferty i projekty"}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <a
          href="/projects"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            !status ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Wszystkie
        </a>
        <a
          href="/projects?status=open"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            status === "open"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Otwarte
        </a>
        <a
          href="/projects?status=in_progress"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            status === "in_progress"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          W realizacji
        </a>
        <a
          href="/projects?status=completed"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            status === "completed"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Zakończone
        </a>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Brak projektów</h3>
          <p className="text-sm text-muted-foreground">
            {status === "completed"
              ? "Nie masz jeszcze zakończonych projektów"
              : "Nie znaleziono projektów z tym statusem"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <a
                key={project.id}
                href={`/projects/${project.project.id}`}
                className="group block rounded-lg border bg-card hover:shadow-lg transition-shadow"
              >
                <div className="aspect-video relative bg-muted rounded-t-lg overflow-hidden">
                  <img
                    src={project.project.generated_image.image_url}
                    alt={project.project.category.name}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />
                  {project.is_accepted && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                      Zaakceptowano
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-primary">{project.project.category.name}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        project.project.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : project.project.status === "in_progress"
                            ? "bg-blue-100 text-blue-800"
                            : project.project.status === "open"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {statusLabels[project.project.status] || project.project.status}
                    </span>
                  </div>
                  <p className="text-2xl font-bold mb-2">{project.price} PLN</p>
                  <p className="text-xs text-muted-foreground">
                    Oferta z {new Date(project.created_at).toLocaleDateString("pl-PL")}
                  </p>
                </div>
              </a>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Poprzednia
              </Button>
              <span className="px-4 py-2 text-sm">
                Strona {currentPage} z {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Następna
              </Button>
            </div>
          )}
        </>
      )}

      {/* Back to Dashboard */}
      <div className="mt-8">
        <a href="/dashboard/artisan" className="text-sm text-primary hover:underline">
          ← Wróć do pulpitu
        </a>
      </div>
    </div>
  );
}

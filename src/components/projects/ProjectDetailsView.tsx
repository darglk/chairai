import { useState, useEffect } from "react";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ProjectDTO, ApiErrorDTO } from "@/types";
import { ProjectInfo } from "./ProjectInfo.tsx";
import { ProposalsList } from "./ProposalsList.tsx";
import { ProposalForm } from "./ProposalForm.tsx";

interface ProjectDetailsViewProps {
  projectId: string;
}

interface ProjectDetailsResponse extends ProjectDTO {
  client: {
    id: string;
    email: string;
  };
}

interface UserData {
  id: string;
  email: string;
  role: "client" | "artisan";
}

/**
 * Main Project Details View Component
 *
 * Handles data fetching and conditional rendering based on:
 * - User role (client/artisan)
 * - Project status (open/in_progress/completed/closed)
 * - User ownership (isOwner)
 */
export default function ProjectDetailsView({ projectId }: ProjectDetailsViewProps) {
  const [project, setProject] = useState<ProjectDetailsResponse | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiErrorDTO | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch both project and user data in parallel
        const [projectResponse, userResponse] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch("/api/users/me"),
        ]);

        if (!projectResponse.ok) {
          const errorData: ApiErrorDTO = await projectResponse.json();
          setError(errorData);
          return;
        }

        if (!userResponse.ok) {
          setError({
            error: {
              code: "AUTH_ERROR",
              message: "Nie udało się pobrać danych użytkownika",
            },
          });
          return;
        }

        const projectData: ProjectDetailsResponse = await projectResponse.json();
        const user: UserData = await userResponse.json();

        setProject(projectData);
        setUserData(user);
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

    fetchData();
  }, [projectId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">Ładowanie szczegółów projektu...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !project || !userData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Błąd</AlertTitle>
          <AlertDescription>{error?.error.message || "Nie udało się załadować projektu"}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <a href="/dashboard" className="inline-flex items-center text-sm text-primary hover:underline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Wróć do pulpitu
          </a>
        </div>
      </div>
    );
  }

  const isOwner = project.client_id === userData.id;
  const isClient = userData.role === "client";
  const isArtisan = userData.role === "artisan";

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <a
          href={isClient ? "/dashboard/client" : "/dashboard/artisan"}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Wróć do pulpitu
        </a>
      </div>

      {/* Project Info */}
      <ProjectInfo project={project} />

      {/* Conditional rendering based on status and role */}
      <div className="mt-8">
        {/* CLIENT + OPEN: Show proposals list */}
        {isClient && isOwner && project.status === "open" && <ProposalsList projectId={projectId} />}

        {/* ARTISAN + OPEN: Show proposal form */}
        {isArtisan && project.status === "open" && <ProposalForm projectId={projectId} />}

        {/* IN_PROGRESS: Show accepted proposal and chat */}
        {project.status === "in_progress" && (
          <div className="space-y-6">
            <Alert>
              <AlertTitle>Projekt w realizacji</AlertTitle>
              <AlertDescription>Ten projekt jest obecnie w trakcie realizacji.</AlertDescription>
            </Alert>
            {/* TODO: Add AcceptedProposal and ChatWidget components */}
          </div>
        )}

        {/* COMPLETED: Show summary and review form */}
        {project.status === "completed" && (
          <div>
            <Alert>
              <AlertTitle>Projekt zakończony</AlertTitle>
              <AlertDescription>Ten projekt został pomyślnie zakończony.</AlertDescription>
            </Alert>
            {/* TODO: Add ReviewForm component */}
          </div>
        )}

        {/* CLOSED: Show summary */}
        {project.status === "closed" && (
          <Alert>
            <AlertTitle>Projekt zamknięty</AlertTitle>
            <AlertDescription>Ten projekt został zamknięty i nie przyjmuje już ofert.</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

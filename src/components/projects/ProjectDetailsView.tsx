import { useState } from "react";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ProposalsList } from "./ProposalsList.tsx";
import { ProposalForm } from "./ProposalForm.tsx";
import { ReviewsList } from "./ReviewsList.tsx";
import { AcceptedProposal, ChatWidget, ReviewForm, useProjectDetails } from "./details";

interface ProjectDetailsViewProps {
  projectId: string;
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
  const { project, isLoading, error, refresh, submitReview, completeProject } = useProjectDetails(projectId);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

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
  if (error || !project) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Błąd</AlertTitle>
          <AlertDescription>{error?.error.message || "Nie udało się załadować projektu"}</AlertDescription>
        </Alert>
        <div className="mt-4 space-x-4">
          <Button variant="outline" onClick={refresh}>
            Spróbuj ponownie
          </Button>
          <a href="/dashboard/client" className="inline-flex items-center text-sm text-primary hover:underline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Wróć do pulpitu
          </a>
        </div>
      </div>
    );
  }

  const { isOwner, hasProposed, hasReviewed, acceptedProposal } = project;
  const dashboardUrl = isOwner ? "/dashboard/client" : "/dashboard/artisan";
  const reviewerLabel = isOwner ? "Opinia rzemieślnika" : "Opinia klienta";

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <a href={dashboardUrl} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Wróć do pulpitu
        </a>
      </div>

      {/* Project Info */}
      <div className="mb-8">
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Szczegóły projektu</h1>
              <p className="text-muted-foreground">
                {project.category} • {project.material}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-lg font-semibold capitalize">{project.status.replace("_", " ")}</p>
            </div>
          </div>

          <div className="aspect-video relative bg-muted rounded-lg overflow-hidden mb-6">
            <img src={project.imageUrl} alt={project.prompt || "Projekt"} className="object-cover w-full h-full" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {project.dimensions && (
              <div>
                <p className="text-sm text-muted-foreground">Wymiary</p>
                <p className="text-base font-medium">{project.dimensions}</p>
              </div>
            )}
            {project.budgetRange && (
              <div>
                <p className="text-sm text-muted-foreground">Budżet</p>
                <p className="text-base font-medium">{project.budgetRange}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Liczba ofert</p>
              <p className="text-base font-medium">{project.proposalsCount}</p>
            </div>
          </div>

          {project.prompt && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground mb-2">Opis wizji</p>
              <p className="text-base italic">{project.prompt}</p>
            </div>
          )}
        </div>
      </div>

      {/* Conditional rendering based on status and role */}
      <div className="space-y-6">
        {/* OPEN STATUS */}
        {project.status === "open" && (
          <>
            {/* CLIENT + OWNER: Show proposals list */}
            {isOwner && <ProposalsList projectId={projectId} onProposalAccepted={refresh} />}

            {/* ARTISAN + NOT PROPOSED: Show proposal form */}
            {!isOwner && !hasProposed && <ProposalForm projectId={projectId} />}

            {/* ARTISAN + ALREADY PROPOSED: Show info */}
            {!isOwner && hasProposed && (
              <Alert>
                <AlertTitle>Oferta wysłana</AlertTitle>
                <AlertDescription>Twoja oferta została wysłana. Czekaj na decyzję klienta.</AlertDescription>
              </Alert>
            )}
          </>
        )}

        {/* IN_PROGRESS STATUS */}
        {project.status === "in_progress" && (
          <div className="space-y-6">
            {acceptedProposal && <AcceptedProposal proposal={acceptedProposal} />}
            <ChatWidget projectId={projectId} messages={[]} />

            {/* Mark as completed button - only for project owner */}
            {isOwner && (
              <div className="bg-card rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-2">Zakończenie projektu</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Gdy projekt zostanie zrealizowany, oznacz go jako zakończony. Będziesz mógł wtedy wystawić opinię
                  rzemieślnikowi.
                </p>
                <Button
                  onClick={async () => {
                    if (confirm("Czy na pewno chcesz oznaczyć ten projekt jako zakończony?")) {
                      try {
                        await completeProject();
                        refresh();
                      } catch {
                        alert("Nie udało się oznaczyć projektu jako zakończony");
                      }
                    }
                  }}
                  className="w-full sm:w-auto"
                >
                  Oznacz jako zakończony
                </Button>
              </div>
            )}
          </div>
        )}

        {/* COMPLETED STATUS */}
        {project.status === "completed" && (
          <div className="space-y-6">
            <Alert>
              <AlertTitle>Projekt zakończony</AlertTitle>
              <AlertDescription>Ten projekt został pomyślnie zakończony.</AlertDescription>
            </Alert>

            {/* Display existing reviews */}
            {project.reviews.length > 0 && <ReviewsList reviews={project.reviews} reviewerLabel={reviewerLabel} />}

            {/* Show review form only if user hasn't reviewed yet */}
            {!hasReviewed ? (
              <ReviewForm
                onSubmit={async (data) => {
                  setIsSubmittingReview(true);
                  try {
                    await submitReview(data);
                    // Refresh to update hasReviewed status
                    refresh();
                  } finally {
                    setIsSubmittingReview(false);
                  }
                }}
                isLoading={isSubmittingReview}
              />
            ) : (
              <Alert>
                <AlertTitle>Opinia wystawiona</AlertTitle>
                <AlertDescription>Dziękujemy za wystawienie opinii o tym projekcie.</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* CLOSED STATUS */}
        {project.status === "closed" && (
          <Alert variant="destructive">
            <AlertTitle>Projekt zamknięty</AlertTitle>
            <AlertDescription>Ten projekt został zamknięty i nie przyjmuje już ofert.</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

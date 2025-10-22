import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import type { MyProposalDTO } from "@/types";

/**
 * In Progress Projects List
 *
 * Displays projects currently in progress for the artisan
 * Shows projects where artisan's proposal was accepted
 */
export function InProgressProjectsList() {
  const [projects, setProjects] = useState<MyProposalDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInProgressProjects = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/proposals/me?status=in_progress");

        if (!response.ok) {
          throw new Error("Nie udało się pobrać projektów");
        }

        const data = await response.json();
        // Filter only accepted proposals (is_accepted: true)
        const acceptedProposals = (data.data || []).filter((p: MyProposalDTO) => p.is_accepted);
        setProjects(acceptedProposals);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Wystąpił błąd podczas ładowania projektów";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInProgressProjects();
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
        <CardContent className="py-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-muted p-3 mb-4">
            <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium mb-1">Brak projektów w realizacji</p>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Składaj oferty w Marketplace, aby zacząć realizować projekty
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href="/market">Przeglądaj projekty</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {projects.map((proposal) => (
        <Card key={proposal.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg">{proposal.project.category.name}</CardTitle>
              <Badge variant="secondary">W realizacji</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Project Image */}
            <div className="aspect-video relative bg-muted rounded-lg overflow-hidden mb-4">
              <img
                src={proposal.project.generated_image.image_url}
                alt={proposal.project.category.name}
                className="object-cover w-full h-full"
              />
            </div>

            {/* Price */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">Zaakceptowana cena</p>
              <p className="text-lg font-bold">{proposal.price.toLocaleString("pl-PL")} PLN</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" asChild>
                <a href={`/projects/${proposal.project.id}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Szczegóły projektu
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

/**
 * Available Projects List
 *
 * Displays a preview of recent projects available in marketplace
 * Shows up to 3 projects with option to view all
 *
 * TODO: Connect to real projects API endpoint when available
 * Endpoint: GET /api/projects?status=open&limit=3
 */
export function AvailableProjectsList() {
  // Placeholder - no projects yet
  const projects: never[] = [];

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

  // TODO: Render project cards when API is available
  return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{/* Project cards will be rendered here */}</div>;
}

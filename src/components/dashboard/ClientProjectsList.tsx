import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderOpen, Plus } from "lucide-react";

/**
 * Client Projects List
 *
 * Displays list of client's projects with their status
 * Shows projects in different states: open, awaiting proposals, in progress, completed
 *
 * TODO: Connect to real projects API endpoint when available
 * Endpoint: GET /api/projects/me
 */
export function ClientProjectsList() {
  // Placeholder - no projects yet
  const projects: never[] = [];

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

  // TODO: Render project cards when API is available
  return <div className="space-y-4">{/* Project cards will be rendered here */}</div>;
}

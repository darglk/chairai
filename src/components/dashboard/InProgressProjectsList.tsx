import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

/**
 * In Progress Projects List
 * 
 * Displays projects currently in progress for the artisan
 * Shows projects where artisan's proposal was accepted
 * 
 * TODO: Connect to real projects API endpoint when available
 * Endpoint: GET /api/projects/me?status=in_progress
 */
export function InProgressProjectsList() {
  // Placeholder - no projects yet
  const projects: never[] = [];

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

  // TODO: Render project cards when API is available
  return (
    <div className="space-y-4">
      {/* Project cards will be rendered here */}
    </div>
  );
}

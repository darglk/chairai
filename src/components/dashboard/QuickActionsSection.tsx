import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Images } from "lucide-react";

/**
 * Quick Actions Section
 *
 * Displays primary actions available to clients:
 * - Generate new AI image
 * - View gallery of generated images
 * - View all projects
 */
export function QuickActionsSection() {
  const actions = [
    {
      title: "Wygeneruj Obraz AI",
      description: "Stwórz wizualizację swojego mebla za pomocą sztucznej inteligencji",
      icon: Sparkles,
      href: "/generate",
      variant: "default" as const,
    },
    {
      title: "Przeglądaj Galerię",
      description: "Zobacz wszystkie wygenerowane obrazy i stwórz z nich projekty",
      icon: Images,
      href: "/gallery",
      variant: "outline" as const,
    },
  ];

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Szybkie Akcje</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Card key={action.title} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                </div>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant={action.variant} className="w-full" asChild>
                  <a href={action.href}>{action.title === "Wygeneruj Obraz AI" ? "Rozpocznij" : "Przeglądaj"}</a>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

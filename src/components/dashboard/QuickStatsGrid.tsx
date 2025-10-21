import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Clock, TrendingUp, DollarSign } from "lucide-react";

/**
 * Quick Stats Grid
 *
 * Displays key metrics for artisan at a glance:
 * - Active proposals (submitted but not yet accepted/rejected)
 * - Projects in progress
 * - Completed projects this month
 * - Estimated monthly revenue (placeholder for future feature)
 *
 * TODO: Connect to real data from API endpoints when available
 */
export function QuickStatsGrid() {
  // Placeholder data - will be replaced with real API calls
  const stats = [
    {
      title: "Aktywne oferty",
      value: "0",
      description: "Oczekujące na odpowiedź",
      icon: Clock,
      trend: null,
    },
    {
      title: "W realizacji",
      value: "0",
      description: "Projekty do ukończenia",
      icon: Briefcase,
      trend: null,
    },
    {
      title: "Ukończone w tym miesiącu",
      value: "0",
      description: "Zrealizowane projekty",
      icon: TrendingUp,
      trend: null,
    },
    {
      title: "Potencjalny przychód",
      value: "0 zł",
      description: "Z aktywnych ofert",
      icon: DollarSign,
      trend: null,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

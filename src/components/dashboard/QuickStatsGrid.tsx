import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Clock, TrendingUp, DollarSign, Loader2 } from "lucide-react";
import type { MyProposalDTO } from "@/types";

interface Stats {
  activeProposals: number;
  inProgress: number;
  completedThisMonth: number;
  potentialRevenue: number;
}

/**
 * Quick Stats Grid
 *
 * Displays key metrics for artisan at a glance:
 * - Active proposals (submitted but not yet accepted/rejected)
 * - Projects in progress
 * - Completed projects this month
 * - Potential revenue from active proposals
 */
export function QuickStatsGrid() {
  const [stats, setStats] = useState<Stats>({
    activeProposals: 0,
    inProgress: 0,
    completedThisMonth: 0,
    potentialRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);

        // Fetch all proposals
        const response = await fetch("/api/proposals/me");
        if (!response.ok) {
          throw new Error("Failed to fetch proposals");
        }

        const data = await response.json();
        const proposals: MyProposalDTO[] = data.data || [];

        // Calculate stats
        const activeProposals = proposals.filter((p) => p.project.status === "open" && !p.is_accepted).length;

        const inProgress = proposals.filter((p) => p.project.status === "in_progress" && p.is_accepted).length;

        // Completed this month
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const completedThisMonth = proposals.filter((p) => {
          if (p.project.status !== "completed" || !p.is_accepted) return false;
          const createdDate = new Date(p.created_at);
          return createdDate >= firstDayOfMonth;
        }).length;

        // Potential revenue from active proposals
        const potentialRevenue = proposals
          .filter((p) => p.project.status === "open" && !p.is_accepted)
          .reduce((sum, p) => sum + p.price, 0);

        setStats({
          activeProposals,
          inProgress,
          completedThisMonth,
          potentialRevenue,
        });
      } catch {
        // Silently fail - stats will remain at 0
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statsDisplay = [
    {
      title: "Aktywne oferty",
      value: stats.activeProposals.toString(),
      description: "Oczekujące na odpowiedź",
      icon: Clock,
      trend: null,
    },
    {
      title: "W realizacji",
      value: stats.inProgress.toString(),
      description: "Projekty do ukończenia",
      icon: Briefcase,
      trend: null,
    },
    {
      title: "Ukończone w tym miesiącu",
      value: stats.completedThisMonth.toString(),
      description: "Zrealizowane projekty",
      icon: TrendingUp,
      trend: null,
    },
    {
      title: "Potencjalny przychód",
      value: `${stats.potentialRevenue.toLocaleString("pl-PL")} zł`,
      description: "Z aktywnych ofert",
      icon: DollarSign,
      trend: null,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statsDisplay.map((stat, index) => {
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

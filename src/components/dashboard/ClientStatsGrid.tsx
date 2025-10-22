import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Image, FolderOpen, Clock, CheckCircle2 } from "lucide-react";
import type { GeneratedImagesListResponseDTO } from "@/types";
import type { LucideIcon } from "lucide-react";

interface Stats {
  generatedImages: number;
  totalProjects: number;
  awaitingProposals: number;
  completed: number;
}

interface StatItem {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  trend: null;
}

/**
 * Client Stats Grid
 *
 * Displays key metrics for client at a glance:
 * - Generated images count (from API)
 * - Total projects (placeholder - TODO: implement projects API)
 * - Projects awaiting proposals (placeholder)
 * - Completed projects (placeholder)
 */
export function ClientStatsGrid() {
  const [stats, setStats] = useState<Stats>({
    generatedImages: 0,
    totalProjects: 0,
    awaitingProposals: 0,
    completed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);

        // Fetch generated images and projects in parallel
        const [imagesResponse, projectsResponse] = await Promise.all([
          fetch("/api/images/generated"),
          fetch("/api/projects/me?limit=100"),
        ]);

        // Process images data
        if (imagesResponse.ok) {
          const imagesData: GeneratedImagesListResponseDTO = await imagesResponse.json();
          setStats((prev) => ({
            ...prev,
            generatedImages: imagesData.data.length,
          }));
        }

        // Process projects data
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          const projects = projectsData.data || [];

          setStats((prev) => ({
            ...prev,
            totalProjects: projects.length,
            awaitingProposals: projects.filter((p: { status: string }) => p.status === "open").length,
            completed: projects.filter((p: { status: string }) => p.status === "completed").length,
          }));
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[ClientStatsGrid] Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statsData: StatItem[] = [
    {
      title: "Wygenerowane obrazy",
      value: isLoading ? "..." : stats.generatedImages.toString(),
      description: "Gotowe do użycia",
      icon: Image,
      trend: null,
    },
    {
      title: "Wszystkie projekty",
      value: isLoading ? "..." : stats.totalProjects.toString(),
      description: "Łączna liczba",
      icon: FolderOpen,
      trend: null,
    },
    {
      title: "Oczekujące na oferty",
      value: isLoading ? "..." : stats.awaitingProposals.toString(),
      description: "Otwarte zlecenia",
      icon: Clock,
      trend: null,
    },
    {
      title: "Ukończone",
      value: isLoading ? "..." : stats.completed.toString(),
      description: "Zrealizowane projekty",
      icon: CheckCircle2,
      trend: null,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat, index) => {
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

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

        // Fetch generated images
        const imagesResponse = await fetch("/api/images/generated");

        console.log("[ClientStatsGrid] Response status:", imagesResponse.status);

        if (imagesResponse.ok) {
          const imagesData: GeneratedImagesListResponseDTO = await imagesResponse.json();
          console.log("[ClientStatsGrid] Images data:", imagesData);
          console.log("[ClientStatsGrid] Images count:", imagesData.data.length);

          setStats((prev) => ({
            ...prev,
            generatedImages: imagesData.data.length,
          }));
        } else {
          const errorData = await imagesResponse.text();
          console.error("[ClientStatsGrid] Failed to fetch images:", imagesResponse.status, errorData);
        }

        // TODO: Fetch projects data when API is available
        // const projectsResponse = await fetch("/api/projects/me");
        // if (projectsResponse.ok) {
        //   const projectsData = await projectsResponse.json();
        //   setStats(prev => ({
        //     ...prev,
        //     totalProjects: projectsData.length,
        //     awaitingProposals: projectsData.filter(p => p.status === 'open').length,
        //     completed: projectsData.filter(p => p.status === 'completed').length,
        //   }));
        // }
      } catch (error) {
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
      value: stats.totalProjects.toString(),
      description: "Łączna liczba",
      icon: FolderOpen,
      trend: null,
    },
    {
      title: "Oczekujące na oferty",
      value: stats.awaitingProposals.toString(),
      description: "Otwarte zlecenia",
      icon: Clock,
      trend: null,
    },
    {
      title: "Ukończone",
      value: stats.completed.toString(),
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

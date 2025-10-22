import ProjectCard from "./ProjectCard";
import type { ProjectCardViewModel } from "./MarketplaceView";

interface ProjectListProps {
  projects: ProjectCardViewModel[];
  isLoading: boolean;
}

export default function ProjectList({ projects, isLoading }: ProjectListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-96 animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">Nie znaleziono projektów</p>
          <p className="mt-1 text-sm text-gray-500">Nie znaleziono projektów spełniających podane kryteria</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}

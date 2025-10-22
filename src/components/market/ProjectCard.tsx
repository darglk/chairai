import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import type { ProjectCardViewModel } from "./MarketplaceView";

interface ProjectCardProps {
  project: ProjectCardViewModel;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <a href={`/projects/${project.id}`} className="block transition-transform hover:scale-105">
      <Card className="h-full overflow-hidden">
        <div className="aspect-video w-full overflow-hidden bg-gray-100">
          <img
            src={project.imageUrl}
            alt={`Projekt ${project.categoryName}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        <CardHeader>
          <CardTitle className="text-lg">{project.categoryName}</CardTitle>
          <CardDescription>Materiał: {project.materialName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {project.dimensions && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium">Wymiary:</span>
              <span className="ml-2">{project.dimensions}</span>
            </div>
          )}
          {project.budgetRange && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium">Budżet:</span>
              <span className="ml-2">{project.budgetRange}</span>
            </div>
          )}
        </CardContent>
        <CardFooter className="text-xs text-gray-500">
          Dodano: {new Date(project.createdAt).toLocaleDateString("pl-PL")}
        </CardFooter>
      </Card>
    </a>
  );
}

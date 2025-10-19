/**
 * Project Service
 *
 * Service responsible for managing furniture projects.
 * Handles project creation, validation, and business logic around project lifecycle.
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateProjectCommand, ProjectDTO } from "../../types";
import type { Database } from "../../db/database.types";

/**
 * Custom error class for project-related business logic errors
 */
export class ProjectError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode = 400
  ) {
    super(message);
    this.name = "ProjectError";
  }
}

/**
 * Service for managing furniture projects
 *
 * Provides methods for creating and managing projects, including validation
 * of dependencies (images, categories, materials) and business rules.
 */
export class ProjectService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Creates a new furniture project
   *
   * Business rules:
   * - Only clients can create projects
   * - Generated image must exist and belong to the client
   * - Generated image must not be already used (enforced by unique constraint on generated_image_id)
   * - Category and material must exist
   *
   * @param dto - Project creation data
   * @param clientId - ID of the client creating the project
   * @returns Promise containing the created project with full details
   * @throws ProjectError if validation fails or resources don't exist
   *
   * @example
   * const project = await projectService.createProject({
   *   generated_image_id: "uuid-1",
   *   category_id: "uuid-2",
   *   material_id: "uuid-3",
   *   dimensions: "100x50x80 cm",
   *   budget_range: "1000-2000 PLN"
   * }, clientId);
   */
  async createProject(dto: CreateProjectCommand, clientId: string): Promise<ProjectDTO> {
    // Step 1: Validate generated image exists and belongs to client
    const { data: generatedImage, error: imageError } = await this.supabase
      .from("generated_images")
      .select("id, user_id")
      .eq("id", dto.generated_image_id)
      .single();

    if (imageError || !generatedImage) {
      throw new ProjectError("Nie znaleziono wygenerowanego obrazu", "IMAGE_NOT_FOUND", 404);
    }

    if (generatedImage.user_id !== clientId) {
      throw new ProjectError("Nie masz uprawnień do tego obrazu", "IMAGE_FORBIDDEN", 403);
    }

    // Step 2: Check if image is already used (check if any project uses this image)
    const { data: existingProject } = await this.supabase
      .from("projects")
      .select("id")
      .eq("generated_image_id", dto.generated_image_id)
      .maybeSingle();

    if (existingProject) {
      throw new ProjectError("Ten obraz jest już używany w innym projekcie", "IMAGE_ALREADY_USED", 409);
    }

    // Step 3: Validate category exists
    const { data: category, error: categoryError } = await this.supabase
      .from("categories")
      .select("id")
      .eq("id", dto.category_id)
      .single();

    if (categoryError || !category) {
      throw new ProjectError("Nie znaleziono kategorii", "CATEGORY_NOT_FOUND", 404);
    }

    // Step 4: Validate material exists
    const { data: material, error: materialError } = await this.supabase
      .from("materials")
      .select("id")
      .eq("id", dto.material_id)
      .single();

    if (materialError || !material) {
      throw new ProjectError("Nie znaleziono materiału", "MATERIAL_NOT_FOUND", 404);
    }

    // Step 5: Create project
    const projectInsert: Database["public"]["Tables"]["projects"]["Insert"] = {
      client_id: clientId,
      generated_image_id: dto.generated_image_id,
      category_id: dto.category_id,
      material_id: dto.material_id,
      status: "open",
      dimensions: dto.dimensions || null,
      budget_range: dto.budget_range || null,
    };

    const { data: project, error: projectError } = await this.supabase
      .from("projects")
      .insert(projectInsert)
      .select(
        `
        id,
        client_id,
        status,
        dimensions,
        budget_range,
        accepted_proposal_id,
        accepted_price,
        created_at,
        updated_at,
        generated_image:generated_images!projects_generated_image_id_fkey (
          id,
          image_url,
          prompt
        ),
        category:categories!projects_category_id_fkey (
          id,
          name
        ),
        material:materials!projects_material_id_fkey (
          id,
          name
        )
      `
      )
      .single();

    if (projectError || !project) {
      // Check if it's a unique constraint violation (image already used)
      if (projectError?.code === "23505") {
        throw new ProjectError("Ten obraz jest już używany w innym projekcie", "IMAGE_ALREADY_USED", 409);
      }
      throw new ProjectError("Nie udało się utworzyć projektu", "PROJECT_CREATE_FAILED", 500);
    }

    // Step 6: Get proposals count (initially 0 for new project)
    const { count: proposalsCount } = await this.supabase
      .from("proposals")
      .select("*", { count: "exact", head: true })
      .eq("project_id", project.id);

    // Step 7: Transform to ProjectDTO format
    type ProjectWithRelations = typeof project;
    type GeneratedImageRelation = ProjectWithRelations["generated_image"];
    type CategoryRelation = ProjectWithRelations["category"];
    type MaterialRelation = ProjectWithRelations["material"];

    const projectDTO: ProjectDTO = {
      id: project.id,
      client_id: project.client_id,
      generated_image: {
        id: (project.generated_image as GeneratedImageRelation & { id: string }).id,
        image_url: (project.generated_image as GeneratedImageRelation & { image_url: string }).image_url,
        prompt: (project.generated_image as GeneratedImageRelation & { prompt: string | null }).prompt,
      },
      category: {
        id: (project.category as CategoryRelation & { id: string }).id,
        name: (project.category as CategoryRelation & { name: string }).name,
      },
      material: {
        id: (project.material as MaterialRelation & { id: string }).id,
        name: (project.material as MaterialRelation & { name: string }).name,
      },
      status: project.status,
      dimensions: project.dimensions,
      budget_range: project.budget_range,
      accepted_proposal_id: project.accepted_proposal_id,
      accepted_price: project.accepted_price,
      proposals_count: proposalsCount || 0,
      created_at: project.created_at,
      updated_at: project.updated_at,
    };

    return projectDTO;
  }
}

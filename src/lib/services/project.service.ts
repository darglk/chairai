/**
 * Project Service
 *
 * Service responsible for managing furniture projects.
 * Handles project creation, validation, and business logic around project lifecycle.
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateProjectCommand, ProjectDTO, UpdateProjectStatusResponseDTO, ProjectStatus } from "../../types";
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
      // eslint-disable-next-line no-console
      console.error("[ProjectService] Project creation failed:", projectError);
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

  /**
   * Lists projects with filtering and pagination
   *
   * Business rules:
   * - Only artisans can list projects
   * - Returns projects matching filter criteria (status, category, material)
   * - Results are paginated
   *
   * @param queryParams - Query parameters including filters and pagination
   * @param userId - ID of the user requesting the list (must be artisan)
   * @param userRole - Role of the user requesting the list
   * @returns Promise containing paginated list of projects
   * @throws ProjectError if user is not artisan
   *
   * @example
   * const result = await projectService.listProjects({
   *   status: 'open',
   *   page: 1,
   *   limit: 20
   * }, userId, 'artisan');
   */
  async listProjects(
    queryParams: {
      status?: "open" | "in_progress" | "completed" | "closed";
      category_id?: string;
      material_id?: string;
      page: number;
      limit: number;
    },
    userId: string,
    userRole: string
  ) {
    // Step 1: Authorization - only artisans can list projects
    if (userRole !== "artisan") {
      throw new ProjectError("Tylko rzemieślnicy mogą przeglądać listę projektów", "FORBIDDEN", 403);
    }

    // Step 2: Build query with filters
    let query = this.supabase.from("projects").select(
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
      `,
      { count: "exact" }
    );

    // Apply filters
    if (queryParams.status) {
      query = query.eq("status", queryParams.status);
    }
    if (queryParams.category_id) {
      query = query.eq("category_id", queryParams.category_id);
    }
    if (queryParams.material_id) {
      query = query.eq("material_id", queryParams.material_id);
    }

    // Calculate pagination
    const from = (queryParams.page - 1) * queryParams.limit;
    const to = from + queryParams.limit - 1;

    // Apply pagination and ordering
    query = query.order("created_at", { ascending: false }).range(from, to);

    // Step 3: Execute query
    const { data: projects, error, count } = await query;

    if (error) {
      // eslint-disable-next-line no-console
      console.error("[ProjectService] Failed to fetch projects:", error);
      throw new ProjectError("Nie udało się pobrać listy projektów", "PROJECT_LIST_FAILED", 500);
    }

    // Step 4: Transform to ProjectListItemDTO format
    const projectListItems = (projects || [])
      .filter((project) => {
        // Filter out projects without required relations
        return project.generated_image && project.category && project.material;
      })
      .map((project) => {
        type ProjectWithRelations = typeof project;
        type GeneratedImageRelation = ProjectWithRelations["generated_image"];
        type CategoryRelation = ProjectWithRelations["category"];
        type MaterialRelation = ProjectWithRelations["material"];

        return {
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
          created_at: project.created_at,
          updated_at: project.updated_at,
        };
      });

    // Step 5: Calculate pagination metadata
    const total = count || 0;
    const totalPages = Math.ceil(total / queryParams.limit);

    return {
      data: projectListItems,
      pagination: {
        page: queryParams.page,
        limit: queryParams.limit,
        total,
        total_pages: totalPages,
      },
    };
  }

  /**
   * Lists client's own projects with pagination
   *
   * Business rules:
   * - Only clients can list their own projects
   * - Returns all projects created by the client
   * - Results are paginated
   *
   * @param queryParams - Query parameters including pagination
   * @param clientId - ID of the client requesting their projects
   * @returns Promise containing paginated list of client's projects
   * @throws ProjectError if user is not a client
   *
   * @example
   * const result = await projectService.listMyProjects({
   *   page: 1,
   *   limit: 20
   * }, clientId);
   */
  async listMyProjects(
    queryParams: {
      page: number;
      limit: number;
    },
    clientId: string
  ) {
    // Step 1: Build query
    const query = this.supabase
      .from("projects")
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
      `,
        { count: "exact" }
      )
      .eq("client_id", clientId);

    // Calculate pagination
    const from = (queryParams.page - 1) * queryParams.limit;
    const to = from + queryParams.limit - 1;

    // Apply pagination and ordering (newest first)
    const { data: projects, error, count } = await query.order("created_at", { ascending: false }).range(from, to);

    if (error) {
      // eslint-disable-next-line no-console
      console.error("[ProjectService] Failed to fetch client projects:", error);
      throw new ProjectError("Nie udało się pobrać listy projektów", "PROJECT_LIST_FAILED", 500);
    }

    // Step 2: Get proposals count for each project
    const projectsWithProposals = await Promise.all(
      (projects || []).map(async (project) => {
        const { count: proposalsCount } = await this.supabase
          .from("proposals")
          .select("*", { count: "exact", head: true })
          .eq("project_id", project.id);

        type ProjectWithRelations = typeof project;
        type GeneratedImageRelation = ProjectWithRelations["generated_image"];
        type CategoryRelation = ProjectWithRelations["category"];
        type MaterialRelation = ProjectWithRelations["material"];

        return {
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
      })
    );

    // Step 3: Calculate pagination metadata
    const total = count || 0;
    const totalPages = Math.ceil(total / queryParams.limit);

    return {
      data: projectsWithProposals,
      pagination: {
        page: queryParams.page,
        limit: queryParams.limit,
        total,
        total_pages: totalPages,
      },
    };
  }

  /**
   * Gets detailed information about a specific project
   *
   * Business rules:
   * - Only project owner (client) or artisans (for open projects) can view details
   * - Includes proposals count
   *
   * @param projectId - ID of the project to retrieve
   * @param userId - ID of the user requesting the project
   * @param userRole - Role of the user requesting the project
   * @returns Promise containing detailed project information
   * @throws ProjectError if project not found or access denied
   *
   * @example
   * const project = await projectService.getProjectDetails(
   *   'project-uuid',
   *   'user-uuid',
   *   'client'
   * );
   */
  async getProjectDetails(projectId: string, userId: string, userRole: string): Promise<ProjectDTO> {
    // Step 1: Fetch project with related data
    const { data: project, error } = await this.supabase
      .from("projects")
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
      .eq("id", projectId)
      .single();

    if (error || !project) {
      throw new ProjectError("Nie znaleziono projektu", "PROJECT_NOT_FOUND", 404);
    }

    // Step 2: Authorization check
    const isOwner = project.client_id === userId;
    const isArtisanViewingOpenProject = userRole === "artisan" && project.status === "open";

    // Check if artisan has accepted proposal on this project (for in_progress/completed projects)
    let isArtisanWithAcceptedProposal = false;
    if (userRole === "artisan" && !isArtisanViewingOpenProject) {
      const { data: artisanProposal } = await this.supabase
        .from("proposals")
        .select("id")
        .eq("project_id", project.id)
        .eq("artisan_id", userId)
        .eq("id", project.accepted_proposal_id || "")
        .maybeSingle();

      isArtisanWithAcceptedProposal = !!artisanProposal;
    }

    if (!isOwner && !isArtisanViewingOpenProject && !isArtisanWithAcceptedProposal) {
      throw new ProjectError("Brak uprawnień do wyświetlenia tego projektu", "PROJECT_FORBIDDEN", 403);
    }

    // Step 3: Get proposals count
    const { count: proposalsCount } = await this.supabase
      .from("proposals")
      .select("*", { count: "exact", head: true })
      .eq("project_id", project.id);

    // Step 4: Transform to ProjectDTO format
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

  /**
   * Accepts a proposal for a project
   *
   * Business rules:
   * - Only project owner (client) can accept proposals
   * - Project must be in 'open' status
   * - Proposal must belong to the project
   * - Once accepted, project status changes to 'in_progress'
   * - Accepted proposal ID and price are stored in project
   *
   * @param projectId - ID of the project
   * @param proposalId - ID of the proposal to accept
   * @param userId - ID of the user performing the action (must be project owner)
   * @returns Promise containing the updated project with partial details
   * @throws ProjectError if validation fails or unauthorized
   *
   * @example
   * const updatedProject = await projectService.acceptProposal(
   *   "project-uuid",
   *   "proposal-uuid",
   *   clientId
   * );
   */
  async acceptProposal(
    projectId: string,
    proposalId: string,
    userId: string
  ): Promise<Pick<ProjectDTO, "id" | "status" | "accepted_proposal_id" | "accepted_price" | "updated_at">> {
    // Step 1: Fetch project
    const { data: project, error: projectError } = await this.supabase
      .from("projects")
      .select("id, client_id, status")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      throw new ProjectError("Nie znaleziono projektu", "PROJECT_NOT_FOUND", 404);
    }

    // Step 2: Authorization - check if user is project owner
    if (project.client_id !== userId) {
      throw new ProjectError("Nie masz uprawnień do akceptacji propozycji dla tego projektu", "PROJECT_FORBIDDEN", 403);
    }

    // Step 3: Validate project status is 'open'
    if (project.status !== "open") {
      throw new ProjectError("Nie można zaakceptować propozycji. Projekt nie jest otwarty", "PROJECT_NOT_OPEN", 400);
    }

    // Step 4: Fetch proposal and validate it belongs to project
    const { data: proposal, error: proposalError } = await this.supabase
      .from("proposals")
      .select("id, project_id, price")
      .eq("id", proposalId)
      .single();

    if (proposalError || !proposal) {
      throw new ProjectError("Nie znaleziono propozycji", "PROPOSAL_NOT_FOUND", 404);
    }

    if (proposal.project_id !== projectId) {
      throw new ProjectError("Propozycja nie należy do tego projektu", "PROPOSAL_PROJECT_MISMATCH", 400);
    }

    // Step 5: Update project - accept proposal
    const { data: updatedProject, error: updateError } = await this.supabase
      .from("projects")
      .update({
        status: "in_progress",
        accepted_proposal_id: proposalId,
        accepted_price: proposal.price,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId)
      .select("id, status, accepted_proposal_id, accepted_price, updated_at")
      .single();

    if (updateError || !updatedProject) {
      // eslint-disable-next-line no-console
      console.error("[ProjectService] Failed to accept proposal:", updateError);
      throw new ProjectError("Nie udało się zaakceptować propozycji", "PROPOSAL_ACCEPT_FAILED", 500);
    }

    return {
      id: updatedProject.id,
      status: updatedProject.status,
      accepted_proposal_id: updatedProject.accepted_proposal_id,
      accepted_price: updatedProject.accepted_price,
      updated_at: updatedProject.updated_at,
    };
  }

  /**
   * Updates the status of a project
   *
   * Business rules:
   * - Only the project owner (client) can update the status
   * - Valid status transitions:
   *   - open -> in_progress (via acceptProposal only, not directly)
   *   - open -> closed
   *   - in_progress -> completed
   *   - in_progress -> closed
   *   - completed -> closed
   *
   * @param projectId - ID of the project to update
   * @param newStatus - New status to set
   * @param userId - ID of the user making the request
   * @returns Promise containing updated project data
   * @throws ProjectError if validation fails or transition is invalid
   *
   * @example
   * const result = await projectService.updateProjectStatus(
   *   "project-uuid",
   *   "completed",
   *   "user-uuid"
   * );
   */
  async updateProjectStatus(
    projectId: string,
    newStatus: ProjectStatus,
    userId: string
  ): Promise<UpdateProjectStatusResponseDTO> {
    // Step 1: Fetch project with current status
    const { data: project, error: projectError } = await this.supabase
      .from("projects")
      .select("id, client_id, status")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      throw new ProjectError("Nie znaleziono projektu", "PROJECT_NOT_FOUND", 404);
    }

    // Step 2: Authorization - check if user is project owner
    if (project.client_id !== userId) {
      throw new ProjectError("Nie masz uprawnień do aktualizacji statusu tego projektu", "PROJECT_FORBIDDEN", 403);
    }

    // Step 3: Validate status transition
    const currentStatus = project.status;

    // If status is the same, no need to update
    if (currentStatus === newStatus) {
      return {
        id: project.id,
        status: currentStatus,
        updated_at: new Date().toISOString(),
      };
    }

    // Define valid transitions
    const validTransitions: Record<ProjectStatus, ProjectStatus[]> = {
      open: ["closed"], // open -> in_progress only via acceptProposal
      in_progress: ["completed", "closed"],
      completed: ["closed"],
      closed: [], // No transitions from closed
    };

    const allowedStatuses = validTransitions[currentStatus];

    if (!allowedStatuses.includes(newStatus)) {
      throw new ProjectError(
        `Niedozwolona zmiana statusu z '${currentStatus}' na '${newStatus}'`,
        "INVALID_STATUS_TRANSITION",
        400
      );
    }

    // Step 4: Update project status
    const { data: updatedProject, error: updateError } = await this.supabase
      .from("projects")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId)
      .select("id, status, updated_at")
      .single();

    if (updateError || !updatedProject) {
      // eslint-disable-next-line no-console
      console.error("[ProjectService] Failed to update project status:", updateError);
      throw new ProjectError("Nie udało się zaktualizować statusu projektu", "STATUS_UPDATE_FAILED", 500);
    }

    return {
      id: updatedProject.id,
      status: updatedProject.status,
      updated_at: updatedProject.updated_at,
    };
  }
}

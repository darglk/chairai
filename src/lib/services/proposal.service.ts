/**
 * Proposal Service
 *
 * Service responsible for managing artisan proposals for projects.
 * Handles proposal creation, validation, file uploads, and business logic.
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type { ProposalDTO } from "../../types";

/**
 * Custom error class for proposal-related business logic errors
 */
export class ProposalError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode = 400
  ) {
    super(message);
    this.name = "ProposalError";
  }
}

interface CreateProposalData {
  projectId: string;
  price: number;
  attachment: File;
  userId: string;
}

/**
 * Service for managing project proposals
 *
 * Provides methods for creating proposals, including validation
 * of user permissions, project status, and file upload handling.
 */
export class ProposalService {
  private readonly BUCKET_NAME = "proposal-attachments";
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  constructor(private supabase: SupabaseClient) {}

  /**
   * Creates a new proposal for a project
   *
   * Business rules:
   * - Only artisans can create proposals
   * - Project must exist and have status 'open'
   * - Artisan can only submit one proposal per project
   * - Attachment file must be uploaded to storage
   *
   * @param data - Proposal creation data including file attachment
   * @returns Promise containing the created proposal with full details
   * @throws ProposalError if validation fails or resources don't exist
   *
   * @example
   * const proposal = await proposalService.createProposal({
   *   projectId: "uuid-1",
   *   price: 2500,
   *   attachment: new File(...),
   *   userId: "artisan-uuid"
   * });
   */
  async createProposal(data: CreateProposalData): Promise<ProposalDTO> {
    const { projectId, price, attachment, userId } = data;

    // Step 1: Verify user is an artisan
    const { data: user, error: userError } = await this.supabase
      .from("users")
      .select("id, role")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      throw new ProposalError("Nie znaleziono użytkownika", "USER_NOT_FOUND", 404);
    }

    if (user.role !== "artisan") {
      throw new ProposalError("Tylko rzemieślnicy mogą składać propozycje", "FORBIDDEN_NOT_ARTISAN", 403);
    }

    // Step 2: Verify project exists and is open
    const { data: project, error: projectError } = await this.supabase
      .from("projects")
      .select("id, status, client_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      throw new ProposalError("Nie znaleziono projektu", "PROJECT_NOT_FOUND", 404);
    }

    if (project.status !== "open") {
      throw new ProposalError("Projekt nie przyjmuje już propozycji", "PROJECT_NOT_OPEN", 403);
    }

    // Step 3: Check if artisan already submitted a proposal for this project
    const { data: existingProposal } = await this.supabase
      .from("proposals")
      .select("id")
      .eq("project_id", projectId)
      .eq("artisan_id", userId)
      .maybeSingle();

    if (existingProposal) {
      throw new ProposalError("Już złożyłeś propozycję do tego projektu", "PROPOSAL_ALREADY_EXISTS", 409);
    }

    // Step 4: Upload attachment to storage
    const attachmentUrl = await this.uploadAttachment(attachment, userId, projectId);

    // Step 5: Create proposal in database
    const { data: newProposal, error: createError } = await this.supabase
      .from("proposals")
      .insert({
        project_id: projectId,
        artisan_id: userId,
        price,
        attachment_url: attachmentUrl,
      })
      .select(
        `
        id,
        project_id,
        price,
        attachment_url,
        created_at,
        artisan:users!proposals_artisan_id_fkey(
          user_id:id,
          artisan_profiles!inner(
            company_name
          )
        )
      `
      )
      .single();

    if (createError || !newProposal) {
      // Cleanup: Delete uploaded file if database insert fails
      await this.deleteAttachment(attachmentUrl);
      throw new ProposalError("Nie udało się utworzyć propozycji", "CREATE_PROPOSAL_FAILED", 500);
    }

    // Step 6: Get artisan profile with review statistics
    const { data: artisanProfile } = await this.supabase
      .from("artisan_profiles")
      .select("company_name")
      .eq("user_id", userId)
      .single();

    // Calculate review statistics (simplified for now)
    const { count: totalReviews } = await this.supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("project.proposals.artisan_id", userId);

    const { data: reviews } = await this.supabase
      .from("reviews")
      .select("rating")
      .eq("project.proposals.artisan_id", userId);

    const averageRating =
      reviews && reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;

    // Step 7: Format response as ProposalDTO
    const proposalDTO: ProposalDTO = {
      id: newProposal.id,
      project_id: newProposal.project_id,
      artisan: {
        user_id: userId,
        company_name: artisanProfile?.company_name || "Nieznany rzemieślnik",
        average_rating: averageRating,
        total_reviews: totalReviews || 0,
      },
      price: newProposal.price,
      attachment_url: newProposal.attachment_url,
      created_at: newProposal.created_at,
    };

    return proposalDTO;
  }

  /**
   * Upload proposal attachment to Supabase Storage
   *
   * @param file - File to upload
   * @param userId - Artisan user ID (for organizing files)
   * @param projectId - Project ID (for organizing files)
   * @returns Public URL of the uploaded file
   * @throws ProposalError if upload fails
   */
  private async uploadAttachment(file: File, userId: string, projectId: string): Promise<string> {
    try {
      // Validate file size (additional check)
      if (file.size > this.MAX_FILE_SIZE) {
        throw new ProposalError(
          `Rozmiar pliku nie może przekraczać ${this.MAX_FILE_SIZE / 1024 / 1024}MB`,
          "FILE_TOO_LARGE",
          400
        );
      }

      // Sanitize filename and create unique path
      const fileExtension = file.name.split(".").pop()?.toLowerCase() || "pdf";
      const sanitizedExtension = fileExtension.replace(/[^a-z0-9]/g, "");
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const fileName = `${userId}/${projectId}/${timestamp}-${random}.${sanitizedExtension}`;

      // Convert File to ArrayBuffer for upload
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      // Upload to Supabase Storage
      const { error: uploadError } = await this.supabase.storage.from(this.BUCKET_NAME).upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

      if (uploadError) {
        // eslint-disable-next-line no-console
        console.error("[ProposalService] Upload error:", uploadError);
        throw new ProposalError("Nie udało się przesłać załącznika", "UPLOAD_FAILED", 500);
      }

      // Get public URL
      const { data: publicUrlData } = this.supabase.storage.from(this.BUCKET_NAME).getPublicUrl(fileName);

      if (!publicUrlData?.publicUrl) {
        throw new ProposalError("Nie udało się wygenerować URL załącznika", "URL_GENERATION_FAILED", 500);
      }

      // eslint-disable-next-line no-console
      console.log("[ProposalService] Attachment uploaded successfully:", fileName);

      return publicUrlData.publicUrl;
    } catch (error) {
      if (error instanceof ProposalError) {
        throw error;
      }

      // eslint-disable-next-line no-console
      console.error("[ProposalService] Upload error:", error);
      throw new ProposalError("Wystąpił błąd podczas przesyłania załącznika", "UPLOAD_ERROR", 500);
    }
  }

  /**
   * Delete proposal attachment from Supabase Storage
   * Used for cleanup when proposal creation fails
   *
   * @param attachmentUrl - URL of the attachment to delete
   */
  private async deleteAttachment(attachmentUrl: string): Promise<void> {
    try {
      // Extract file path from URL
      const urlParts = attachmentUrl.split(`${this.BUCKET_NAME}/`);
      if (urlParts.length < 2) {
        return;
      }

      const filePath = urlParts[1];

      await this.supabase.storage.from(this.BUCKET_NAME).remove([filePath]);

      // eslint-disable-next-line no-console
      console.log("[ProposalService] Attachment deleted:", filePath);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[ProposalService] Failed to delete attachment:", error);
      // Don't throw - this is cleanup, failure is not critical
    }
  }
}

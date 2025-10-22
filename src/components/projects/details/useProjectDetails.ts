/**
 * useProjectDetails Hook
 *
 * Centralized state management for project details view.
 * Handles data fetching, mutations, and UI state.
 */

import { useState, useEffect, useCallback } from "react";
import type { ProjectDetailsViewModel } from "./types";
import type { ApiErrorDTO, CreateReviewCommand } from "@/types";

interface UseProjectDetailsReturn {
  project: ProjectDetailsViewModel | null;
  isLoading: boolean;
  error: ApiErrorDTO | null;
  acceptProposal: (proposalId: string) => Promise<void>;
  submitProposal: (data: FormData) => Promise<void>;
  completeProject: () => Promise<void>;
  submitReview: (data: CreateReviewCommand) => Promise<void>;
  refresh: () => void;
}

/**
 * Custom hook for managing project details data and actions
 */
export function useProjectDetails(projectId: string): UseProjectDetailsReturn {
  const [project, setProject] = useState<ProjectDetailsViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiErrorDTO | null>(null);

  /**
   * Fetch project details and transform to ViewModel
   */
  const fetchProject = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch project data and current user in parallel
      const [projectResponse, userResponse] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch("/api/users/me"),
      ]);

      if (!projectResponse.ok) {
        const errorData: ApiErrorDTO = await projectResponse.json();
        setError(errorData);
        return;
      }

      if (!userResponse.ok) {
        setError({
          error: {
            code: "AUTH_ERROR",
            message: "Nie udało się pobrać danych użytkownika",
          },
        });
        return;
      }

      const projectData = await projectResponse.json();
      const userData = await userResponse.json();

      // Fetch proposals if project is open or in_progress
      let proposals: ProjectDetailsViewModel["proposals"] = [];
      let hasProposed = false;

      if (projectData.status === "open" || projectData.status === "in_progress") {
        try {
          const proposalsResponse = await fetch(`/api/projects/${projectId}/proposals`);
          if (proposalsResponse.ok) {
            const proposalsData = await proposalsResponse.json();

            // Transform proposals to ViewModel
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            proposals = (proposalsData.data || []).map((p: any) => ({
              id: p.id,
              artisanId: p.artisan_id,
              artisanName: p.artisan_profiles?.company_name || "Nieznany rzemieślnik",
              artisanRating: null, // TODO: Add when reviews are implemented
              artisanReviewsCount: 0, // TODO: Add when reviews are implemented
              price: p.price,
              attachmentUrl: p.attachment_url || "",
              message: p.message || null,
              createdAt: formatRelativeDate(p.created_at),
            }));

            // Check if current user has already proposed
            hasProposed = proposals.some((p) => p.artisanId === userData.id);
          }
        } catch {
          // Proposals fetch failed, continue with empty array
          // Silently continue with empty proposals array
        }
      }

      // Find accepted proposal
      const acceptedProposal = projectData.accepted_proposal_id
        ? proposals.find((p) => p.id === projectData.accepted_proposal_id) || null
        : null;

      // Transform to ViewModel
      const viewModel: ProjectDetailsViewModel = {
        id: projectData.id,
        status: projectData.status,
        imageUrl: projectData.generated_image.image_url,
        prompt: projectData.generated_image.prompt,
        category: projectData.category.name,
        material: projectData.material.name,
        dimensions: projectData.dimensions,
        budgetRange: projectData.budget_range,
        isOwner: projectData.client_id === userData.id,
        hasProposed,
        proposals,
        acceptedProposal,
        createdAt: projectData.created_at,
        proposalsCount: projectData.proposals_count || proposals.length,
      };

      setProject(viewModel);
    } catch {
      setError({
        error: {
          code: "NETWORK_ERROR",
          message: "Nie udało się połączyć z serwerem",
        },
      });
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Initial fetch
  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  /**
   * Accept a proposal (client action)
   */
  const acceptProposal = async (proposalId: string): Promise<void> => {
    const response = await fetch(`/api/projects/${projectId}/accept-proposal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ proposal_id: proposalId }),
    });

    if (!response.ok) {
      const errorData: ApiErrorDTO = await response.json();
      throw new Error(errorData.error.message);
    }

    // Refresh project data
    await fetchProject();
  };

  /**
   * Submit a new proposal (artisan action)
   */
  const submitProposal = async (formData: FormData): Promise<void> => {
    const response = await fetch(`/api/projects/${projectId}/proposals`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData: ApiErrorDTO = await response.json();
      throw new Error(errorData.error.message);
    }

    // Refresh project data
    await fetchProject();
  };

  /**
   * Mark project as completed
   */
  const completeProject = async (): Promise<void> => {
    const response = await fetch(`/api/projects/${projectId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "completed" }),
    });

    if (!response.ok) {
      const errorData: ApiErrorDTO = await response.json();
      throw new Error(errorData.error.message);
    }

    // Refresh project data
    await fetchProject();
  };

  /**
   * Submit a review for completed project
   */
  const submitReview = async (data: CreateReviewCommand): Promise<void> => {
    const response = await fetch(`/api/projects/${projectId}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData: ApiErrorDTO = await response.json();
      throw new Error(errorData.error.message);
    }

    // Refresh project data
    await fetchProject();
  };

  /**
   * Manual refresh
   */
  const refresh = () => {
    fetchProject();
  };

  return {
    project,
    isLoading,
    error,
    acceptProposal,
    submitProposal,
    completeProject,
    submitReview,
    refresh,
  };
}

/**
 * Helper function to format relative date
 */
function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes <= 1 ? "przed chwilą" : `${diffMinutes} minut temu`;
    }
    return diffHours === 1 ? "godzinę temu" : `${diffHours} godzin temu`;
  }

  if (diffDays === 1) return "wczoraj";
  if (diffDays < 7) return `${diffDays} dni temu`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} tygodni temu`;

  return date.toLocaleDateString("pl-PL");
}

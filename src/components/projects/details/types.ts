/**
 * View Models for Project Details View
 *
 * These types transform API DTOs into UI-optimized data structures
 */

import type { ProjectStatus } from "@/types";

/**
 * ProposalViewModel - Simplified proposal data for UI rendering
 */
export interface ProposalViewModel {
  id: string;
  artisanId: string;
  artisanName: string;
  artisanRating: number | null;
  artisanReviewsCount: number;
  price: number;
  attachmentUrl: string;
  message: string | null;
  createdAt: string;
}

/**
 * ProjectDetailsViewModel - Aggregated project data optimized for the details view
 */
export interface ProjectDetailsViewModel {
  id: string;
  status: ProjectStatus;
  imageUrl: string;
  prompt: string | null;
  category: string;
  material: string;
  dimensions: string | null;
  budgetRange: string | null;
  isOwner: boolean;
  hasProposed: boolean;
  proposals: ProposalViewModel[];
  acceptedProposal: ProposalViewModel | null;
  createdAt: string;
  proposalsCount: number;
}

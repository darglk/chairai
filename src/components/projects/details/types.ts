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
 * ReviewViewModel - Review data for UI rendering
 */
export interface ReviewViewModel {
  id: string;
  reviewer_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
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
  hasReviewed: boolean;
  reviews: ReviewViewModel[];
  proposals: ProposalViewModel[];
  acceptedProposal: ProposalViewModel | null;
  createdAt: string;
  proposalsCount: number;
}

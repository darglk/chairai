/**
 * AcceptedProposal Component
 *
 * Displays details of the accepted proposal for projects in "in_progress" status.
 * Shows artisan information, accepted price, and attachment link.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Download, CheckCircle2 } from "lucide-react";
import type { ProposalViewModel } from "./types";

interface AcceptedProposalProps {
  proposal: ProposalViewModel;
}

export function AcceptedProposal({ proposal }: AcceptedProposalProps) {
  return (
    <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
          <CardTitle className="text-lg">Zaakceptowana oferta</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Artisan Info */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{proposal.artisanName}</span>
            </div>
            {proposal.artisanRating !== null && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>⭐ {proposal.artisanRating.toFixed(1)}</span>
                <span>•</span>
                <span>{proposal.artisanReviewsCount} opinii</span>
              </div>
            )}
          </div>
          <Badge variant="secondary" className="text-lg font-bold">
            {proposal.price.toLocaleString("pl-PL")} PLN
          </Badge>
        </div>

        {/* Message if available */}
        {proposal.message && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">Wiadomość:</p>
            <p className="text-sm">{proposal.message}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {proposal.attachmentUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={proposal.attachmentUrl} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Pobierz załącznik
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" asChild className="ml-auto">
            <a href={`/profile/${proposal.artisanId}`}>Zobacz profil rzemieślnika</a>
          </Button>
        </div>

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground pt-2 border-t">Zaakceptowano: {proposal.createdAt}</p>
      </CardContent>
    </Card>
  );
}

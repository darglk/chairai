import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, User } from "lucide-react";

interface ArtisanProfile {
  company_name: string;
}

interface Proposal {
  id: string;
  project_id: string;
  artisan_id: string;
  price: number;
  message: string | null;
  attachment_url: string | null;
  created_at: string;
  artisan_profiles: ArtisanProfile;
}

interface ProposalsListProps {
  projectId: string;
  onProposalAccepted?: () => void;
}

/**
 * ProposalsList Component
 *
 * Displays list of proposals for a project (client view).
 * Allows client to view and accept proposals.
 */
export function ProposalsList({ projectId, onProposalAccepted }: ProposalsListProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptingProposalId, setAcceptingProposalId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/projects/${projectId}/proposals`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Nie udało się załadować ofert");
        }

        setProposals(result.data || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Nie udało się załadować ofert";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProposals();
  }, [projectId]);

  const handleAcceptProposal = async (proposalId: string) => {
    if (acceptingProposalId) return; // Prevent multiple clicks

    setAcceptingProposalId(proposalId);

    try {
      const response = await fetch(`/api/projects/${projectId}/accept-proposal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ proposal_id: proposalId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Nie udało się zaakceptować oferty");
      }

      // Call parent callback to refresh project data
      if (onProposalAccepted) {
        onProposalAccepted();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił błąd podczas akceptacji oferty";
      alert(errorMessage);
    } finally {
      setAcceptingProposalId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Złożone oferty</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Złożone oferty</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Złożone oferty ({proposals.length})</CardTitle>
        <CardDescription>Przejrzyj oferty od rzemieślników i wybierz najlepszą dla Ciebie</CardDescription>
      </CardHeader>
      <CardContent>
        {proposals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Brak złożonych ofert</p>
            <p className="text-sm text-muted-foreground mt-2">
              Rzemieślnicy będą mogli składać oferty po opublikowaniu projektu.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal) => (
              <Card key={proposal.id} className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`/artisan/${proposal.artisan_id}`}
                          className="font-semibold hover:text-primary hover:underline transition-colors"
                        >
                          {proposal.artisan_profiles.company_name}
                        </a>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-lg font-bold">
                      {proposal.price.toLocaleString("pl-PL")} PLN
                    </Badge>
                  </div>

                  {proposal.message && (
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-1">Wiadomość:</p>
                      <p className="text-sm">{proposal.message}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {proposal.attachment_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={proposal.attachment_url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" />
                          Pobierz załącznik
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="ml-auto"
                      onClick={() => handleAcceptProposal(proposal.id)}
                      disabled={acceptingProposalId !== null}
                    >
                      {acceptingProposalId === proposal.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Akceptowanie...
                        </>
                      ) : (
                        "Akceptuj ofertę"
                      )}
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground mt-4">
                    {"Złożona: "}
                    {new Date(proposal.created_at).toLocaleDateString("pl-PL", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

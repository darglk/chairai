import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface ProposalFormProps {
  projectId: string;
}

/**
 * ProposalForm Component
 *
 * Form for artisans to submit proposals for a project.
 * Includes price, message, and optional attachment.
 */
export function ProposalForm({ projectId }: ProposalFormProps) {
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Plik jest za duży. Maksymalny rozmiar to 5MB.");
        return;
      }
      // Validate file type
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        setError("Nieprawidłowy typ pliku. Dozwolone: PDF, JPG, PNG.");
        return;
      }
      setAttachment(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const priceNum = parseFloat(price);
    if (!price || priceNum <= 0) {
      setError("Cena musi być większa od 0");
      return;
    }

    if (!attachment) {
      setError("Załącznik jest wymagany");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("price", priceNum.toString());
      formData.append("attachment", attachment);

      const response = await fetch(`/api/projects/${projectId}/proposals`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Nie udało się złożyć oferty");
      }

      setSuccess(true);
      setPrice("");
      setMessage("");
      setAttachment(null);
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Wystąpił błąd podczas składania oferty. Spróbuj ponownie.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Oferta wysłana</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Twoja oferta została pomyślnie wysłana. Klient otrzymał powiadomienie i wkrótce ją rozpatrzy.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Złóż ofertę</CardTitle>
        <CardDescription>Zaproponuj swoją cenę i przedstaw swoje podejście do realizacji tego projektu</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Proponowana cena (PLN)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              placeholder="np. 1500.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Wiadomość (opcjonalnie)</Label>
            <Textarea
              id="message"
              placeholder="Opisz swoje doświadczenie, podejście do projektu lub pytania do klienta..."
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">To dobra okazja aby wyróżnić się na tle innych ofert</p>
          </div>

          {/* Attachment */}
          <div className="space-y-2">
            <Label htmlFor="attachment">Załącznik (wymagany)</Label>
            <Input
              id="attachment"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleAttachmentChange}
              disabled={isSubmitting}
              required
            />
            <p className="text-xs text-muted-foreground">
              Prześlij portfolio, zdjęcia wcześniejszych prac lub szczegółową ofertę (PDF, JPG, PNG; max 5MB)
            </p>
            {attachment && <p className="text-sm text-green-600">Wybrany plik: {attachment.name}</p>}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wysyłanie...
              </>
            ) : (
              "Wyślij ofertę"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

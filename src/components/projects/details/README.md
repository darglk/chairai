# Project Details View Components

Komponenty widoku szczegółów projektu, które dynamicznie dostosowują się do statusu projektu i roli użytkownika.

## Struktura

```
/src/components/projects/details/
├── index.ts                  # Barrel export
├── types.ts                  # ViewModels (ProjectDetailsViewModel, ProposalViewModel)
├── useProjectDetails.ts      # Custom hook do zarządzania stanem
├── AcceptedProposal.tsx      # Komponent zaakceptowanej oferty
├── ChatWidget.tsx            # Widget czatu (placeholder)
├── ReviewForm.tsx            # Formularz opinii
└── README.md                 # Ten plik
```

## Hook: `useProjectDetails`

Centralizuje zarządzanie stanem i akcjami dla widoku szczegółów projektu.

### Zwracane wartości:
- `project: ProjectDetailsViewModel | null` - Dane projektu
- `isLoading: boolean` - Stan ładowania
- `error: ApiErrorDTO | null` - Błąd
- `acceptProposal: (proposalId: string) => Promise<void>` - Akceptacja oferty
- `submitProposal: (formData: FormData) => Promise<void>` - Złożenie oferty
- `completeProject: () => Promise<void>` - Zakończenie projektu
- `submitReview: (data: CreateReviewCommand) => Promise<void>` - Wysłanie opinii
- `refresh: () => void` - Manualne odświeżenie

### Przykład użycia:
```tsx
const { project, isLoading, error, acceptProposal, refresh } = useProjectDetails(projectId);
```

## Komponenty

### `AcceptedProposal`
Wyświetla szczegóły zaakceptowanej oferty w projektach `in_progress`.

**Props:**
- `proposal: ProposalViewModel` - Dane zaakceptowanej oferty

### `ChatWidget`
Prosty widget czatu do komunikacji (obecnie placeholder).

**Props:**
- `projectId?: string` - ID projektu
- `messages?: ChatMessage[]` - Lista wiadomości
- `onSendMessage?: (message: string) => void` - Callback wysyłania wiadomości

### `ReviewForm`
Formularz wystawiania opinii z gwiazdkami i komentarzem.

**Props:**
- `onSubmit: (data: CreateReviewCommand) => Promise<void>` - Callback wysyłania opinii
- `isLoading?: boolean` - Stan ładowania

## ViewModels

### `ProjectDetailsViewModel`
Zagregowane dane projektu zoptymalizowane dla UI:
- Zawiera wszystkie kluczowe informacje o projekcie
- Flagi `isOwner`, `hasProposed` dla logiki warunkowej
- Lista propozycji i zaakceptowana propozycja
- Formatowane daty i relatywne czasy

### `ProposalViewModel`
Uproszczone dane oferty:
- Informacje o rzemieślniku
- Cena i załącznik
- Sformatowane daty

## Logika warunkowa

Widok dostosowuje się do statusu projektu:

### Status: `open`
- **Właściciel (klient):** Widzi listę ofert z możliwością akceptacji
- **Rzemieślnik (nie złożył oferty):** Widzi formularz składania oferty
- **Rzemieślnik (złożył ofertę):** Widzi komunikat o wysłanej ofercie

### Status: `in_progress`
- Wyświetla zaakceptowaną ofertę
- Wyświetla widget czatu do komunikacji

### Status: `completed`
- Wyświetla formularz opinii

### Status: `closed`
- Wyświetla komunikat o zamknięciu projektu

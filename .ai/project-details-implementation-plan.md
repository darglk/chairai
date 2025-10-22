# Plan implementacji widoku szczegółów projektu

## 1. Przegląd

Strona szczegółów projektu to kluczowy widok, który dostosowuje się dynamicznie do roli użytkownika (Klient/Rzemieślnik) i statusu projektu (open/in_progress/completed/closed). Zapewnia pełną funkcjonalność związaną z projektem: składanie ofert, ich akceptację, komunikację i wystawianie recenzji.

## 2. Struktura komponentów

```
/src/pages/projects/[projectId].astro (Dynamic route, SSR)
└── /src/components/projects/
    ├── ProjectDetailsView.tsx (Main container, client-side)
    │   ├── ProjectHeader.tsx (Breadcrumb, status badge)
    │   ├── ProjectInfo.tsx (Image, category, material, dimensions, budget)
    │   ├── ProposalsList.tsx (For client - list of proposals)
    │   ├── ProposalForm.tsx (For artisan - submit proposal)
    │   ├── AcceptedProposal.tsx (For both - accepted proposal details)
    │   ├── ChatWidget.tsx (For in_progress - communication)
    │   └── ReviewForm.tsx (For completed - mutual reviews)
    └── /src/components/projects/proposals/
        ├── ProposalCard.tsx (Single proposal card)
        └── useProposals.ts (Hook for proposal management)
```

## 3. Etapy implementacji

### Etap 1: Endpoint GET /api/projects/[projectId]

- Zwraca szczegóły projektu z relacjami (generated_image, category, material, client)
- Sprawdza autoryzację (tylko client projektu lub artisans mogą zobaczyć)
- Zawiera proposals_count dla klienta
- Status codes: 200, 401, 403, 404

### Etap 2: Strona Astro i routing dynamiczny

- `/src/pages/projects/[projectId].astro`
- SSR - sprawdzenie autoryzacji
- Przekierowanie do /login jeśli niezalogowany
- Renderuje React root dla ProjectDetailsView

### Etap 3: Główny komponent ProjectDetailsView

- Pobiera dane projektu z API
- Pobiera dane użytkownika (role)
- Renderuje warunkowe komponenty na podstawie:
  - userRole (client/artisan)
  - projectStatus (open/in_progress/completed/closed)
  - isOwner (czy użytkownik jest właścicielem projektu)

### Etap 4: Komponenty szczegółów projektu

- ProjectHeader - breadcrumb, status badge
- ProjectInfo - główne informacje o projekcie

### Etap 5: Komponenty dla statusu 'open'

- ProposalsList - lista ofert dla klienta
- ProposalCard - karta pojedynczej oferty z przyciskiem akceptacji
- ProposalForm - formularz dla rzemieślnika do złożenia oferty

### Etap 6: Komponenty dla statusu 'in_progress'

- AcceptedProposal - szczegóły zaakceptowanej oferty
- ChatWidget - placeholder dla czatu (TODO: integracja zewnętrzna)

### Etap 7: Komponenty dla statusu 'completed'

- ReviewForm - formularz wystawiania oceny

## 4. Typy danych

```typescript
// Extended ProjectDTO with client info
interface ProjectDetailsDTO extends ProjectDTO {
  client: {
    id: string;
    email: string;
  };
  proposals?: ProposalDTO[];
}

interface ProposalDTO {
  id: string;
  artisan_id: string;
  artisan: {
    user_id: string;
    business_name: string;
    average_rating: number | null;
  };
  project_id: string;
  proposed_price: string;
  message: string | null;
  attachment_url: string | null;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}
```

## 5. Logika renderowania warunkowego

### Client + status: open

- ProjectInfo (read-only)
- ProposalsList (with accept buttons)

### Artisan + status: open

- ProjectInfo (read-only)
- ProposalForm (submit proposal)
- Existing proposal (if already submitted)

### Client/Artisan + status: in_progress

- ProjectInfo (read-only)
- AcceptedProposal
- ChatWidget

### Client/Artisan + status: completed

- ProjectInfo (read-only)
- AcceptedProposal (summary)
- ReviewForm (if not reviewed yet)

### Client/Artisan + status: closed

- ProjectInfo (read-only)
- Summary message

## 6. MVP Scope

- ✅ Endpoint GET /api/projects/[projectId]
- ✅ Dynamic Astro page
- ✅ ProjectDetailsView with conditional rendering
- ✅ ProjectInfo component
- ✅ ProposalsList + ProposalCard (for client)
- ✅ ProposalForm (for artisan)
- ⏸️ ChatWidget (placeholder - "Wkrótce dostępne")
- ⏸️ ReviewForm (placeholder - "Wkrótce dostępne")
- ⏸️ AcceptedProposal (simplified version)

## 7. Bezpieczeństwo

- RLS na proposals - tylko artisan właściciel i client projektu mogą widzieć
- Endpoint sprawdza czy użytkownik ma dostęp do projektu
- Walidacja statusów przed akcjami (nie można złożyć oferty na zamknięty projekt)

# Komponenty formularza tworzenia projektu

Zestaw komponentów implementujących funkcjonalność tworzenia nowych projektów z wygenerowanych obrazów AI.

## 📁 Struktura plików

```
src/components/projects/
├── ProjectFormContainer.tsx          # Główny kontener formularza
├── SelectedImageView.tsx             # Wyświetlanie wybranego obrazu
├── FormField.tsx                     # Uniwersalne pole formularza
└── hooks/
    └── useProjectForm.ts             # Logika biznesowa formularza
```

## 🎯 ProjectFormContainer.tsx

Główny komponent kontenera zarządzający formularzem tworzenia projektu.

### Props

```typescript
interface ProjectFormContainerProps {
  imageId: string; // UUID wybranego obrazu
  imageUrl: string; // URL obrazu do wyświetlenia
  imagePrompt: string | null; // Prompt użyty do generacji obrazu
  categories: CategoryDTO[]; // Lista dostępnych kategorii
  materials: MaterialDTO[]; // Lista dostępnych materiałów
}
```

### Użycie

```tsx
<ProjectFormContainer
  client:load
  imageId="abc-123"
  imageUrl="https://..."
  imagePrompt="Modern wooden chair"
  categories={categories}
  materials={materials}
/>
```

### Funkcjonalności

- ✅ Zarządzanie stanem formularza poprzez custom hook
- ✅ Walidacja pól wymaganych i opcjonalnych
- ✅ Obsługa błędów API (400, 401, 403, 409, 5xx)
- ✅ Wskaźnik ładowania podczas wysyłania
- ✅ Responsywny układ (mobile-first)
- ✅ Pełna dostępność (ARIA, keyboard navigation)

---

## 🖼️ SelectedImageView.tsx

Komponent prezentacyjny wyświetlający wybrany obraz.

### Props

```typescript
interface SelectedImageViewProps {
  imageUrl: string; // URL obrazu
  prompt: string | null; // Opcjonalny prompt
}
```

### Użycie

```tsx
<SelectedImageView imageUrl="https://example.com/image.jpg" prompt="Modern wooden chair with armrests" />
```

### Cechy

- 📐 Proporcje 16:9 (aspect-video)
- 🎨 Efekt hover (scale + shadow)
- ♿ Lazy loading obrazów
- 📱 Responsywny padding

---

## 📝 FormField.tsx

Uniwersalny komponent pola formularza obsługujący input i select.

### Props

```typescript
interface FormFieldProps {
  label: string; // Etykieta pola
  name: string; // ID/name pola
  value: string; // Wartość pola
  error?: string; // Komunikat błędu
  onChange: (value: string) => void; // Handler zmiany wartości
  onBlur: () => void; // Handler blur
  type: "text" | "select"; // Typ pola
  options?: FormFieldOption[]; // Opcje dla select
  placeholder?: string; // Placeholder dla input
  required?: boolean; // Czy pole wymagane
}

interface FormFieldOption {
  id: string;
  name: string;
}
```

### Użycie - Input

```tsx
<FormField
  label="Wymiary"
  name="dimensions"
  value={formData.dimensions}
  error={errors.dimensions}
  onChange={(value) => handleChange("dimensions", value)}
  onBlur={() => handleBlur("dimensions")}
  type="text"
  placeholder="np. 120cm x 80cm x 75cm"
/>
```

### Użycie - Select

```tsx
<FormField
  label="Kategoria"
  name="category_id"
  value={formData.category_id}
  error={errors.category_id}
  onChange={(value) => handleChange("category_id", value)}
  onBlur={() => handleBlur("category_id")}
  type="select"
  options={categories.map((cat) => ({ id: cat.id, name: cat.name }))}
  required
/>
```

### Cechy

- ♿ ARIA labels i error descriptions
- 🎨 Animacje fade-in dla błędów
- 📱 Responsywne rozmiary tekstu
- ✨ Visual feedback dla stanów (error, focus)

---

## 🎣 useProjectForm.ts

Custom hook zarządzający logiką biznesową formularza.

### Interfejsy

```typescript
interface ProjectFormViewModel {
  category_id: string;
  material_id: string;
  dimensions: string;
  budget_range: string;
}

interface FormErrors {
  category_id?: string;
  material_id?: string;
  dimensions?: string;
  budget_range?: string;
  general?: string;
}

interface UseProjectFormOptions {
  imageId: string;
  onSuccess?: (projectId: string) => void;
}
```

### Zwracane wartości

```typescript
{
  formData: ProjectFormViewModel;           // Dane formularza
  errors: FormErrors;                       // Błędy walidacji
  isLoading: boolean;                       // Status ładowania
  handleChange: (name, value) => void;      // Handler zmiany pola
  handleBlur: (name) => void;               // Handler blur
  handleSubmit: (e) => Promise<void>;       // Handler wysyłania
  handleCancel: () => void;                 // Handler anulowania
}
```

### Użycie

```typescript
const { formData, errors, isLoading, handleChange, handleBlur, handleSubmit, handleCancel } = useProjectForm({
  imageId: "abc-123",
  onSuccess: (projectId) => {
    console.log("Project created:", projectId);
  },
});
```

### Walidacja

#### Pola wymagane:

- `category_id`: "Kategoria jest wymagana"
- `material_id`: "Materiał jest wymagany"

#### Pola opcjonalne z walidacją:

- `dimensions`: Min. 5 znaków (jeśli wypełnione)

#### Pola opcjonalne bez walidacji:

- `budget_range`

### Obsługa błędów API

| Status        | Akcja                                    |
| ------------- | ---------------------------------------- |
| 400           | Wyświetlenie błędów walidacji z backendu |
| 401/403       | Przekierowanie na `/login`               |
| 409           | "Ten obraz został już wykorzystany"      |
| 5xx           | "Wystąpił nieoczekiwany błąd"            |
| Network Error | "Wystąpił błąd połączenia"               |

---

## 🎨 Stylowanie

### Tailwind Classes

Komponenty używają:

- `space-y-*` - Vertical spacing
- `md:*` - Responsive breakpoints
- `animate-in`, `fade-in`, `slide-in-from-*` - Animations
- `text-destructive` - Error states
- `aria-invalid:*` - Accessibility states

### Dark Mode

Wszystkie komponenty wspierają dark mode poprzez:

- `text-muted-foreground`
- `bg-card`
- `border`
- Shadcn/ui components

---

## ♿ Dostępność

### ARIA Attributes

- `aria-invalid`: Oznaczenie pól z błędami
- `aria-describedby`: Powiązanie błędów z polami
- `aria-live="assertive"`: Ogłaszanie błędów globalnych
- `aria-label`: Oznaczenie gwiazdek wymaganych pól

### Keyboard Navigation

- Tab/Shift+Tab: Nawigacja między polami
- Enter: Wysyłanie formularza
- Escape: Zamykanie select dropdown

### Screen Readers

- Wszystkie pola mają etykiety
- Błędy są odczytywane przy blur
- Stan ładowania jest komunikowany

---

## 📱 Responsywność

### Breakpoints

- **Mobile** (< 640px): Pełna szerokość, przyciski w kolumnie
- **Tablet** (≥ 640px): Przyciski obok siebie
- **Desktop** (≥ 768px): Większe fonty i padding

### Layout

```
Mobile:          Desktop:
[Content]        [Content]
[Form]           [Image] [Form]
[Cancel]         [Cancel] [Submit]
[Submit]
```

---

## 🧪 Testowanie

Zobacz: `/tests/manual/TC-PROJECT-FORM-MANUAL-TESTS.md`

### Scenariusze testowe:

1. ✅ Pomyślne utworzenie projektu
2. ✅ Walidacja pól wymaganych
3. ✅ Walidacja minimalnej długości
4. ✅ Pola opcjonalne
5. ✅ Anulowanie formularza
6. ✅ Błędy API (401, 403, 409, 5xx)
7. ✅ Błędy sieci
8. ✅ Responsywność
9. ✅ Dostępność

---

## 🔗 Integracja z API

### Endpointy

```typescript
POST /api/projects
Content-Type: application/json

{
  "generated_image_id": "uuid",
  "category_id": "uuid",
  "material_id": "uuid",
  "dimensions": "string", // opcjonalne
  "budget_range": "string" // opcjonalne
}
```

### Odpowiedź (201 Created)

```typescript
{
  "id": "uuid",
  "client_id": "uuid",
  "generated_image": { ... },
  "category": { ... },
  "material": { ... },
  "status": "open",
  "dimensions": "string",
  "budget_range": "string",
  "proposals_count": 0,
  "created_at": "ISO-8601",
  "updated_at": "ISO-8601"
}
```

---

## 📚 Powiązane pliki

- **Strona Astro**: `/src/pages/projects/new/[imageId].astro`
- **Typy**: `/src/types.ts` (CategoryDTO, MaterialDTO, CreateProjectCommand)
- **API Endpoint**: `/src/pages/api/projects/index.ts`
- **Plan implementacji**: `/.ai/formularz-tworzenia-projektu-view-implementation-plan.md`

---

## 🚀 Następne kroki

### Potencjalne ulepszenia:

- [ ] Zapisywanie draft w localStorage
- [ ] Podpowiedzi AI dla wymiarów/budżetu
- [ ] Podgląd jak projekt będzie wyglądał
- [ ] Multi-step wizard dla złożonych projektów
- [ ] Upload dodatkowych zdjęć referencyjnych
- [ ] Historia ostatnio wybranych kategorii/materiałów

---

## 📄 Licencja

Część projektu ChairAI © 2025

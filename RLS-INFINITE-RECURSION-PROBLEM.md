# Problem RLS - Infinite Recursion w Galerii

**Data zgłoszenia:** 19 października 2025  
**Status:** 🔴 KRYTYCZNY - Wymaga naprawy  
**Wpływ:** Funkcjonalność filtrowania i wykrywania użytych obrazów

---

## 📋 Podsumowanie

Podczas implementacji widoku galerii wygenerowanych obrazów napotkano problem z **infinite recursion w Row Level Security (RLS) policies** dla tabeli `projects`. Problem uniemożliwia:

1. Sprawdzanie czy obraz został użyty w projekcie (`is_used` flag)
2. Filtrowanie tylko nieużytych obrazów (`unused_only` parameter)

---

## 🐛 Szczegóły błędu

### Komunikat błędu:

```
Failed to fetch used images: infinite recursion detected in policy for relation "projects"
```

### Lokalizacja:

- **Plik:** `src/lib/services/generated-images.service.ts`
- **Metoda:** `listUserGeneratedImages()`
- **Linia problematyczna:** Każde zapytanie SELECT do tabeli `projects`

### Stack trace:

```typescript
await this.supabase.from("projects").select("generated_image_id");
// ❌ Błąd: infinite recursion w RLS policy
```

---

## 🔍 Analiza przyczyny

### Polityki RLS dla tabeli `projects`:

```sql
-- Z migracji: supabase/migrations/20251012080000_initial_schema.sql

-- Polityka 1: Pozwala każdemu zobaczyć otwarte projekty
create policy "allow anyone to view open projects" on public.projects for select
    using (status = 'open');

-- Polityka 2: Pozwala klientom zarządzać własnymi projektami
create policy "allow clients to manage their own projects" on public.projects for all
    using (auth.uid() = client_id);

-- Polityka 3: Pozwala rzemieślnikom zobaczyć projekty z ich propozycjami
create policy "allow involved artisans to view projects" on public.projects for select
    using (exists (
      select 1
      from public.proposals
      where project_id = id and artisan_id = auth.uid()
    ));
```

### Problem:

**Polityka 3** używa subquery do tabeli `proposals`:

```sql
using (exists (
  select 1 from public.proposals
  where project_id = id and artisan_id = auth.uid()
))
```

Ta polityka może powodować infinite recursion gdy:

1. Zapytanie do `projects` próbuje sprawdzić politykę
2. Polityka wykonuje subquery do `proposals`
3. `proposals` ma foreign key do `projects`
4. Sprawdzanie FK może wymagać sprawdzenia polityki `projects`
5. Cykl się powtarza → infinite recursion

---

## 🛠️ Tymczasowe rozwiązanie

### Zastosowane w kodzie:

**Zmiana 1: Usunięcie zapytań do tabeli `projects`**

```typescript
// ❌ PRZED (powodowało infinite recursion):
if (params.unused_only) {
  const { data: usedImages } = await this.supabase.from("projects").select("generated_image_id");
  usedImageIds = usedImages?.map((p) => p.generated_image_id) || [];
}

// ✅ PO (tymczasowe rozwiązanie):
// Parametr unused_only jest ignorowany
// is_used zawsze ustawione na false
```

**Zmiana 2: Hardcoded `is_used = false`**

```typescript
const imageDTOs: GeneratedImageDTO[] = images.map((img) => ({
  id: img.id,
  user_id: img.user_id,
  prompt: img.prompt,
  image_url: img.image_url,
  created_at: img.created_at,
  is_used: false, // ⚠️ Tymczasowo zawsze false
}));
```

**Zmiana 3: Wyłączony filtr w UI**

```tsx
// src/components/gallery/ImageGalleryContainer.tsx
// Filtr "Tylko nieużyte obrazy" został usunięty z UI
// TODO: Przywrócić po naprawie RLS
```

---

## ✅ Trwałe rozwiązania (do wyboru)

### Opcja 1: Naprawienie polityki RLS (ZALECANE)

**Problem:** Polityka 3 używa rekursywnego subquery

**Rozwiązanie:**  
Zastąpić subquery join'em lub użyć funkcji pomocniczej:

```sql
-- Opcja A: Użycie funkcji
CREATE OR REPLACE FUNCTION user_has_proposal_for_project(project_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.proposals
    WHERE project_id = project_uuid
    AND artisan_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Zaktualizowana polityka
DROP POLICY "allow involved artisans to view projects" ON public.projects;
CREATE POLICY "allow involved artisans to view projects" ON public.projects FOR SELECT
  USING (user_has_proposal_for_project(id));
```

```sql
-- Opcja B: Uproszczenie polityki (bez subquery)
-- Wymaga dodania indeksu na proposals(artisan_id, project_id)
DROP POLICY "allow involved artisans to view projects" ON public.projects;
CREATE POLICY "allow involved artisans to view projects" ON public.projects FOR SELECT
  USING (
    id IN (
      SELECT project_id FROM public.proposals WHERE artisan_id = auth.uid()
    )
  );
```

### Opcja 2: Dodanie kolumny `is_used` w tabeli `generated_images`

**Koncepcja:** Denormalizacja - przechowywanie flagi bezpośrednio w tabeli

```sql
-- Migracja
ALTER TABLE public.generated_images
ADD COLUMN is_used BOOLEAN NOT NULL DEFAULT FALSE;

-- Trigger aktualizuj ący flagę
CREATE OR REPLACE FUNCTION update_generated_image_used_status()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.generated_images
    SET is_used = TRUE
    WHERE id = NEW.generated_image_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.generated_images
    SET is_used = FALSE
    WHERE id = OLD.generated_image_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_update_image_status
AFTER INSERT OR DELETE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION update_generated_image_used_status();
```

**Zalety:**

- ✅ Szybsze zapytania (brak JOIN'ów)
- ✅ Brak problemów z RLS
- ✅ Prostsza logika w aplikacji

**Wady:**

- ❌ Denormalizacja danych
- ❌ Wymaga synchronizacji przez trigger

### Opcja 3: Użycie service role key dla tego zapytania

**Koncepcja:** Ominięcie RLS dla service account

```typescript
// Utworzenie oddzielnego klienta Supabase z service role
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // ⚠️ Backend only!
  { auth: { persistSession: false } }
);

// Użycie w serwisie
const { data: projects } = await supabaseAdmin.from("projects").select("generated_image_id").eq("client_id", userId); // Bezpieczne - sprawdzamy tylko projekty danego usera
```

**Zalety:**

- ✅ Szybkie wdrożenie
- ✅ Brak zmian w schemacie DB

**Wady:**

- ❌ Wymaga dodatkowego klucza API
- ❌ Omija security layer (wymaga ostrożności)

---

## 🚀 Rekomendowany plan działania

1. **Krótkoterminowo (do 1 tygodnia):**
   - ✅ Użyć Opcji 3 (service role) jako quick fix
   - Przywrócić funkcjonalność `is_used` i filtrowanie
   - Przetestować wydajność

2. **Długoterminowo (do 1 miesiąca):**
   - Zaimplementować Opcję 2 (kolumna `is_used` + trigger)
   - Przeprowadzić migrację danych
   - Usunąć workaround z service role

3. **Alternatywnie:**
   - Naprawić politykę RLS (Opcja 1)
   - Jeśli to nie rozwiąże problemu, fallback na Opcję 2

---

## 📝 Checklist do wdrożenia rozwiązania

### Przed wdrożeniem:

- [ ] Backup bazy danych
- [ ] Przegląd wszystkich polityk RLS
- [ ] Testy na środowisku dev

### Wdrożenie:

- [ ] Utworzenie migracji
- [ ] Wdrożenie na staging
- [ ] Testy E2E
- [ ] Wdrożenie na production

### Po wdrożeniu:

- [ ] Przywrócenie filtra w UI
- [ ] Aktualizacja dokumentacji
- [ ] Usunięcie workaround'ów z kodu
- [ ] Testy manuals zgodnie z `tests/GALLERY-TESTING-PLAN.md`

---

## 📚 Pliki wymagające zmian po naprawie

1. `src/lib/services/generated-images.service.ts`
   - Usunąć komentarze TODO
   - Przywrócić logikę sprawdzania `is_used`
   - Przywrócić filtrowanie `unused_only`

2. `src/components/gallery/ImageGalleryContainer.tsx`
   - Przywrócić UI filtra
   - Usunąć komentarze TODO

3. `src/components/hooks/useImageGallery.ts`
   - Sprawdzić czy filtrowanie działa poprawnie

4. `supabase/migrations/` (nowa migracja)
   - Implementacja wybranego rozwiązania

5. `tests/GALLERY-TESTING-PLAN.md`
   - Zaktualizować sekcję filtrowania
   - Dodać testy dla `is_used` flag

---

## 🔗 Przydatne linki

- [Supabase RLS Docs](https://supabase.com/docs/guides/auth/row-level-security)
- [Postgres Recursion](https://www.postgresql.org/docs/current/queries-with.html)
- [Issue w kodzie - GeneratedImagesService](../src/lib/services/generated-images.service.ts)

---

## 👥 Contact

- **Developer:** AI Assistant
- **Reviewer:** Dariusz Kulig
- **Priority:** P1 - Krytyczny (funkcjonalność core feature)
- **Estimated fix time:** 2-4 godziny (w zależności od wybranej opcji)

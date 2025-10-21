# Instrukcja: Utworzenie bucketu portfolio-images w Supabase

## Problem
Upload plików do portfolio zwraca błąd **500 Internal Server Error**, ponieważ bucket `portfolio-images` nie istnieje w Supabase Storage.

## Rozwiązanie: Utworzenie bucketu przez Supabase Dashboard

### Krok 1: Zaloguj się do Supabase Dashboard
1. Przejdź do https://supabase.com/dashboard
2. Wybierz swój projekt

### Krok 2: Przejdź do Storage
1. W menu bocznym kliknij **Storage**
2. Kliknij **New bucket** (lub "Create bucket")

### Krok 3: Konfiguracja bucketu
Wypełnij formularz następującymi danymi:

**Podstawowe ustawienia:**
- **Name**: `portfolio-images`
- **Public bucket**: ✅ **TAK** (zaznacz checkbox)
  - Potrzebne aby publiczne linki do zdjęć działały

**Opcje zaawansowane (opcjonalne):**
- **File size limit**: `5242880` (5MB w bajtach)
- **Allowed MIME types**: 
  ```
  image/jpeg
  image/png  
  image/webp
  ```

### Krok 4: Kliknij "Create bucket"

### Krok 5: Skonfiguruj RLS Policies

Po utworzeniu bucketu, przejdź do zakładki **Policies** i dodaj następujące polityki:

#### Policy 1: Artisans can upload portfolio images
```sql
CREATE POLICY "Artisans can upload portfolio images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'portfolio-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 2: Artisans can update their portfolio images
```sql
CREATE POLICY "Artisans can update their portfolio images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'portfolio-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 3: Artisans can delete their portfolio images
```sql
CREATE POLICY "Artisans can delete their portfolio images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'portfolio-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 4: Anyone can view portfolio images
```sql
CREATE POLICY "Anyone can view portfolio images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'portfolio-images');
```

## Alternatywne rozwiązanie: SQL Migration

Jeśli używasz lokalnej instancji Supabase lub masz dostęp do SQL Editor, możesz uruchomić przygotowaną migrację:

```bash
# Znajdź plik migracji
supabase/migrations/20251021153900_create_portfolio_images_bucket.sql

# Uruchom migrację
npx supabase db push
```

## Weryfikacja

Po utworzeniu bucketu:

1. Odśwież stronę `/profile/edit`
2. Przejdź do kroku 3 (Portfolio)
3. Spróbuj przesłać zdjęcie
4. Powinieneś zobaczyć:
   - ✅ Alert "Przesyłanie zdjęć..."
   - ✅ Zdjęcie pojawi się w siatce
   - ✅ Brak błędów 500

## Struktura plików w buckecie

Po prawidłowej konfiguracji, pliki będą zapisywane w następującej strukturze:

```
portfolio-images/
├── {user-id-1}/
│   ├── {uuid-1}.jpg
│   ├── {uuid-2}.png
│   └── {uuid-3}.webp
├── {user-id-2}/
│   ├── {uuid-4}.jpg
│   └── {uuid-5}.png
└── ...
```

Każdy użytkownik (artisan) ma swój własny folder oznaczony jego `user_id`.

## Bezpieczeństwo

RLS Policies zapewniają:
- ✅ Tylko zalogowani użytkownicy mogą uploadować
- ✅ Użytkownicy mogą uploadować tylko do swoich folderów
- ✅ Użytkownicy mogą modyfikować/usuwać tylko swoje pliki
- ✅ Każdy (również niezalogowani) może przeglądać zdjęcia portfolio

## Troubleshooting

### Błąd: "Bucket already exists"
Bucket już istnieje, sprawdź czy ma prawidłowe ustawienia (public: true).

### Błąd: "row-level security policy violated"
RLS policies nie zostały utworzone lub są nieprawidłowe. Sprawdź policies w zakładce Storage > Policies.

### Zdjęcia nie są widoczne
Sprawdź czy bucket jest publiczny (public: true). Jeśli nie, zmień ustawienie w Storage > Configuration.

### Błąd 413 (File too large)
Zwiększ limit rozmiaru pliku w konfiguracji bucketu lub zmniejsz rozmiar przesyłanych zdjęć.

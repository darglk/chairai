# Schemat Bazy Danych PostgreSQL dla ChairAI

## 1. Lista Tabel

### Typy niestandardowe (ENUMs)

```sql
CREATE TYPE user_role AS ENUM ('client', 'artisan');
CREATE TYPE project_status AS ENUM ('open', 'in_progress', 'completed', 'closed');
```

### Tabela: `users`
Przechowuje podstawowe informacje o użytkownikach, zintegrowane z `auth.users` z Supabase.

| Nazwa kolumny | Typ danych | Ograniczenia                               | Opis                               |
| :------------ | :--------- | :----------------------------------------- | :--------------------------------- |
| `id`          | `uuid`     | `PRIMARY KEY`, `DEFAULT auth.uid()`        | Klucz główny, referencja do `auth.users.id`. |
| `role`        | `user_role`| `NOT NULL`                                 | Rola użytkownika ('client' lub 'artisan'). |
| `created_at`  | `timestamptz`| `DEFAULT now()`                            | Czas utworzenia konta.             |

### Tabela: `artisan_profiles`
Rozszerzenie profilu dla użytkowników z rolą 'artisan'.

| Nazwa kolumny   | Typ danych  | Ograniczenia                               | Opis                               |
| :-------------- | :---------- | :----------------------------------------- | :--------------------------------- |
| `user_id`       | `uuid`      | `PRIMARY KEY`, `REFERENCES users(id)`      | Klucz główny i obcy do tabeli `users`. |
| `company_name`  | `text`      | `NOT NULL`                                 | Nazwa firmy rzemieślnika.          |
| `nip`           | `varchar(10)`| `NOT NULL`, `UNIQUE`                       | Numer Identyfikacji Podatkowej.    |
| `is_public`     | `boolean`   | `NOT NULL`, `DEFAULT false`                | Czy profil jest publicznie widoczny. |
| `updated_at`    | `timestamptz`| `DEFAULT now()`                            | Czas ostatniej aktualizacji profilu. |

### Tabela: `specializations`
Tabela słownikowa dla specjalizacji rzemieślników.

| Nazwa kolumny | Typ danych | Ograniczenia     | Opis                       |
| :------------ | :--------- | :--------------- | :------------------------- |
| `id`          | `uuid`     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Klucz główny.              |
| `name`        | `text`     | `NOT NULL`, `UNIQUE` | Nazwa specjalizacji (np. "Stoły", "Szafy"). |

### Tabela: `artisan_specializations`
Tabela łącząca rzemieślników ze specjalizacjami (relacja N:N).

| Nazwa kolumny      | Typ danych | Ograniczenia                               | Opis                               |
| :----------------- | :--------- | :----------------------------------------- | :--------------------------------- |
| `artisan_id`       | `uuid`     | `REFERENCES artisan_profiles(user_id)`     | Klucz obcy do `artisan_profiles`.  |
| `specialization_id`| `uuid`     | `REFERENCES specializations(id)`           | Klucz obcy do `specializations`.   |
|                    |            | `PRIMARY KEY (artisan_id, specialization_id)` | Klucz główny złożony.              |

### Tabela: `portfolio_images`
Przechowuje URL-e do zdjęć w portfolio rzemieślnika.

| Nazwa kolumny | Typ danych | Ograniczenia                               | Opis                               |
| :------------ | :--------- | :----------------------------------------- | :--------------------------------- |
| `id`          | `uuid`     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Klucz główny.                      |
| `artisan_id`  | `uuid`     | `NOT NULL`, `REFERENCES artisan_profiles(user_id)` | Rzemieślnik, do którego należy zdjęcie. |
| `image_url`   | `text`     | `NOT NULL`                                 | URL do obrazu w Supabase Storage.  |
| `created_at`  | `timestamptz`| `DEFAULT now()`                            | Czas dodania zdjęcia.              |

### Tabela: `generated_images`
Przechowuje obrazy wygenerowane przez AI dla klientów.

| Nazwa kolumny | Typ danych | Ograniczenia                               | Opis                               |
| :------------ | :--------- | :----------------------------------------- | :--------------------------------- |
| `id`          | `uuid`     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Klucz główny.                      |
| `user_id`     | `uuid`     | `NOT NULL`, `REFERENCES users(id)`         | Klient, który wygenerował obraz.   |
| `prompt`      | `text`     |                                            | Prompt użyty do generacji.         |
| `image_url`   | `text`     | `NOT NULL`                                 | URL do obrazu w Supabase Storage.  |
| `created_at`  | `timestamptz`| `DEFAULT now()`                            | Czas generacji.                    |

### Tabela: `categories`
Tabela słownikowa dla kategorii mebli.

| Nazwa kolumny | Typ danych | Ograniczenia     | Opis                       |
| :------------ | :--------- | :--------------- | :------------------------- |
| `id`          | `uuid`     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Klucz główny.              |
| `name`        | `text`     | `NOT NULL`, `UNIQUE` | Nazwa kategorii (np. "Krzesło", "Biurko"). |

### Tabela: `materials`
Tabela słownikowa dla materiałów.

| Nazwa kolumny | Typ danych | Ograniczenia     | Opis                       |
| :------------ | :--------- | :--------------- | :------------------------- |
| `id`          | `uuid`     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Klucz główny.              |
| `name`        | `text`     | `NOT NULL`, `UNIQUE` | Nazwa materiału (np. "Dąb", "MDF"). |

### Tabela: `projects`
Centralna tabela dla projektów/ogłoszeń tworzonych przez klientów.

| Nazwa kolumny        | Typ danych       | Ograniczenia                               | Opis                               |
| :------------------- | :--------------- | :----------------------------------------- | :--------------------------------- |
| `id`                 | `uuid`           | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Klucz główny.                      |
| `client_id`          | `uuid`           | `NOT NULL`, `REFERENCES users(id)`         | Klient, który stworzył projekt.    |
| `generated_image_id` | `uuid`           | `NOT NULL`, `REFERENCES generated_images(id)`, `UNIQUE` | Obraz AI, na którym bazuje projekt. |
| `category_id`        | `uuid`           | `NOT NULL`, `REFERENCES categories(id)`    | Kategoria mebla.                   |
| `material_id`        | `uuid`           | `NOT NULL`, `REFERENCES materials(id)`     | Główny materiał.                   |
| `status`             | `project_status` | `NOT NULL`, `DEFAULT 'open'`               | Status projektu.                   |
| `dimensions`         | `text`           |                                            | Orientacyjne wymiary.              |
| `budget_range`       | `text`           |                                            | Oczekiwany budżet (zakres).        |
| `accepted_proposal_id`| `uuid`          | `REFERENCES proposals(id)`                 | Zaakceptowana propozycja.          |
| `accepted_price`     | `numeric(10, 2)` |                                            | Kwota z zaakceptowanej propozycji. |
| `created_at`         | `timestamptz`    | `DEFAULT now()`                            | Czas utworzenia projektu.          |
| `updated_at`         | `timestamptz`    | `DEFAULT now()`                            | Czas ostatniej aktualizacji.       |

### Tabela: `proposals`
Propozycje składane przez rzemieślników do projektów.

| Nazwa kolumny      | Typ danych       | Ograniczenia                               | Opis                               |
| :----------------- | :--------------- | :----------------------------------------- | :--------------------------------- |
| `id`               | `uuid`           | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Klucz główny.                      |
| `project_id`       | `uuid`           | `NOT NULL`, `REFERENCES projects(id)`      | Projekt, którego dotyczy propozycja. |
| `artisan_id`       | `uuid`           | `NOT NULL`, `REFERENCES users(id)`         | Rzemieślnik składający propozycję. |
| `price`            | `numeric(10, 2)` | `NOT NULL`                                 | Proponowana cena.                  |
| `attachment_url`   | `text`           | `NOT NULL`                                 | URL do załącznika w Supabase Storage. |
| `created_at`       | `timestamptz`    | `DEFAULT now()`                            | Czas złożenia propozycji.          |
|                    |                  | `UNIQUE (project_id, artisan_id)`          | Jeden rzemieślnik może złożyć jedną propozycję do projektu. |

### Tabela: `reviews`
Oceny i recenzje po zakończonym projekcie.

| Nazwa kolumny   | Typ danych | Ograniczenia                               | Opis                               |
| :-------------- | :--------- | :----------------------------------------- | :--------------------------------- |
| `id`            | `uuid`     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Klucz główny.                      |
| `project_id`    | `uuid`     | `NOT NULL`, `REFERENCES projects(id)`      | Oceniany projekt.                  |
| `reviewer_id`   | `uuid`     | `NOT NULL`, `REFERENCES users(id)`         | Użytkownik wystawiający ocenę.     |
| `reviewee_id`   | `uuid`     | `NOT NULL`, `REFERENCES users(id)`         | Użytkownik, który jest oceniany.   |
| `rating`        | `integer`  | `NOT NULL`, `CHECK (rating >= 1 AND rating <= 5)` | Ocena w skali 1-5.                 |
| `comment`       | `text`     |                                            | Komentarz do oceny.                |
| `created_at`    | `timestamptz`| `DEFAULT now()`                            | Czas wystawienia oceny.            |
|                 |            | `UNIQUE (project_id, reviewer_id)`         | Użytkownik może ocenić projekt tylko raz. |

## 2. Relacje Między Tabelami

- **`users` (1) -> (0..1) `artisan_profiles`**: Każdy profil rzemieślnika musi być powiązany z jednym użytkownikiem. Nie każdy użytkownik jest rzemieślnikiem.
- **`artisan_profiles` (1) -> (N) `portfolio_images`**: Rzemieślnik może mieć wiele zdjęć w portfolio.
- **`artisan_profiles` (N) <-> (N) `specializations`**: Poprzez tabelę `artisan_specializations`.
- **`users` (1) -> (N) `generated_images`**: Klient może wygenerować wiele obrazów.
- **`generated_images` (1) -> (1) `projects`**: Każdy obraz AI może być użyty do stworzenia tylko jednego projektu (wymuszone przez `UNIQUE` constraint).
- **`users` (1) -> (N) `projects`**: Klient może stworzyć wiele projektów.
- **`categories` (1) -> (N) `projects`**: Jedna kategoria może być przypisana do wielu projektów.
- **`materials` (1) -> (N) `projects`**: Jeden materiał może być przypisany do wielu projektów.
- **`projects` (1) -> (N) `proposals`**: Jeden projekt może mieć wiele propozycji od różnych rzemieślników.
- **`users` (1) -> (N) `proposals`**: Rzemieślnik może złożyć wiele propozycji do różnych projektów.
- **`projects` (1) -> (N) `reviews`**: Jeden projekt może mieć maksymalnie dwie oceny (jedną od klienta, drugą od rzemieślnika).

## 3. Indeksy

Zaleca się utworzenie indeksów na wszystkich kluczach obcych w celu optymalizacji złączeń (`JOIN`). Dodatkowo, warto utworzyć indeksy na kolumnach często używanych do filtrowania.

```sql
-- Indeksy na kluczach obcych (większość jest tworzona automatycznie z constraintem)
CREATE INDEX ON artisan_profiles (user_id);
CREATE INDEX ON portfolio_images (artisan_id);
CREATE INDEX ON generated_images (user_id);
CREATE INDEX ON projects (client_id);
CREATE INDEX ON projects (generated_image_id);
CREATE INDEX ON projects (category_id);
CREATE INDEX ON projects (material_id);
CREATE INDEX ON projects (accepted_proposal_id);
CREATE INDEX ON proposals (project_id);
CREATE INDEX ON proposals (artisan_id);
CREATE INDEX ON reviews (project_id);
CREATE INDEX ON reviews (reviewer_id);
CREATE INDEX ON reviews (reviewee_id);

-- Indeksy dla wydajności zapytań
CREATE INDEX ON projects (status); -- Kluczowe dla filtrowania projektów na marketplace
CREATE INDEX ON artisan_profiles (is_public); -- Dla zapytań o publiczne profile
```

## 4. Zasady PostgreSQL (Row-Level Security)

Poniżej znajdują się przykładowe zasady RLS, które należy zaimplementować, aby zapewnić bezpieczeństwo danych.

```sql
-- Włączenie RLS dla tabel
ALTER TABLE artisan_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Zasady dla artisan_profiles
CREATE POLICY "Public artisan profiles are viewable by everyone."
  ON artisan_profiles FOR SELECT USING (is_public = true);
CREATE POLICY "Artisans can update their own profile."
  ON artisan_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Zasady dla generated_images
CREATE POLICY "Users can view their own generated images."
  ON generated_images FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create generated images."
  ON generated_images FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Zasady dla projects
CREATE POLICY "Artisans can view open projects."
  ON projects FOR SELECT USING (get_my_claim('role')::text = 'artisan' AND status = 'open');
CREATE POLICY "Clients can view their own projects."
  ON projects FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Involved parties can view project in progress or completed."
  ON projects FOR SELECT USING (
    status IN ('in_progress', 'completed') AND
    (auth.uid() = client_id OR auth.uid() = (SELECT artisan_id FROM proposals WHERE id = accepted_proposal_id))
  );
CREATE POLICY "Clients can create projects."
  ON projects FOR INSERT WITH CHECK (auth.uid() = client_id AND get_my_claim('role')::text = 'client');

-- Zasady dla proposals
CREATE POLICY "Clients can view proposals for their own projects."
  ON proposals FOR SELECT USING (
    auth.uid() = (SELECT client_id FROM projects WHERE id = project_id)
  );
CREATE POLICY "Artisans can view their own proposals."
  ON proposals FOR SELECT USING (auth.uid() = artisan_id);
CREATE POLICY "Artisans can create proposals for open projects."
  ON proposals FOR INSERT WITH CHECK (
    get_my_claim('role')::text = 'artisan' AND
    (SELECT status FROM projects WHERE id = project_id) = 'open'
  );

-- Zasady dla reviews
CREATE POLICY "Reviews are public."
  ON reviews FOR SELECT USING (true);
CREATE POLICY "Involved parties can create reviews for completed projects."
  ON reviews FOR INSERT WITH CHECK (
    (SELECT status FROM projects WHERE id = project_id) = 'completed' AND
    (auth.uid() = (SELECT client_id FROM projects WHERE id = project_id) OR auth.uid() = (SELECT artisan_id FROM proposals WHERE id = (SELECT accepted_proposal_id FROM projects WHERE id = project_id)))
  );
```
*Uwaga: Powyższe zasady RLS wymagają pomocniczej funkcji `get_my_claim` do odczytywania ról z tokena JWT, co jest standardem w Supabase.*

## 5. Dodatkowe Uwagi

1.  **Przechowywanie Plików**: Zgodnie z notatkami, wszystkie pliki (zdjęcia w portfolio, załączniki do propozycji, wygenerowane obrazy) będą przechowywane w Supabase Storage. W bazie danych zapisywane są jedynie URL-e do tych zasobów. Należy skonfigurować odpowiednie polityki dostępu (Storage RLS) również dla bucketów w Supabase.
2.  **Weryfikacja NIP**: Weryfikacja NIP w MVP jest założona jako proces manualny lub oparty na prostym formacie. W przyszłości można zintegrować zewnętrzne API do automatycznej weryfikacji.
3.  **Denormalizacja**: Celowo zdenormalizowano dane `accepted_price` w tabeli `projects`, aby uprościć i przyspieszyć odczyt kluczowych danych o sfinalizowanym projekcie bez konieczności dodatkowego `JOIN` do tabeli `proposals`.
4.  **Funkcje pomocnicze**: Implementacja RLS będzie wymagała stworzenia funkcji w PostgreSQL, które odczytują metadane z sesji użytkownika (JWT), np. `auth.uid()` i `auth.role()`. Supabase dostarcza gotowe mechanizmy do tego celu.
5.  **Migracje**: Ten schemat powinien posłużyć jako podstawa do stworzenia plików migracji za pomocą narzędzi dostarczanych przez Supabase CLI.

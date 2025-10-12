-- migration: initial_schema
-- description: sets up the initial database schema for chairai, including tables for users, projects, artisans, and related entities.
-- impacted_tables: users, artisan_profiles, specializations, artisan_specializations, portfolio_images, generated_images, categories, materials, projects, proposals, reviews
-- special_notes: this migration establishes the foundational structure and enables row-level security for all tables.

-- custom types
-- defines user roles and project statuses as enums for data consistency.
create type public.user_role as enum ('client', 'artisan');
create type public.project_status as enum ('open', 'in_progress', 'completed', 'closed');

-- users table
-- extends supabase's auth.users table with application-specific data like user roles.
create table public.users (
    id uuid not null primary key references auth.users on delete cascade,
    role public.user_role not null,
    created_at timestamptz not null default now()
);

-- enable row level security for users table
alter table public.users enable row level security;

-- rls policies for users table
-- allows authenticated users to see their own user record.
create policy "allow authenticated users to read their own data" on public.users for select
    using (auth.uid() = id);

-- artisan_profiles table
-- stores detailed information for users with the 'artisan' role.
create table public.artisan_profiles (
    user_id uuid not null primary key references public.users(id) on delete cascade,
    company_name text not null,
    nip varchar(10) not null unique,
    is_public boolean not null default false,
    updated_at timestamptz not null default now()
);

-- enable row level security for artisan_profiles table
alter table public.artisan_profiles enable row level security;

-- rls policies for artisan_profiles table
-- allows anyone to view public artisan profiles.
create policy "allow anyone to read public artisan profiles" on public.artisan_profiles for select
    using (is_public = true);
-- allows artisans to view their own profile, regardless of public status.
create policy "allow artisans to read their own profile" on public.artisan_profiles for select
    using (auth.uid() = user_id);
-- allows artisans to update their own profile.
create policy "allow artisans to update their own profile" on public.artisan_profiles for update
    using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- specializations table
-- dictionary table for artisan specializations (e.g., "tables", "chairs").
create table public.specializations (
    id uuid not null primary key default gen_random_uuid(),
    name text not null unique
);

-- enable row level security for specializations table
alter table public.specializations enable row level security;

-- rls policies for specializations table
-- allows any authenticated user to read specializations.
create policy "allow authenticated read access to specializations" on public.specializations for select
    using (auth.role() = 'authenticated');

-- artisan_specializations table
-- join table linking artisans to their specializations (many-to-many).
create table public.artisan_specializations (
    artisan_id uuid not null references public.artisan_profiles(user_id) on delete cascade,
    specialization_id uuid not null references public.specializations(id) on delete cascade,
    primary key (artisan_id, specialization_id)
);

-- enable row level security for artisan_specializations table
alter table public.artisan_specializations enable row level security;

-- rls policies for artisan_specializations table
-- allows any authenticated user to read the links.
create policy "allow authenticated read access" on public.artisan_specializations for select
    using (auth.role() = 'authenticated');
-- allows artisans to manage their own specializations.
create policy "allow artisans to manage their own specializations" on public.artisan_specializations for all
    using (auth.uid() = artisan_id);

-- portfolio_images table
-- stores urls to images in an artisan's portfolio.
create table public.portfolio_images (
    id uuid not null primary key default gen_random_uuid(),
    artisan_id uuid not null references public.artisan_profiles(user_id) on delete cascade,
    image_url text not null,
    created_at timestamptz not null default now()
);

-- enable row level security for portfolio_images table
alter table public.portfolio_images enable row level security;

-- rls policies for portfolio_images table
-- allows anyone to view portfolio images of public profiles.
create policy "allow public read access for images on public profiles" on public.portfolio_images for select
    using (exists (select 1 from public.artisan_profiles where user_id = artisan_id and is_public = true));
-- allows artisans to manage their own portfolio images.
create policy "allow artisans to manage their own images" on public.portfolio_images for all
    using (auth.uid() = artisan_id);

-- generated_images table
-- stores images generated by users via ai.
create table public.generated_images (
    id uuid not null primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    prompt text,
    image_url text not null,
    created_at timestamptz not null default now()
);

-- enable row level security for generated_images table
alter table public.generated_images enable row level security;

-- rls policies for generated_images table
-- allows users to manage their own generated images.
create policy "allow users to manage their own generated images" on public.generated_images for all
    using (auth.uid() = user_id);

-- categories table
-- dictionary table for furniture categories (e.g., "chair", "desk").
create table public.categories (
    id uuid not null primary key default gen_random_uuid(),
    name text not null unique
);

-- enable row level security for categories table
alter table public.categories enable row level security;

-- rls policies for categories table
-- allows any authenticated user to read categories.
create policy "allow authenticated read access to categories" on public.categories for select
    using (auth.role() = 'authenticated');

-- materials table
-- dictionary table for materials (e.g., "oak", "mdf").
create table public.materials (
    id uuid not null primary key default gen_random_uuid(),
    name text not null unique
);

-- enable row level security for materials table
alter table public.materials enable row level security;

-- rls policies for materials table
-- allows any authenticated user to read materials.
create policy "allow authenticated read access to materials" on public.materials for select
    using (auth.role() = 'authenticated');

-- projects table
-- central table for projects created by clients.
create table public.projects (
    id uuid not null primary key default gen_random_uuid(),
    client_id uuid not null references public.users(id) on delete cascade,
    generated_image_id uuid not null unique references public.generated_images(id),
    category_id uuid not null references public.categories(id),
    material_id uuid not null references public.materials(id),
    status public.project_status not null default 'open',
    dimensions text,
    budget_range text,
    accepted_proposal_id uuid, -- foreign key added below after proposals table is created
    accepted_price numeric(10, 2),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- enable row level security for projects table
alter table public.projects enable row level security;

-- proposals table
-- stores proposals submitted by artisans for projects.
create table public.proposals (
    id uuid not null primary key default gen_random_uuid(),
    project_id uuid not null references public.projects(id) on delete cascade,
    artisan_id uuid not null references public.users(id) on delete cascade,
    price numeric(10, 2) not null,
    attachment_url text not null,
    created_at timestamptz not null default now(),
    unique (project_id, artisan_id)
);

-- enable row level security for proposals table
alter table public.proposals enable row level security;

-- rls policies for proposals table
-- allows clients to view proposals for their own projects.
create policy "allow clients to view proposals on their projects" on public.proposals for select
    using (exists (select 1 from public.projects where id = project_id and client_id = auth.uid()));
-- allows artisans to manage their own proposals.
create policy "allow artisans to manage their own proposals" on public.proposals for all
    using (auth.uid() = artisan_id);

-- add foreign key from projects to proposals now that proposals table exists.
alter table public.projects
    add constraint fk_accepted_proposal
    foreign key (accepted_proposal_id)
    references public.proposals(id);

-- rls policies for projects table
-- allows anyone to view open projects.
create policy "allow anyone to view open projects" on public.projects for select
    using (status = 'open');
-- allows clients to manage their own projects.
create policy "allow clients to manage their own projects" on public.projects for all
    using (auth.uid() = client_id);
-- allows involved artisans to view projects they have a proposal on.
create policy "allow involved artisans to view projects" on public.projects for select
    using (exists (select 1 from public.proposals where project_id = id and artisan_id = auth.uid()));

-- reviews table
-- stores ratings and reviews for completed projects.
create table public.reviews (
    id uuid not null primary key default gen_random_uuid(),
    project_id uuid not null references public.projects(id) on delete cascade,
    reviewer_id uuid not null references public.users(id) on delete cascade,
    reviewee_id uuid not null references public.users(id) on delete cascade,
    rating integer not null check (rating >= 1 and rating <= 5),
    comment text,
    created_at timestamptz not null default now(),
    unique (project_id, reviewer_id)
);

-- enable row level security for reviews table
alter table public.reviews enable row level security;

-- rls policies for reviews table
-- allows anyone to read all reviews.
create policy "reviews are public" on public.reviews for select
    using (true);
-- allows involved parties to create reviews for completed projects.
create policy "allow involved parties to create reviews for completed projects" on public.reviews for insert
    with check (
        (select status from public.projects where id = project_id) = 'completed' and
        (
            auth.uid() = (select client_id from public.projects where id = project_id) or
            auth.uid() = (select artisan_id from public.proposals where id = (select accepted_proposal_id from public.projects where id = project_id))
        )
    );

-- indexes for performance
-- creates indexes on foreign keys and frequently filtered columns to optimize query performance.
create index on public.artisan_profiles (user_id);
create index on public.portfolio_images (artisan_id);
create index on public.generated_images (user_id);
create index on public.projects (client_id);
create index on public.projects (generated_image_id);
create index on public.projects (category_id);
create index on public.projects (material_id);
create index on public.projects (accepted_proposal_id);
create index on public.proposals (project_id);
create index on public.proposals (artisan_id);
create index on public.reviews (project_id);
create index on public.reviews (reviewer_id);
create index on public.reviews (reviewee_id);
create index on public.projects (status);
create index on public.artisan_profiles (is_public);

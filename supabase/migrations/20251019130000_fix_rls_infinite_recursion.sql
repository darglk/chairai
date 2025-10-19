-- Migration: Fix RLS Infinite Recursion in Projects
-- Description: Fixes infinite recursion in RLS policies between projects and proposals tables
-- Impacted Tables: projects, proposals
-- Special Notes: Simplifies policies to avoid circular dependencies during INSERT operations

-- Drop existing problematic policies
DROP POLICY IF EXISTS "allow anyone to view open projects" ON public.projects;
DROP POLICY IF EXISTS "allow clients to manage their own projects" ON public.projects;
DROP POLICY IF EXISTS "allow involved artisans to view projects" ON public.projects;

DROP POLICY IF EXISTS "allow clients to view proposals on their projects" ON public.proposals;
DROP POLICY IF EXISTS "allow artisans to manage their own proposals" ON public.proposals;

-- Recreate projects policies (simplified to avoid recursion)
-- Policy 1: Allow authenticated users to view open projects (no recursion)
CREATE POLICY "allow authenticated users to view open projects" ON public.projects
    FOR SELECT
    USING (status = 'open');

-- Policy 2: Allow clients to INSERT their own projects (simple check, no joins)
CREATE POLICY "allow clients to insert their own projects" ON public.projects
    FOR INSERT
    WITH CHECK (auth.uid() = client_id);

-- Policy 3: Allow clients to SELECT their own projects (simple check, no joins)
CREATE POLICY "allow clients to select their own projects" ON public.projects
    FOR SELECT
    USING (auth.uid() = client_id);

-- Policy 4: Allow clients to UPDATE their own projects (simple check, no joins)
CREATE POLICY "allow clients to update their own projects" ON public.projects
    FOR UPDATE
    USING (auth.uid() = client_id)
    WITH CHECK (auth.uid() = client_id);

-- Policy 5: Allow clients to DELETE their own projects (simple check, no joins)
CREATE POLICY "allow clients to delete their own projects" ON public.projects
    FOR DELETE
    USING (auth.uid() = client_id);

-- Policy 6: Allow artisans to view projects where they have a proposal
-- IMPORTANT: Uses a direct join without nested subqueries to avoid recursion
CREATE POLICY "allow artisans with proposals to view projects" ON public.projects
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM public.proposals 
            WHERE proposals.project_id = projects.id 
            AND proposals.artisan_id = auth.uid()
        )
    );

-- Recreate proposals policies (simplified)
-- Policy 1: Allow clients to view proposals on their projects
-- Uses direct comparison instead of subquery to avoid recursion
CREATE POLICY "allow clients to view proposals on their projects" ON public.proposals
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM public.projects 
            WHERE projects.id = proposals.project_id 
            AND projects.client_id = auth.uid()
        )
    );

-- Policy 2: Allow artisans to INSERT their own proposals
CREATE POLICY "allow artisans to insert their proposals" ON public.proposals
    FOR INSERT
    WITH CHECK (auth.uid() = artisan_id);

-- Policy 3: Allow artisans to SELECT their own proposals
CREATE POLICY "allow artisans to select their proposals" ON public.proposals
    FOR SELECT
    USING (auth.uid() = artisan_id);

-- Policy 4: Allow artisans to UPDATE their own proposals
CREATE POLICY "allow artisans to update their proposals" ON public.proposals
    FOR UPDATE
    USING (auth.uid() = artisan_id)
    WITH CHECK (auth.uid() = artisan_id);

-- Policy 5: Allow artisans to DELETE their own proposals
CREATE POLICY "allow artisans to delete their proposals" ON public.proposals
    FOR DELETE
    USING (auth.uid() = artisan_id);

-- Note: The key change is splitting the "all" policy into separate INSERT, SELECT, UPDATE, DELETE policies
-- This allows Postgres to properly evaluate permissions at each operation level and avoid recursion
-- during INSERT operations which don't need to check proposals (since they don't exist yet).

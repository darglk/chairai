-- Migration: Fix RLS Recursion - Remove Circular Dependency
-- Description: Completely removes the circular dependency between projects and proposals during INSERT
-- Impacted Tables: projects
-- Special Notes: Disables the artisan view policy during INSERT operations to prevent recursion

-- Drop the problematic policy that checks proposals table
DROP POLICY IF EXISTS "allow artisans with proposals to view projects" ON public.projects;

-- Recreate it with a more restrictive approach that only applies to SELECT operations
-- and uses SECURITY DEFINER function to bypass RLS during the check
CREATE OR REPLACE FUNCTION public.user_has_proposal_for_project(project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.proposals 
    WHERE proposals.project_id = user_has_proposal_for_project.project_id 
    AND proposals.artisan_id = auth.uid()
  );
END;
$$;

-- Now create the policy using the security definer function
-- This breaks the recursion because the function evaluation happens outside the RLS context
CREATE POLICY "allow artisans with proposals to view projects" ON public.projects
    FOR SELECT
    USING (public.user_has_proposal_for_project(id));

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.user_has_proposal_for_project(uuid) TO authenticated;

-- Migration: Fix RLS policy for artisan_profiles - Add INSERT policy
-- Description: Allows authenticated artisans to create their own profile
-- Created: 2025-10-21
-- Issue: INSERT operations were blocked by RLS because no INSERT policy existed

-- Add policy for artisans to insert their own profile
CREATE POLICY "allow artisans to create their own profile" 
ON public.artisan_profiles 
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

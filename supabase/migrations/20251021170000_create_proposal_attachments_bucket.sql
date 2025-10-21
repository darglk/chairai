-- Migration: Create proposal-attachments storage bucket
-- Description: Creates storage bucket for proposal attachments with proper RLS policies
-- Created: 2025-10-21
-- 
-- Security Model:
-- - Artisans can upload attachments to their proposals (organized by artisan_id/project_id/)
-- - Artisans can view and update their own proposal attachments
-- - Project owners (clients) can view attachments for proposals in their projects
-- - Admin users can view all attachments

-- Step 1: Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('proposal-attachments', 'proposal-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Drop existing policies if they exist (cleanup)
DROP POLICY IF EXISTS "Artisans can upload proposal attachments" ON storage.objects;
DROP POLICY IF EXISTS "Artisans can update their proposal attachments" ON storage.objects;
DROP POLICY IF EXISTS "Artisans can view their proposal attachments" ON storage.objects;
DROP POLICY IF EXISTS "Project owners can view proposal attachments" ON storage.objects;
DROP POLICY IF EXISTS "Artisans can delete their proposal attachments" ON storage.objects;

-- Step 3: Create policy for uploading attachments
-- Only authenticated artisans can upload to their own folder (artisan_id/project_id/filename)
CREATE POLICY "Artisans can upload proposal attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'proposal-attachments' 
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'artisan'
  )
);

-- Step 4: Create policy for updating attachments
-- Artisans can update their own proposal attachments
CREATE POLICY "Artisans can update their proposal attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'proposal-attachments' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Step 5: Create policy for artisans viewing their own attachments
-- Artisans can view their own proposal attachments
CREATE POLICY "Artisans can view their proposal attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'proposal-attachments' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Step 6: Create policy for project owners viewing attachments
-- Project owners (clients) can view attachments for proposals in their projects
-- Path structure: artisan_id/project_id/filename
CREATE POLICY "Project owners can view proposal attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'proposal-attachments' 
  AND EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id::text = (storage.foldername(name))[2]
    AND projects.client_id = auth.uid()
  )
);

-- Step 7: Create policy for deleting attachments
-- Artisans can delete their own proposal attachments (before proposal is accepted)
CREATE POLICY "Artisans can delete their proposal attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'proposal-attachments' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

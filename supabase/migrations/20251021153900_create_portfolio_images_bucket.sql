-- Migration: Create portfolio-images storage bucket
-- Description: Creates storage bucket for artisan portfolio images with proper RLS policies
-- Created: 2025-10-21

-- Step 1: Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-images', 'portfolio-images', true)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Drop existing policies if they exist (cleanup)
DROP POLICY IF EXISTS "Artisans can upload portfolio images" ON storage.objects;
DROP POLICY IF EXISTS "Artisans can update their portfolio images" ON storage.objects;
DROP POLICY IF EXISTS "Artisans can delete their portfolio images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view portfolio images" ON storage.objects;

-- Step 3: Create policy for uploading images
-- Only authenticated artisans can upload to their own folder
CREATE POLICY "Artisans can upload portfolio images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'portfolio-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Step 4: Create policy for updating images
-- Artisans can update their own images
CREATE POLICY "Artisans can update their portfolio images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'portfolio-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Step 5: Create policy for deleting images
-- Artisans can delete their own images
CREATE POLICY "Artisans can delete their portfolio images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'portfolio-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Step 6: Create policy for viewing images
-- Anyone (including anonymous users) can view portfolio images
CREATE POLICY "Anyone can view portfolio images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'portfolio-images');

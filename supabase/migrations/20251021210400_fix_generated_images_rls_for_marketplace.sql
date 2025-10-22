-- Migration: Fix RLS for generated_images to allow artisans to view images in projects
-- Description: Adds a policy to allow authenticated users to read generated images that are used in projects
-- This is necessary for the marketplace view where artisans need to see project images

-- Add policy to allow reading generated images that are used in projects
create policy "allow authenticated users to read images used in projects" 
on public.generated_images 
for select
using (
  auth.role() = 'authenticated' 
  and exists (
    select 1 
    from public.projects 
    where projects.generated_image_id = generated_images.id
  )
);

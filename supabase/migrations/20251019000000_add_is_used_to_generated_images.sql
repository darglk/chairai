-- migration: add_is_used_to_generated_images
-- description: Adds is_used column to generated_images table and sets up automatic synchronization with projects table
-- impacted_tables: generated_images
-- special_notes: This migration fixes the RLS infinite recursion issue by denormalizing the is_used flag

-- Step 1: Add is_used column to generated_images table
ALTER TABLE public.generated_images 
ADD COLUMN is_used BOOLEAN NOT NULL DEFAULT FALSE;

-- Step 2: Set initial values based on existing projects
-- Mark images as used if they're referenced in any project
UPDATE public.generated_images
SET is_used = TRUE
WHERE id IN (
  SELECT generated_image_id 
  FROM public.projects
);

-- Step 3: Create function to update is_used flag when project is created/deleted
CREATE OR REPLACE FUNCTION update_generated_image_used_status()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- When project is created, mark image as used
    UPDATE public.generated_images 
    SET is_used = TRUE 
    WHERE id = NEW.generated_image_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- When project is deleted, check if image is still used in other projects
    UPDATE public.generated_images 
    SET is_used = EXISTS (
      SELECT 1 
      FROM public.projects 
      WHERE generated_image_id = OLD.generated_image_id
      AND id != OLD.id
    )
    WHERE id = OLD.generated_image_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create trigger on projects table
CREATE TRIGGER projects_update_image_status
AFTER INSERT OR DELETE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION update_generated_image_used_status();

-- Step 5: Add index for better performance on is_used queries
CREATE INDEX idx_generated_images_user_id_is_used 
ON public.generated_images(user_id, is_used);

-- Step 6: Add comment to document the column
COMMENT ON COLUMN public.generated_images.is_used IS 
'Indicates whether this image has been used in any project. Automatically synchronized via trigger.';

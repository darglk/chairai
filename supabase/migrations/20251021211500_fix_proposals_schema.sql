-- Migration: Fix proposals table to make attachment optional and add message field
-- Description: Makes attachment_url nullable and adds message text field for proposals
-- Impacted Tables: proposals

-- Add message column (optional text message from artisan to client)
ALTER TABLE public.proposals 
ADD COLUMN message TEXT;

-- Make attachment_url nullable (attachment should be optional)
ALTER TABLE public.proposals 
ALTER COLUMN attachment_url DROP NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.proposals.message IS 'Optional text message from artisan explaining their proposal';
COMMENT ON COLUMN public.proposals.attachment_url IS 'Optional URL to proposal attachment in storage';

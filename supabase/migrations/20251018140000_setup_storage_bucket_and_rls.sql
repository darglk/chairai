-- migration: setup_storage_bucket_and_rls
-- description: configures RLS policies for authenticated users on storage bucket
-- special_notes: Storage RLS in Supabase - use DO blocks to handle existing policies

do $$
begin
  create policy "allow authenticated users to upload images" on storage.objects
  for insert with check (bucket_id = 'chairai_bucket' AND auth.role() = 'authenticated');
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "allow authenticated users to read images" on storage.objects
  for select using (bucket_id = 'chairai_bucket' AND auth.role() = 'authenticated');
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "allow authenticated users to update images" on storage.objects
  for update using (bucket_id = 'chairai_bucket' AND auth.role() = 'authenticated');
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "allow authenticated users to delete images" on storage.objects
  for delete using (bucket_id = 'chairai_bucket' AND auth.role() = 'authenticated');
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "allow public read access to images" on storage.objects
  for select using (bucket_id = 'chairai_bucket');
exception when duplicate_object then null;
end $$;

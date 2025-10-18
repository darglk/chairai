-- migration: add_user_creation_trigger
-- description: creates a trigger that automatically creates a user record in public.users table when a new auth user signs up
-- this handles the account_type from user metadata and defaults to 'client' role

-- create function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
declare
  account_type text;
begin
  -- get account_type from user metadata, default to 'client'
  account_type := coalesce(new.raw_user_meta_data->>'account_type', 'client');
  
  -- cast to user_role enum
  insert into public.users (id, role, created_at)
  values (
    new.id,
    account_type::public.user_role,
    now()
  );
  
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- create trigger on auth.users table
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

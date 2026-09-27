create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  credits integer not null default 5,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own_noop"
  on public.profiles for update
  using (false);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, credits)
  values (new.id, new.email, 5);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create table public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  prompt text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.generations enable row level security;

create policy "generations_select_own"
  on public.generations for select
  using (auth.uid() = user_id);

create or replace function public.consume_credit(p_user_id uuid)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  remaining integer;
begin
  update public.profiles
    set credits = credits - 1
    where id = p_user_id and credits > 0
    returning credits into remaining;

  if remaining is null then
    raise exception 'INSUFFICIENT_CREDITS';
  end if;

  return remaining;
end;
$$;

create or replace function public.refund_credit(p_user_id uuid)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  remaining integer;
begin
  update public.profiles
    set credits = credits + 1
    where id = p_user_id
    returning credits into remaining;
  return remaining;
end;
$$;

create or replace function public.add_credits(p_user_id uuid, p_amount integer)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  remaining integer;
begin
  update public.profiles
    set credits = credits + p_amount
    where id = p_user_id
    returning credits into remaining;
  return remaining;
end;
$$;

revoke execute on function public.consume_credit(uuid) from public, anon, authenticated;
revoke execute on function public.refund_credit(uuid) from public, anon, authenticated;
revoke execute on function public.add_credits(uuid, integer) from public, anon, authenticated;

grant execute on function public.consume_credit(uuid) to service_role;
grant execute on function public.refund_credit(uuid) to service_role;
grant execute on function public.add_credits(uuid, integer) to service_role;

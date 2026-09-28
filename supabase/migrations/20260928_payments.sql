create table public.payments (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text not null unique,
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan text not null,
  credits integer not null,
  amount_grosze integer not null,
  currency text not null,
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create policy "payments_select_own"
  on public.payments for select
  using (auth.uid() = user_id);

-- Idempotent: a Stripe session is credited at most once, even if the webhook is retried.
create or replace function public.fulfill_payment(
  p_session_id text, p_user_id uuid, p_plan text, p_credits integer, p_amount integer, p_currency text
)
returns boolean
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.payments (stripe_session_id, user_id, plan, credits, amount_grosze, currency)
  values (p_session_id, p_user_id, p_plan, p_credits, p_amount, p_currency)
  on conflict (stripe_session_id) do nothing;

  if not found then
    return false;
  end if;

  update public.profiles set credits = credits + p_credits where id = p_user_id;
  return true;
end;
$$;

revoke execute on function public.fulfill_payment(text, uuid, text, integer, integer, text) from public, anon, authenticated;
grant execute on function public.fulfill_payment(text, uuid, text, integer, integer, text) to service_role;

-- Frangão: tabela de progresso sincronizado entre aparelhos.
-- Cole tudo no Supabase em: SQL Editor → New query → Run.

create table if not exists public.progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

-- Cada pessoa só enxerga e altera o próprio progresso.
alter table public.progress enable row level security;

drop policy if exists "ler o próprio progresso" on public.progress;
create policy "ler o próprio progresso" on public.progress
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "criar o próprio progresso" on public.progress;
create policy "criar o próprio progresso" on public.progress
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "atualizar o próprio progresso" on public.progress;
create policy "atualizar o próprio progresso" on public.progress
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

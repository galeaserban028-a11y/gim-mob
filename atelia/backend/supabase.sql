-- Atelia Build — baza de date pentru conturi (Supabase, regiune UE / Frankfurt)
-- Rulează o singură dată în Supabase → SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text, name text, company text, cui text, phone text, email text, city text,
  logo text, mode text, vat text, currency text,
  updated_at timestamptz default now()
);

create table if not exists public.projects (
  id text not null,
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text,
  data text not null,
  updated_at timestamptz default now(),
  primary key (owner, id)
);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;

-- fiecare utilizator vede și modifică DOAR datele lui
create policy "profil propriu - citire"  on public.profiles for select using (auth.uid() = id);
create policy "profil propriu - creare"  on public.profiles for insert with check (auth.uid() = id);
create policy "profil propriu - editare" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profil propriu - stergere" on public.profiles for delete using (auth.uid() = id);

create policy "proiecte proprii - citire"  on public.projects for select using (auth.uid() = owner);
create policy "proiecte proprii - creare"  on public.projects for insert with check (auth.uid() = owner);
create policy "proiecte proprii - editare" on public.projects for update using (auth.uid() = owner) with check (auth.uid() = owner);
create policy "proiecte proprii - stergere" on public.projects for delete using (auth.uid() = owner);

-- limite de mărime (protecție la abuz)
alter table public.projects add constraint projects_size check (length(data) < 2000000);
alter table public.profiles add constraint profiles_logo_size check (logo is null or length(logo) < 400000);

-- dreptul la ștergere (GDPR art. 17): utilizatorul își șterge singur contul și toate datele
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from auth.users where id = auth.uid();
end; $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- dacă tabelul exista deja dintr-o versiune mai veche:
alter table public.profiles add column if not exists vat text;
alter table public.profiles add column if not exists currency text;

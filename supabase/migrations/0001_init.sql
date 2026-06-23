-- ============================================================
-- ESCENA · Esquema inicial
-- Ejecutar en el SQL Editor de Supabase (o `supabase db push`)
-- ============================================================

-- ---------- PERFILES (Users) ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  email text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "own profile read" on public.profiles
  for select using (auth.uid() = id);
create policy "own profile update" on public.profiles
  for update using (auth.uid() = id);

-- Crear perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''), new.email);
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- PROJECTS ----------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text default '',
  client_name text default '',
  status text not null default 'draft' check (status in ('draft','live','archived')),
  aura text default 'linear-gradient(135deg,#2A2ACB,#5E5BFF,#9FD0FF)',
  blocks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;
create policy "own projects" on public.projects
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create index projects_owner_idx on public.projects (owner_id, created_at desc);

-- ---------- BLUEPRINTS ----------
create table public.blueprints (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  category text default 'General',
  configuration jsonb not null default '{}'::jsonb, -- { description, blocks: [...], aura }
  created_at timestamptz not null default now()
);

alter table public.blueprints enable row level security;
create policy "own blueprints" on public.blueprints
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ---------- CLIENT SPACES (experiencias compartidas) ----------
create table public.client_spaces (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  slug text not null unique,
  access_token text not null default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now()
);

alter table public.client_spaces enable row level security;
create policy "owner manages spaces" on public.client_spaces
  for all using (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );

create index client_spaces_slug_idx on public.client_spaces (slug);

-- ---------- DOCUMENTS ----------
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  type text not null,           -- pdf | docx | pptx | image
  name text not null,
  file_url text not null,       -- ruta dentro del bucket
  created_at timestamptz not null default now()
);

alter table public.documents enable row level security;
create policy "owner manages documents" on public.documents
  for all using (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );

-- ---------- AI CONVERSATIONS ----------
create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  messages jsonb not null default '[]'::jsonb, -- [{role, content, ts}]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_conversations enable row level security;
create policy "owner manages conversations" on public.ai_conversations
  for all using (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );

-- ---------- VISITAS (analytics de experiencias) ----------
create table public.experience_visits (
  id uuid primary key default gen_random_uuid(),
  client_space_id uuid not null references public.client_spaces (id) on delete cascade,
  visitor_name text not null,
  entered_at timestamptz not null default now()
);

alter table public.experience_visits enable row level security;
create policy "owner reads visits" on public.experience_visits
  for select using (
    exists (
      select 1 from public.client_spaces cs
      join public.projects p on p.id = cs.project_id
      where cs.id = client_space_id and p.owner_id = auth.uid()
    )
  );

-- ---------- ACCESO PÚBLICO (vista cliente, sin registro) ----------
-- El cliente anónimo nunca toca las tablas directamente:
-- accede mediante funciones SECURITY DEFINER acotadas al slug.

create or replace function public.get_experience(p_slug text)
returns table (title text, description text, client_name text, aura text, blocks jsonb)
language sql security definer set search_path = public stable as $$
  select p.title, p.description, p.client_name, p.aura, p.blocks
  from public.client_spaces cs
  join public.projects p on p.id = cs.project_id
  where cs.slug = p_slug and p.status = 'live'
  limit 1;
$$;

create or replace function public.record_visit(p_slug text, p_name text)
returns void language sql security definer set search_path = public as $$
  insert into public.experience_visits (client_space_id, visitor_name)
  select cs.id, left(coalesce(p_name,'Anónimo'), 80)
  from public.client_spaces cs where cs.slug = p_slug;
$$;

grant execute on function public.get_experience(text) to anon, authenticated;
grant execute on function public.record_visit(text, text) to anon, authenticated;

-- ---------- STORAGE ----------
insert into storage.buckets (id, name, public) values ('documents', 'documents', false);

create policy "owner uploads docs" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "owner reads docs" on storage.objects
  for select to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "owner deletes docs" on storage.objects
  for delete to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

-- What I Read So Far — Supabase schema
-- Everything lives in its own schema, "reading", so it can share a Supabase
-- project with another app without touching that app's tables (in "public").
--
-- 1. Run this once in Supabase Dashboard → SQL Editor.
-- 2. Then: Project Settings → API (Data API) → "Exposed schemas" → add  reading  → Save.

create schema if not exists reading;

-- Book status shared by calendar, library and tree
do $$ begin
  create type reading.book_status as enum ('want', 'soon', 'reading', 'done');
exception when duplicate_object then null; end $$;

create table if not exists reading.books (
  id             uuid primary key default gen_random_uuid(),
  isbn13         text,
  title          text not null,
  subtitle       text,
  authors        text[] not null default '{}',
  translators    text[] not null default '{}',
  publisher      text,
  published_date date,
  cover_url      text,
  total_pages    integer,
  genre          text,
  description    text,
  source         text not null default 'manual',  -- 'kakao+nlk' | 'manual'
  status         reading.book_status not null default 'want',
  started_at     date,
  finished_at    date,
  rating         numeric(2,1) check (rating between 0 and 5),
  current_page   integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists books_status_idx on reading.books(status);
create index if not exists books_started_idx on reading.books(started_at);

-- Each "I'm on page X now" entry. Monthly page stats come from the differences.
create table if not exists reading.progress_logs (
  id         uuid primary key default gen_random_uuid(),
  book_id    uuid not null references reading.books(id) on delete cascade,
  page       integer not null check (page >= 0),
  logged_on  date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists progress_logs_book_idx on reading.progress_logs(book_id, logged_on);

-- Multiple review notes per book (comment thread style)
create table if not exists reading.reviews (
  id         uuid primary key default gen_random_uuid(),
  book_id    uuid not null references reading.books(id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists reviews_book_idx on reading.reviews(book_id, created_at);

-- Book trees (groups with nicknames)
create table if not exists reading.trees (
  id          uuid primary key default gen_random_uuid(),
  nickname    text not null,
  description text,
  color       text not null default '#6366f1',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists reading.tree_nodes (
  id       uuid primary key default gen_random_uuid(),
  tree_id  uuid not null references reading.trees(id) on delete cascade,
  book_id  uuid not null references reading.books(id) on delete cascade,
  x        double precision not null default 0,
  y        double precision not null default 0,
  unique (tree_id, book_id)
);

create table if not exists reading.tree_edges (
  id         uuid primary key default gen_random_uuid(),
  tree_id    uuid not null references reading.trees(id) on delete cascade,
  from_node  uuid not null references reading.tree_nodes(id) on delete cascade,
  to_node    uuid not null references reading.tree_nodes(id) on delete cascade,
  relation   text not null default 'inspired',  -- 'mentioned' | 'inspired' | 'other'
  note       text
);

-- Lock everything down: only the server (service-role key) can read/write.
alter table reading.books         enable row level security;
alter table reading.progress_logs enable row level security;
alter table reading.reviews       enable row level security;
alter table reading.trees         enable row level security;
alter table reading.tree_nodes    enable row level security;
alter table reading.tree_edges    enable row level security;

-- A new schema has no permissions by default. Give them to the server role only.
grant usage on schema reading to service_role;
grant all on all tables in schema reading to service_role;
grant usage on type reading.book_status to service_role;
alter default privileges in schema reading grant all on tables to service_role;
-- The browser roles (anon, authenticated) get nothing.
revoke all on schema reading from anon, authenticated;

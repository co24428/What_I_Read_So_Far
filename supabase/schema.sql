-- What I Read So Far — Supabase schema
-- Run this once in Supabase Dashboard → SQL Editor.

create extension if not exists "pgcrypto";

-- Book status shared by calendar, library and tree
do $$ begin
  create type book_status as enum ('want', 'soon', 'reading', 'done');
exception when duplicate_object then null; end $$;

create table if not exists books (
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
  status         book_status not null default 'want',
  started_at     date,
  finished_at    date,
  rating         numeric(2,1) check (rating between 0 and 5),
  current_page   integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists books_status_idx on books(status);
create index if not exists books_started_idx on books(started_at);

-- Each "I'm on page X now" entry. Monthly page stats come from the differences.
create table if not exists progress_logs (
  id         uuid primary key default gen_random_uuid(),
  book_id    uuid not null references books(id) on delete cascade,
  page       integer not null check (page >= 0),
  logged_on  date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists progress_logs_book_idx on progress_logs(book_id, logged_on);

-- Multiple review notes per book (comment thread style)
create table if not exists reviews (
  id         uuid primary key default gen_random_uuid(),
  book_id    uuid not null references books(id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists reviews_book_idx on reviews(book_id, created_at);

-- Book trees (groups with nicknames)
create table if not exists trees (
  id          uuid primary key default gen_random_uuid(),
  nickname    text not null,
  description text,
  color       text not null default '#6366f1',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists tree_nodes (
  id       uuid primary key default gen_random_uuid(),
  tree_id  uuid not null references trees(id) on delete cascade,
  book_id  uuid not null references books(id) on delete cascade,
  x        double precision not null default 0,
  y        double precision not null default 0,
  unique (tree_id, book_id)
);

create table if not exists tree_edges (
  id         uuid primary key default gen_random_uuid(),
  tree_id    uuid not null references trees(id) on delete cascade,
  from_node  uuid not null references tree_nodes(id) on delete cascade,
  to_node    uuid not null references tree_nodes(id) on delete cascade,
  relation   text not null default 'inspired',  -- 'mentioned' | 'inspired' | 'other'
  note       text
);

-- Lock everything down: only the server (service-role key) can read/write.
alter table books         enable row level security;
alter table progress_logs enable row level security;
alter table reviews       enable row level security;
alter table trees         enable row level security;
alter table tree_nodes    enable row level security;
alter table tree_edges    enable row level security;

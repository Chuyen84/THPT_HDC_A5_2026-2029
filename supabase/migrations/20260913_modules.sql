-- 1. Announcements Table
create table public.announcements (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text not null,
  is_important boolean default false,
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Class Funds Table
create table public.funds (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  amount numeric not null,
  type text check (type in ('thu', 'chi')) not null,
  transaction_date date default CURRENT_DATE,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Events / Calendar Table
create table public.events (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  event_date timestamp with time zone not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Documents Table (For storage metadata)
create table public.documents (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  file_url text not null,
  file_type text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Surveys and Options
create table public.surveys (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.survey_options (
  id uuid default uuid_generate_v4() primary key,
  survey_id uuid references public.surveys(id) on delete cascade,
  option_text text not null,
  votes integer default 0
);

-- 6. Q&A Table
create table public.questions (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text not null,
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for all new tables
alter table public.announcements enable row level security;
alter table public.funds enable row level security;
alter table public.events enable row level security;
alter table public.documents enable row level security;
alter table public.surveys enable row level security;
alter table public.survey_options enable row level security;
alter table public.questions enable row level security;

-- Basic Policies (Everyone in class can read, only certain roles can insert based on module)
-- Read all
create policy "Everyone can view announcements" on announcements for select using (true);
create policy "Everyone can view funds" on funds for select using (true);
create policy "Everyone can view events" on events for select using (true);
create policy "Everyone can view documents" on documents for select using (true);
create policy "Everyone can view surveys" on surveys for select using (true);
create policy "Everyone can view survey options" on survey_options for select using (true);
create policy "Everyone can view questions" on questions for select using (true);

-- Insert policies (simplified for development: authenticated users can insert)
create policy "Auth users can insert" on announcements for insert with check (auth.uid() = author_id);
create policy "Auth users can insert" on funds for insert with check (auth.uid() = created_by);
create policy "Auth users can insert" on events for insert with check (auth.uid() = created_by);
create policy "Auth users can insert" on documents for insert with check (auth.uid() = uploaded_by);
create policy "Auth users can insert" on surveys for insert with check (auth.uid() = created_by);
create policy "Auth users can insert" on questions for insert with check (auth.uid() = author_id);

-- Drop the old table if it exists (Optional, depending on user preference, but we'll leave it for now and just create new ones)

create table public.class_schedule_template (
  id uuid default uuid_generate_v4() primary key,
  day_of_week integer not null check (day_of_week between 2 and 7),
  period integer not null check (period between 1 and 5),
  subject text not null,
  teacher text,
  room text,
  subject_group text check (subject_group in ('tu_nhien', 'xa_hoi', 'ngoai_ngu', 'khac')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.class_schedule_template add constraint unique_template_day_period unique (day_of_week, period);

create table public.class_schedule_weekly (
  id uuid default uuid_generate_v4() primary key,
  week_start_date date not null,
  day_of_week integer not null check (day_of_week between 2 and 7),
  period integer not null check (period between 1 and 5),
  subject text not null,
  teacher text,
  room text,
  subject_group text check (subject_group in ('tu_nhien', 'xa_hoi', 'ngoai_ngu', 'khac')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.class_schedule_weekly add constraint unique_weekly_day_period unique (week_start_date, day_of_week, period);

create table public.schedule_change_log (
  id uuid default uuid_generate_v4() primary key,
  changed_by uuid references public.profiles(id) on delete set null,
  week_start_date date not null,
  day_of_week integer not null check (day_of_week between 2 and 7),
  period integer not null check (period between 1 and 5),
  old_value jsonb,
  new_value jsonb,
  changed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.class_schedule_template enable row level security;
alter table public.class_schedule_weekly enable row level security;
alter table public.schedule_change_log enable row level security;

-- Select: Everyone (authenticated or unauthenticated can view)
create policy "Everyone can view template" on class_schedule_template for select using (true);
create policy "Everyone can view weekly" on class_schedule_weekly for select using (true);
create policy "Everyone can view logs" on schedule_change_log for select using (true);

-- Insert/Update/Delete: Only Admin/GVCN
create policy "Admin/GVCN can modify template" on class_schedule_template for all using (
  exists (select 1 from profiles where id = auth.uid() and role like '%admin%' or role like '%gvcn%')
);

create policy "Admin/GVCN can modify weekly" on class_schedule_weekly for all using (
  exists (select 1 from profiles where id = auth.uid() and role like '%admin%' or role like '%gvcn%')
);

create policy "Admin/GVCN can modify logs" on schedule_change_log for all using (
  exists (select 1 from profiles where id = auth.uid() and role like '%admin%' or role like '%gvcn%')
);

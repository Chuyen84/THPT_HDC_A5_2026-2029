create table public.timetable (
  id uuid default uuid_generate_v4() primary key,
  day_of_week integer not null check (day_of_week between 2 and 7),
  period integer not null check (period between 1 and 10),
  subject text not null,
  teacher_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ràng buộc không cho phép 1 tiết học có 2 môn trùng nhau
alter table public.timetable add constraint unique_day_period unique (day_of_week, period);

alter table public.timetable enable row level security;

-- Ai cũng có quyền xem
create policy "Everyone can view timetable" on timetable for select using (true);

-- Chỉ Admin và GVCN có quyền thêm/sửa/xóa
create policy "Admin/GVCN can insert timetable" on timetable for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'gvcn'))
);

create policy "Admin/GVCN can update timetable" on timetable for update using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'gvcn'))
);

create policy "Admin/GVCN can delete timetable" on timetable for delete using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'gvcn'))
);

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create profiles table
create table public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  email text not null,
  role text not null check (role in ('admin', 'gvcn', 'phu_huynh', 'hoc_sinh')) default 'hoc_sinh',
  status text not null check (status in ('pending', 'active', 'rejected')) default 'pending',
  full_name text,
  phone_number text,
  student_id uuid, -- For parents to link to a student
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create students table
create table public.students (
  id uuid default uuid_generate_v4() primary key,
  full_name text not null,
  student_code text unique,
  dob date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Alter profiles to reference students
alter table public.profiles add constraint fk_profiles_student foreign key (student_id) references public.students(id) on delete set null;

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.students enable row level security;

-- Policies for profiles
create policy "Public profiles are viewable by everyone in the class."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Function to handle new user registration
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', coalesce(new.raw_user_meta_data->>'role', 'hoc_sinh'));
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

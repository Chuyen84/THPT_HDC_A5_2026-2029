-- 1. Announcements Category
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS category text default 'chung' check (category in ('chung', 'khan_cap', 'hoc_tap', 'quy_lop'));

-- 2. Announcement Reads
CREATE TABLE public.announcement_reads (
  user_id uuid references public.profiles(id) on delete cascade,
  announcement_id uuid references public.announcements(id) on delete cascade,
  read_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, announcement_id)
);
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own reads" ON announcement_reads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own reads" ON announcement_reads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. OCR Import Queue
CREATE TABLE public.ocr_import_queue (
  id uuid default uuid_generate_v4() primary key,
  student_name text,
  amount numeric not null,
  transfer_content text,
  image_url text,
  status text default 'cho_duyet' check (status in ('cho_duyet', 'da_duyet', 'tu_choi')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  processed_by uuid references public.profiles(id) on delete set null,
  processed_at timestamp with time zone
);
ALTER TABLE public.ocr_import_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin view ocr" ON ocr_import_queue FOR SELECT USING (exists (select 1 from profiles where id = auth.uid() and role like '%admin%' or role like '%gvcn%'));
CREATE POLICY "Admin modify ocr" ON ocr_import_queue FOR ALL USING (exists (select 1 from profiles where id = auth.uid() and role like '%admin%' or role like '%gvcn%'));

-- 4. Drop old funds table if exists
DROP TABLE IF EXISTS public.funds CASCADE;

-- 5. Fund Dues (Đợt thu quỹ)
CREATE TABLE public.fund_dues (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  amount_per_student numeric not null,
  start_date date not null,
  end_date date,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
ALTER TABLE public.fund_dues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone view fund_dues" ON fund_dues FOR SELECT USING (true);
CREATE POLICY "Admin modify fund_dues" ON fund_dues FOR ALL USING (exists (select 1 from profiles where id = auth.uid() and role like '%admin%' or role like '%gvcn%'));

-- 6. Student Due Status (Trạng thái đóng quỹ của học sinh)
CREATE TABLE public.student_due_status (
  id uuid default uuid_generate_v4() primary key,
  due_id uuid references public.fund_dues(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  status text default 'chua_nop' check (status in ('chua_nop', 'da_nop', 'mien_giam')),
  paid_amount numeric default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  UNIQUE(due_id, student_id)
);
ALTER TABLE public.student_due_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone view student_due_status" ON student_due_status FOR SELECT USING (true);
CREATE POLICY "Admin modify student_due_status" ON student_due_status FOR ALL USING (exists (select 1 from profiles where id = auth.uid() and role like '%admin%' or role like '%gvcn%'));

-- 7. Fund Transactions (Giao dịch thu/chi)
CREATE TABLE public.fund_transactions (
  id uuid default uuid_generate_v4() primary key,
  type text not null check (type in ('thu', 'chi')),
  amount numeric not null,
  category text not null, -- for chi: an_uong, in_an, khen_thuong, khac. for thu: thu_dot, tai_tro, khac
  description text not null,
  has_invoice boolean default false,
  invoice_url text,
  student_id uuid references public.students(id) on delete set null, -- if type=thu and related to student
  due_id uuid references public.fund_dues(id) on delete set null,
  date date not null default CURRENT_DATE,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references public.profiles(id) on delete set null
);
ALTER TABLE public.fund_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone view fund_transactions" ON fund_transactions FOR SELECT USING (true);
CREATE POLICY "Admin modify fund_transactions" ON fund_transactions FOR ALL USING (exists (select 1 from profiles where id = auth.uid() and role like '%admin%' or role like '%gvcn%'));

-- 8. Functions/Triggers (Optional but good)
-- Trigger to insert student_due_status for all students when a new fund_due is created
CREATE OR REPLACE FUNCTION public.create_due_status_for_all_students()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.student_due_status (due_id, student_id)
  SELECT NEW.id, id FROM public.students;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_fund_due_created
  AFTER INSERT ON public.fund_dues
  FOR EACH ROW EXECUTE FUNCTION public.create_due_status_for_all_students();

-- Tái cấu trúc toàn bộ module Quỹ Lớp (Sổ Quỹ Chi Tiết)

-- 1. Xóa bảng cũ
DROP TABLE IF EXISTS public.fund_transactions CASCADE;
DROP TABLE IF EXISTS public.student_due_status CASCADE;
DROP TABLE IF EXISTS public.fund_dues CASCADE;

-- 2. Bảng fund_period_locks
CREATE TABLE public.fund_period_locks (
    id uuid default uuid_generate_v4() primary key,
    period_month text unique not null, -- format: 'YYYY-MM'
    is_locked boolean default false not null,
    locked_by uuid references public.profiles(id) on delete set null,
    locked_at timestamptz
);
ALTER TABLE public.fund_period_locks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mọi người xem trạng thái khóa" ON public.fund_period_locks FOR SELECT USING (true);
CREATE POLICY "Admin quản lý khóa sổ" ON public.fund_period_locks FOR ALL USING (
    exists (select 1 from public.profiles where id = auth.uid() and role like '%admin%' or role like '%gvcn%')
);

-- 3. Bảng fund_transactions mới
CREATE TABLE public.fund_transactions (
    id uuid default uuid_generate_v4() primary key,
    entry_date date not null,
    voucher_number text unique,
    type text not null check (type in ('thu', 'chi')),
    category text not null,
    description text not null,
    amount numeric not null check (amount > 0),
    running_balance numeric,
    recipient_or_payer text,
    note text,
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz default now() not null,
    updated_by uuid references public.profiles(id) on delete set null,
    updated_at timestamptz default now() not null
);

ALTER TABLE public.fund_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mọi người xem sổ quỹ" ON public.fund_transactions FOR SELECT USING (true);

-- Policy cho Insert/Update/Delete (Chỉ Admin và tháng chưa khóa)
CREATE POLICY "Admin quản lý sổ quỹ" ON public.fund_transactions FOR ALL USING (
    exists (select 1 from public.profiles where id = auth.uid() and role like '%admin%' or role like '%gvcn%')
    AND
    NOT EXISTS (
        SELECT 1 FROM public.fund_period_locks 
        WHERE period_month = to_char(entry_date, 'YYYY-MM') AND is_locked = true
    )
);

-- 4. Bảng fund_attachments
CREATE TABLE public.fund_attachments (
    id uuid default uuid_generate_v4() primary key,
    transaction_id uuid not null references public.fund_transactions(id) on delete cascade,
    file_url text not null,
    file_name text,
    file_type text check (file_type in ('image', 'document')),
    uploaded_at timestamptz default now() not null
);

ALTER TABLE public.fund_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mọi người xem file đính kèm" ON public.fund_attachments FOR SELECT USING (true);
CREATE POLICY "Admin quản lý file đính kèm" ON public.fund_attachments FOR ALL USING (
    exists (select 1 from public.profiles where id = auth.uid() and role like '%admin%' or role like '%gvcn%')
    AND
    NOT EXISTS (
        SELECT 1 FROM public.fund_period_locks l
        JOIN public.fund_transactions t ON l.period_month = to_char(t.entry_date, 'YYYY-MM')
        WHERE t.id = fund_attachments.transaction_id AND l.is_locked = true
    )
);

-- 5. Trigger tự động tính running_balance
CREATE OR REPLACE FUNCTION public.recalculate_fund_balance()
RETURNS TRIGGER AS $$
DECLARE
    rec RECORD;
    current_balance numeric := 0;
BEGIN
    -- Prevent infinite recursion during UPDATE
    IF pg_trigger_depth() > 1 THEN
        RETURN NULL;
    END IF;

    -- Recalculate all balances sequentially (Safe for < 10,000 rows, perfect for class funds)
    FOR rec IN (SELECT id, amount, type FROM public.fund_transactions ORDER BY entry_date ASC, created_at ASC)
    LOOP
        IF rec.type = 'thu' THEN
            current_balance := current_balance + rec.amount;
        ELSE
            current_balance := current_balance - rec.amount;
        END IF;

        UPDATE public.fund_transactions
        SET running_balance = current_balance
        WHERE id = rec.id AND (running_balance IS NULL OR running_balance != current_balance);
    END LOOP;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_fund_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON public.fund_transactions
FOR EACH STATEMENT EXECUTE FUNCTION public.recalculate_fund_balance();

-- 6. Storage Bucket cho file đính kèm
INSERT INTO storage.buckets (id, name, public) VALUES ('fund-attachments', 'fund-attachments', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Cho phép đọc file" ON storage.objects FOR SELECT USING (bucket_id = 'fund-attachments');
CREATE POLICY "Admin upload file" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'fund-attachments' AND 
    exists (select 1 from public.profiles where id = auth.uid() and role like '%admin%' or role like '%gvcn%')
);
CREATE POLICY "Admin xóa file" ON storage.objects FOR DELETE USING (
    bucket_id = 'fund-attachments' AND 
    exists (select 1 from public.profiles where id = auth.uid() and role like '%admin%' or role like '%gvcn%')
);

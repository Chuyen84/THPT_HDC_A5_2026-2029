CREATE TABLE public.subjects (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    abbreviation text not null,
    teacher_name text not null,
    teacher_phone text,
    created_at timestamptz default now() not null
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mọi người có thể xem môn học" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Admin có thể quản lý môn học" ON public.subjects FOR ALL USING (
    exists (select 1 from public.profiles where id = auth.uid() and role like '%admin%' or role like '%gvcn%')
);

-- Dữ liệu mẫu ban đầu
INSERT INTO public.subjects (name, abbreviation, teacher_name, teacher_phone) VALUES
('Toán học', 'Toán', 'Cô Nga', '0912345678'),
('Ngữ văn', 'Văn', 'Cô Yến', '0923456789'),
('Vật lý', 'Lý', 'Cô Huệ', '0934567890'),
('Hóa học', 'Hóa', 'Thầy Vinh', '0945678901'),
('Sinh học', 'Sinh', 'Cô Mai', '0956789012'),
('Lịch sử', 'Sử', 'Cô Hà', '0967890123'),
('Địa lý', 'Địa', 'Thầy Hùng', '0978901234'),
('Tiếng Anh', 'Anh', 'Cô Hương', '0989012345'),
('Tin học', 'Tin', 'Thầy Tuấn', '0990123456'),
('Giáo dục Thể chất', 'Thể Dục', 'Thầy Mạnh', '0901234567'),
('Giáo dục Quốc phòng', 'GDQP', 'Thầy Dũng', '0912345670'),
('Sinh hoạt lớp', 'SHL', 'Cô Nga (GVCN)', '0912345678'),
('Hoạt động trải nghiệm', 'HĐTN', 'Cô Nga (GVCN)', '0912345678');

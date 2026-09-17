-- Delete all existing subjects to avoid duplicates or old data
DELETE FROM public.subjects;

-- Insert the updated list according to the new timetable
INSERT INTO public.subjects (name, abbreviation, teacher_name, teacher_phone) VALUES
('Toán học', 'Toán', 'Cô Mai', ''),
('Toán học CĐ', 'Toán CĐ', 'Cô Mai', ''),
('Ngữ văn', 'Văn', 'Cô Hoa', ''),
('Ngữ văn CĐ', 'Văn CĐ', 'Cô Hoa', ''),
('Tiếng Anh', 'Anh', 'Cô Hương', ''),
('Vật lý', 'Lý', 'Cô Huệ', ''),
('Vật lý CĐ', 'Lý CĐ', 'Cô Huệ', ''),
('Lịch sử', 'Sử', 'Cô An', ''),
('Địa lý', 'Địa', 'Thầy Chiến', ''),
('Giáo dục KTPL', 'GDKTPL', 'Cô Chung', ''),
('Giáo dục Thể chất', 'GDTC', 'Thầy Đức', ''),
('Giáo dục Quốc phòng', 'GDQP', 'Cô Vân', ''),
('Giáo dục Địa phương', 'GDĐP', 'Cô Nhung', ''),
('Công nghệ Nông nghiệp', 'CNNN', 'Cô Nguyệt', ''),
('Sinh hoạt lớp', 'SHL', 'HĐTN2', ''),
('Chào cờ', 'Chào cờ', 'HĐTN1', '');

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Deleting existing subjects...');
  await supabase.from('subjects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log('Inserting new subjects...');
  const newSubjects = [
    { name: 'Toán học', abbreviation: 'Toán', teacher_name: 'Cô Mai', teacher_phone: '' },
    { name: 'Toán học CĐ', abbreviation: 'Toán CĐ', teacher_name: 'Cô Mai', teacher_phone: '' },
    { name: 'Ngữ văn', abbreviation: 'Văn', teacher_name: 'Cô Hoa', teacher_phone: '' },
    { name: 'Ngữ văn CĐ', abbreviation: 'Văn CĐ', teacher_name: 'Cô Hoa', teacher_phone: '' },
    { name: 'Tiếng Anh', abbreviation: 'Anh', teacher_name: 'Cô Hương', teacher_phone: '' },
    { name: 'Vật lý', abbreviation: 'Lý', teacher_name: 'Cô Huệ', teacher_phone: '' },
    { name: 'Vật lý CĐ', abbreviation: 'Lý CĐ', teacher_name: 'Cô Huệ', teacher_phone: '' },
    { name: 'Lịch sử', abbreviation: 'Sử', teacher_name: 'Cô An', teacher_phone: '' },
    { name: 'Địa lý', abbreviation: 'Địa', teacher_name: 'Thầy Chiến', teacher_phone: '' },
    { name: 'Giáo dục KTPL', abbreviation: 'GDKTPL', teacher_name: 'Cô Chung', teacher_phone: '' },
    { name: 'Giáo dục Thể chất', abbreviation: 'GDTC', teacher_name: 'Thầy Đức', teacher_phone: '' },
    { name: 'Giáo dục Quốc phòng', abbreviation: 'GDQP', teacher_name: 'Cô Vân', teacher_phone: '' },
    { name: 'Giáo dục Địa phương', abbreviation: 'GDĐP', teacher_name: 'Cô Nhung', teacher_phone: '' },
    { name: 'Công nghệ Nông nghiệp', abbreviation: 'CNNN', teacher_name: 'Cô Nguyệt', teacher_phone: '' },
    { name: 'Sinh hoạt lớp', abbreviation: 'SHL', teacher_name: 'HĐTN2', teacher_phone: '' },
    { name: 'Chào cờ', abbreviation: 'Chào cờ', teacher_name: 'HĐTN1', teacher_phone: '' }
  ];

  const { data, error } = await supabase.from('subjects').insert(newSubjects);
  if (error) {
    console.error('Error inserting:', error);
  } else {
    console.log('Successfully inserted subjects!');
  }
}

run();

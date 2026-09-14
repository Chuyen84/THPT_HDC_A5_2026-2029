import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import TimetableEditor from './TimetableEditor'

export default async function ChinhSuaThoiKhoaBieuPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'gvcn') {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl">
        Chỉ có Giáo viên chủ nhiệm và Ban quản trị mới có quyền sửa thời khóa biểu.
      </div>
    )
  }

  const { data: timetable } = await supabase.from('timetable').select('*')

  return <TimetableEditor initialData={timetable || []} />
}

'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

interface TimetableCell {
  day: number
  period: number
  subject: string
  teacher: string
}

export async function saveTimetable(data: TimetableCell[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Chưa đăng nhập')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'gvcn') {
    throw new Error('Không có quyền thao tác')
  }

  // Delete all existing and insert new
  // In a real app, you might want to upsert or only delete what changed, 
  // but for a simple timetable, wiping and recreating is fastest.
  const { error: deleteError } = await supabase.from('timetable').delete().neq('id', '00000000-0000-0000-0000-000000000000') // delete all
  if (deleteError) throw new Error('Lỗi xóa lịch cũ: ' + deleteError.message)

  if (data.length > 0) {
    const insertData = data.map(d => ({
      day_of_week: d.day,
      period: d.period,
      subject: d.subject,
      teacher_name: d.teacher
    }))
    const { error: insertError } = await supabase.from('timetable').insert(insertData)
    if (insertError) throw new Error('Lỗi lưu lịch mới: ' + insertError.message)
  }

  revalidatePath('/thoi-khoa-bieu')
}

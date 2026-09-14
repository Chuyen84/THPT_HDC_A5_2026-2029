import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarDays } from 'lucide-react'
import TimetableGrid from './TimetableGrid'
import { getWeeklySchedule } from './actions'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'

dayjs.locale('vi')

export const metadata = {
  title: 'Thời khóa biểu | 10A5',
  description: 'Thời khóa biểu lớp 10A5',
}

export default async function TimetablePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const canManage = profile?.role === 'admin' || profile?.role === 'gvcn' || (profile?.role || '').includes('admin') || (profile?.role || '').includes('gvcn')

  // Lấy tuần hiện tại (bắt đầu từ Thứ 2)
  const currentWeekStart = dayjs().startOf('week').add(1, 'day').format('YYYY-MM-DD')
  
  const schedule = await getWeeklySchedule(currentWeekStart)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
          <CalendarDays className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Thời khóa biểu</h1>
          <p className="text-sm text-slate-500">Xem và quản lý lịch học</p>
        </div>
      </div>

      <TimetableGrid 
        initialSchedule={schedule} 
        canManage={!!canManage} 
        initialWeekStart={currentWeekStart}
      />
    </div>
  )
}

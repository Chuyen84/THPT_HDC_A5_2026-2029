import { createClient } from '@/utils/supabase/server'
import TimetableGrid from './TimetableGrid'
import SubjectManager from './SubjectManager'
import { getWeeklySchedule, getSubjects } from './actions'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Thời Khóa Biểu | 10A5',
  description: 'Thời khóa biểu lớp 10A5',
}

export default async function ThoiKhoaBieuPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const today = dayjs()
  const dayOfWeek = today.day() === 0 ? 7 : today.day()
  const monday = today.subtract(dayOfWeek - 1, 'day').format('YYYY-MM-DD')

  let canManage = false

  if (user) {
    const [
      { data: profile },
      schedule,
      subjects
    ] = await Promise.all([
      supabase.from('profiles').select('role').eq('id', user.id).single(),
      getWeeklySchedule(monday),
      getSubjects()
    ])

    if (profile?.role === 'admin' || profile?.role === 'gvcn') {
      canManage = true
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25" />
                </svg>
              </span>
              Thời khóa biểu
            </h1>
            <p className="text-sm text-slate-500 mt-1">Xem và quản lý lịch học</p>
          </div>
        </div>

        <TimetableGrid 
          initialSchedule={schedule} 
          canManage={canManage} 
          initialWeekStart={monday} 
          subjects={subjects}
        />
        
        <SubjectManager subjects={subjects} canManage={canManage} />
      </div>
    )
  }

  // If no user
  const [schedule, subjects] = await Promise.all([
    getWeeklySchedule(monday),
    getSubjects()
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className="p-2 bg-blue-100 text-blue-600 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25" />
              </svg>
            </span>
            Thời khóa biểu
          </h1>
          <p className="text-sm text-slate-500 mt-1">Xem và quản lý lịch học</p>
        </div>
      </div>

      <TimetableGrid 
        initialSchedule={schedule} 
        canManage={false} 
        initialWeekStart={monday} 
        subjects={subjects}
      />
      
      <SubjectManager subjects={subjects} canManage={false} />
    </div>
  )
}

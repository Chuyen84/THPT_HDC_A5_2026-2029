import { CalendarDays } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function TimetablePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let canManage = false
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role === 'admin' || profile?.role === 'gvcn') {
      canManage = true
    }
  }

  // Fetch timetable
  const { data: timetable } = await supabase.from('timetable').select('*')

  // Prepare grid data (2 -> 7 is Mon -> Sat) (1 -> 10 is period 1 to 10)
  const days = [2, 3, 4, 5, 6, 7]
  const dayNames = {
    2: 'Thứ 2', 3: 'Thứ 3', 4: 'Thứ 4', 5: 'Thứ 5', 6: 'Thứ 6', 7: 'Thứ 7'
  }
  
  const morningPeriods = [1, 2, 3, 4, 5]
  const afternoonPeriods = [6, 7, 8, 9, 10]

  const getSubject = (day: number, period: number) => {
    return timetable?.find(t => t.day_of_week === day && t.period === period)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-blue-600" />
          Thời khóa biểu
        </h1>
        {canManage && (
          <Link href="/thoi-khoa-bieu/chinh-sua" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-semibold shadow-sm">
            Chỉnh sửa lịch học
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
        <table className="w-full text-sm text-center min-w-[700px]">
          <thead className="bg-blue-50 text-blue-800 font-semibold border-b border-blue-100">
            <tr>
              <th className="p-3 border-r border-blue-100 w-24">Buổi / Tiết</th>
              {days.map(d => (
                <th key={d} className="p-3 border-r border-blue-100 last:border-0">{dayNames[d as keyof typeof dayNames]}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Morning */}
            <tr><td colSpan={7} className="bg-slate-50 p-2 font-bold text-slate-600 text-left pl-4">Sáng</td></tr>
            {morningPeriods.map(p => (
              <tr key={p} className="hover:bg-slate-50 transition">
                <td className="p-3 border-r border-slate-100 font-medium text-slate-500 bg-white">Tiết {p}</td>
                {days.map(d => {
                  const subject = getSubject(d, p)
                  return (
                    <td key={`${d}-${p}`} className="p-3 border-r border-slate-100 last:border-0 align-top">
                      {subject ? (
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-slate-800">{subject.subject}</span>
                          {subject.teacher_name && <span className="text-[11px] text-slate-500 mt-0.5">{subject.teacher_name}</span>}
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
            
            {/* Afternoon */}
            <tr><td colSpan={7} className="bg-slate-50 p-2 font-bold text-slate-600 text-left pl-4 border-t-2 border-slate-200">Chiều</td></tr>
            {afternoonPeriods.map(p => (
              <tr key={p} className="hover:bg-slate-50 transition">
                <td className="p-3 border-r border-slate-100 font-medium text-slate-500 bg-white">Tiết {p - 5}</td>
                {days.map(d => {
                  const subject = getSubject(d, p)
                  return (
                    <td key={`${d}-${p}`} className="p-3 border-r border-slate-100 last:border-0 align-top">
                      {subject ? (
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-slate-800">{subject.subject}</span>
                          {subject.teacher_name && <span className="text-[11px] text-slate-500 mt-0.5">{subject.teacher_name}</span>}
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

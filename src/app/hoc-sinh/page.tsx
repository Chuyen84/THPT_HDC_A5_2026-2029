import { createClient } from '@/utils/supabase/server'
import StudentManager from './StudentManager'
import { GraduationCap } from 'lucide-react'

export default async function HocSinhPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  let canManage = false

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role === 'admin' || profile?.role === 'gvcn') {
      canManage = true
    }
  }

  const { data: students } = await supabase
    .from('students')
    .select('*')
    .order('full_name', { ascending: true })

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 transition-colors gap-1">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-blue-600 dark:text-cyan-400 shrink-0" />
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white leading-tight">
            Danh sách Học sinh
          </h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-cyan-300 font-semibold border border-blue-200 dark:border-blue-900/60">
            Lớp 10A5
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Niên khoá 2026 - 2029 • THPT Hoài Đức C
        </p>
      </div>

      <StudentManager students={students || []} canManage={canManage} />
    </div>
  )
}

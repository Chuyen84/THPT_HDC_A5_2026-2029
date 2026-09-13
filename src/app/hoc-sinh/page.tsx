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
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 transition-colors">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2.5">
          <GraduationCap className="w-7 h-7 text-blue-600 dark:text-cyan-400" />
          Danh sách Học sinh
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Hồ sơ thông tin học sinh Lớp 10A5 - Niên khoá 2026 - 2029 và quản lý phụ huynh liên hệ
        </p>
      </div>

      <StudentManager students={students || []} canManage={canManage} />
    </div>
  )
}

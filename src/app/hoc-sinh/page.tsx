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
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <GraduationCap className="w-7 h-7 text-blue-600" />
          Danh mục Học sinh Lớp 10A5
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Quản lý hồ sơ học sinh, thông tin phụ huynh liên hệ và xuất/nhập dữ liệu file Excel
        </p>
      </div>

      <StudentManager students={students || []} canManage={canManage} />
    </div>
  )
}

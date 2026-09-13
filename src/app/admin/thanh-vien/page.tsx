import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import MemberManagement from './MemberManagement'
import { Users } from 'lucide-react'

export default async function AdminMembersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'gvcn') {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl">
        Chỉ có Quản trị viên và Giáo viên chủ nhiệm mới có quyền truy cập trang phê duyệt thành viên.
      </div>
    )
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" />
          Quản lý & Phê duyệt thành viên
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Duyệt tài khoản phụ huynh/học sinh mới đăng ký và phân quyền cho các thành viên trong lớp 10A5
        </p>
      </div>

      <MemberManagement profiles={profiles || []} />
    </div>
  )
}

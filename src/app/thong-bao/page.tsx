import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import AnnouncementList from './AnnouncementList'

export default async function ThongBaoPage() {
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
  
  const { data: announcements } = await supabase
    .from('announcements')
    .select('*, profiles(full_name, role)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Bảng thông báo</h1>
          <p className="text-xs text-slate-500 mt-1">Thông tin chính thức từ Ban cán sự và Giáo viên chủ nhiệm</p>
        </div>
        {canManage && (
          <Link href="/thong-bao/tao-moi" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium shadow-sm">
            + Đăng thông báo
          </Link>
        )}
      </div>
      
      <AnnouncementList announcements={announcements || []} canManage={canManage} />
    </div>
  )
}


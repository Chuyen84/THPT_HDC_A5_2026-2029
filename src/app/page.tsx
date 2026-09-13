import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Bell, Calendar, DollarSign, FileText } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let profile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  const { data: recentAnnouncements } = await supabase
    .from('announcements')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(3)

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-sm">
        <h1 className="text-2xl font-bold mb-2">
          {profile ? `Xin chào, ${profile.full_name || 'bạn'}!` : 'Chào mừng đến với Lớp 10A5'}
        </h1>
        <p className="text-blue-100 mb-4">
          Nơi cập nhật thông tin, trao đổi và gắn kết các thành viên trong lớp.
        </p>
        {!user && (
          <Link href="/login" className="inline-block bg-white text-blue-600 font-medium px-4 py-2 rounded-lg shadow-sm hover:bg-slate-50 transition">
            Đăng nhập ngay
          </Link>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4">Lối tắt</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/thong-bao" className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-100 transition group">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-500 shadow-sm group-hover:scale-110 transition-transform">
              <Bell className="w-6 h-6" />
            </div>
            <span className="font-medium text-slate-700 text-sm">Thông báo</span>
          </Link>
          
          <Link href="/lich" className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-100 transition group">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-green-500 shadow-sm group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <span className="font-medium text-slate-700 text-sm">Lịch học & thi</span>
          </Link>
          
          <Link href="/quy-lop" className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-100 transition group">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-orange-500 shadow-sm group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="font-medium text-slate-700 text-sm">Quỹ lớp</span>
          </Link>
          
          <Link href="/tai-lieu" className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-100 transition group">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-purple-500 shadow-sm group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <span className="font-medium text-slate-700 text-sm">Tài liệu</span>
          </Link>
        </div>
      </div>

      {/* Recent Feed */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-800">Thông báo mới nhất</h2>
          <Link href="/thong-bao" className="text-sm font-medium text-blue-600 hover:underline">
            Xem tất cả
          </Link>
        </div>
        
        <div className="space-y-3">
          {(!recentAnnouncements || recentAnnouncements.length === 0) ? (
            <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-sm">
              Chưa có thông báo nào được đăng.
            </div>
          ) : (
            recentAnnouncements.map((item) => (
              <div key={item.id} className="p-4 border border-slate-100 rounded-xl bg-white shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 text-sm">
                      {item.profiles?.full_name ? item.profiles.full_name.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <div>
                      <div className="font-medium text-slate-800 text-sm">{item.profiles?.full_name || 'Người dùng'}</div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(item.created_at).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </div>
                  {item.is_important && (
                    <span className="bg-red-50 text-red-600 border border-red-200 text-xs px-2 py-0.5 rounded-full font-medium">
                      Quan trọng
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-800 text-base mb-1">{item.title}</h3>
                <p className="text-slate-600 text-sm line-clamp-2">
                  {item.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

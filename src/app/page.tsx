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
          <h2 className="text-lg font-bold text-slate-800">Hoạt động gần đây</h2>
        </div>
        
        <div className="space-y-4">
          {/* Mockup post 1 */}
          <div className="p-4 border border-slate-100 rounded-xl">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                  GV
                </div>
                <div>
                  <div className="font-medium text-slate-800">Cô Trần Thị B</div>
                  <div className="text-xs text-slate-500">Giáo viên chủ nhiệm • 2 giờ trước</div>
                </div>
              </div>
              <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded font-medium">Quan trọng</span>
            </div>
            <h3 className="font-bold text-slate-800 mb-1">Nhắc nhở họp phụ huynh đầu năm</h3>
            <p className="text-slate-600 text-sm">
              Kính gửi các vị phụ huynh, Chủ nhật tuần này (17/09) vào lúc 8h00 sáng lớp chúng ta sẽ tổ chức buổi họp phụ huynh đầu năm. Mong mọi người sắp xếp thời gian tham dự đầy đủ.
            </p>
          </div>
          
          {/* Mockup post 2 */}
          <div className="p-4 border border-slate-100 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center font-bold text-orange-600">
                L
              </div>
              <div>
                <div className="font-medium text-slate-800">Nguyễn Văn Lớp Trưởng</div>
                <div className="text-xs text-slate-500">Học sinh • 5 giờ trước</div>
              </div>
            </div>
            <h3 className="font-bold text-slate-800 mb-1">Thu tiền áo đồng phục</h3>
            <p className="text-slate-600 text-sm">
              Các bạn nhớ ngày mai mang theo tiền áo đồng phục (150k) để nộp cho thủ quỹ nhé. Ai chưa nộp thì tranh thủ nha!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

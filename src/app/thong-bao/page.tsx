import { Bell } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function ThongBaoPage() {
  const supabase = await createClient()
  
  const { data: announcements } = await supabase
    .from('announcements')
    .select('*, profiles(full_name, role)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-2xl font-bold text-slate-800">Thông báo</h1>
        <Link href="/thong-bao/tao-moi" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm font-medium">
          + Đăng thông báo
        </Link>
      </div>
      
      <div className="space-y-4">
        {!announcements || announcements.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Bell className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p>Chưa có thông báo nào.</p>
          </div>
        ) : (
          announcements.map((item) => (
            <div key={item.id} className="p-4 border border-slate-100 rounded-xl bg-white shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                    {item.profiles?.full_name ? item.profiles.full_name.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div>
                    <div className="font-medium text-slate-800">{item.profiles?.full_name || 'Người dùng ẩn danh'}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(item.created_at).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>
                {item.is_important && (
                  <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded font-medium">Quan trọng</span>
                )}
              </div>
              <h3 className="font-bold text-slate-800 mb-2 mt-3">{item.title}</h3>
              <p className="text-slate-600 text-sm whitespace-pre-wrap">
                {item.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}


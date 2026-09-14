import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Bell, Calendar, DollarSign, FileText, CheckSquare, MessageSquare, ArrowRight, TrendingUp } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let profile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  // Fetch Recent Announcements
  const { data: recentAnnouncements } = await supabase
    .from('announcements')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(3)

  // Fetch Upcoming Events
  const { data: upcomingEvents } = await supabase
    .from('events')
    .select('*')
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true })
    .limit(3)

  // Fetch Fund Balance (Sum)
  const { data: funds } = await supabase.from('funds').select('amount, type')
  let balance = 0
  if (funds) {
    funds.forEach(f => {
      balance += f.type === 'thu' ? Number(f.amount) : -Number(f.amount)
    })
  }

  // Fetch Recent Documents
  const { data: recentDocs } = await supabase
    .from('documents')
    .select('id, title, created_at')
    .order('created_at', { ascending: false })
    .limit(3)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* 1. Welcome Banner */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-20">
          <svg width="200" height="200" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold mb-2 tracking-tight">
            {profile ? `Xin chào, ${profile.full_name || 'bạn'}! 👋` : 'Chào mừng đến với Lớp 10A5'}
          </h1>
          <p className="text-blue-100 text-lg mb-6 max-w-xl">
            Trung tâm thông tin số dành cho học sinh, phụ huynh và giáo viên chủ nhiệm. Nơi cập nhật nhanh nhất mọi hoạt động của lớp.
          </p>
          {!user && (
            <Link href="/login" className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-6 py-3 rounded-xl shadow-md hover:scale-105 transition-transform">
              Đăng nhập để xem đầy đủ
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* 2. Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LỚP TRÁI (Main Content) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Lối tắt (Quick Actions) */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">Truy cập nhanh</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { href: '/thong-bao', icon: Bell, label: 'Thông báo', color: 'text-blue-600', bg: 'bg-blue-100' },
                { href: '/lich', icon: Calendar, label: 'Lịch học', color: 'text-green-600', bg: 'bg-green-100' },
                { href: '/quy-lop', icon: DollarSign, label: 'Quỹ lớp', color: 'text-orange-600', bg: 'bg-orange-100' },
                { href: '/tai-lieu', icon: FileText, label: 'Tài liệu', color: 'text-purple-600', bg: 'bg-purple-100' },
                { href: '/khao-sat', icon: CheckSquare, label: 'Khảo sát', color: 'text-pink-600', bg: 'bg-pink-100' },
                { href: '/hoi-dap', icon: MessageSquare, label: 'Hỏi đáp', color: 'text-teal-600', bg: 'bg-teal-100' },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group flex flex-col items-center text-center">
                  <div className={`w-14 h-14 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mb-3 group-hover:-translate-y-1 transition-transform`}>
                    <item.icon className="w-7 h-7" />
                  </div>
                  <span className="font-semibold text-slate-700">{item.label}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Thông báo mới (Recent Announcements) */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-slate-800">Thông báo mới nhất</h2>
              </div>
              <Link href="/thong-bao" className="text-sm font-medium text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition">
                Xem tất cả
              </Link>
            </div>
            
            <div className="space-y-4">
              {(!recentAnnouncements || recentAnnouncements.length === 0) ? (
                <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Chưa có thông báo nào được đăng.
                </div>
              ) : (
                recentAnnouncements.map((item) => (
                  <div key={item.id} className="p-4 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-full flex items-center justify-center font-bold text-white shadow-sm">
                          {item.profiles?.full_name ? item.profiles.full_name.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{item.profiles?.full_name || 'Người dùng'}</div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {new Date(item.created_at).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                      </div>
                      {item.is_important && (
                        <span className="bg-red-50 text-red-600 border border-red-200 text-xs px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                          Quan trọng
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                    <p className="text-slate-600 text-sm line-clamp-2">
                      {item.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>

        {/* LỚP PHẢI (Sidebar Widgets) */}
        <div className="space-y-6">
          
          {/* Widget 1: Quỹ lớp */}
          {user && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 relative overflow-hidden">
              <div className="absolute -right-6 -top-6 text-slate-50 opacity-50">
                <DollarSign className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Tồn quỹ hiện tại</h3>
                </div>
                <div className="text-3xl font-black text-slate-800 mb-4">
                  {formatCurrency(balance)}
                </div>
                <Link href="/quy-lop" className="inline-block text-sm font-medium text-orange-600 hover:text-orange-700">
                  Xem chi tiết thu chi &rarr;
                </Link>
              </div>
            </div>
          )}

          {/* Widget 2: Sự kiện sắp tới */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600" />
              Sự kiện sắp tới
            </h3>
            <div className="space-y-4">
              {(!upcomingEvents || upcomingEvents.length === 0) ? (
                <div className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-lg">Không có sự kiện sắp tới.</div>
              ) : (
                upcomingEvents.map(event => {
                  const d = new Date(event.event_date);
                  return (
                    <div key={event.id} className="flex gap-4 items-center">
                      <div className="flex flex-col items-center justify-center bg-green-50 text-green-700 w-12 h-12 rounded-xl shrink-0">
                        <span className="text-[10px] font-bold uppercase">{d.toLocaleDateString('vi-VN', { month: 'short' })}</span>
                        <span className="text-lg font-black leading-none">{d.getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 text-sm truncate">{event.title}</h4>
                        <p className="text-xs text-slate-500 truncate">{event.description || 'Không có mô tả'}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 text-center">
              <Link href="/lich" className="text-sm font-medium text-slate-600 hover:text-green-600 transition">
                Mở lịch đầy đủ
              </Link>
            </div>
          </div>

          {/* Widget 3: Tài liệu mới */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Tài liệu mới đăng
            </h3>
            <ul className="space-y-3">
              {(!recentDocs || recentDocs.length === 0) ? (
                <li className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-lg">Chưa có tài liệu.</li>
              ) : (
                recentDocs.map(doc => (
                  <li key={doc.id} className="flex items-center gap-3 group cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-purple-100 group-hover:text-purple-600 transition">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-700 truncate group-hover:text-purple-600 transition">{doc.title}</div>
                      <div className="text-[10px] text-slate-400">{new Date(doc.created_at).toLocaleDateString('vi-VN')}</div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
          
        </div>
      </div>
    </div>
  )
}

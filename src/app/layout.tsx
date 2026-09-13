import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { Home, Bell, Users, DollarSign, Calendar, FileText, CheckSquare, MessageSquare } from 'lucide-react'

import { createClient } from '@/utils/supabase/server'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Lớp 10A5',
  description: 'Ứng dụng quản lý lớp học 10A5',
}

const navItems = [
  { href: '/', icon: Home, label: 'Trang chủ' },
  { href: '/thong-bao', icon: Bell, label: 'Thông báo' },
  { href: '/danh-ba', icon: Users, label: 'Danh bạ' },
  { href: '/quy-lop', icon: DollarSign, label: 'Quỹ lớp' },
  { href: '/lich', icon: Calendar, label: 'Lịch' },
  { href: '/tai-lieu', icon: FileText, label: 'Tài liệu' },
  { href: '/khao-sat', icon: CheckSquare, label: 'Khảo sát' },
  { href: '/hoi-dap', icon: MessageSquare, label: 'Hỏi đáp' },
]

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isAdminOrGvcn = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role === 'admin' || profile?.role === 'gvcn') {
      isAdminOrGvcn = true
    }
  }

  return (
    <html lang="vi">
      <body className={`${inter.className} bg-slate-50 text-slate-900 flex flex-col min-h-screen`}>
        {/* Header */}
        <header className="bg-blue-600 text-white p-4 sticky top-0 z-10 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/" className="text-xl font-bold flex items-center gap-2">
              <div className="w-8 h-8 bg-white text-blue-600 rounded-full flex items-center justify-center font-black">
                A5
              </div>
              Lớp 10A5
            </Link>
            <div className="flex items-center gap-4">
              {user ? (
                <form action="/auth/signout" method="post">
                  <button className="text-sm bg-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-800 transition">
                    Đăng xuất
                  </button>
                </form>
              ) : (
                <Link href="/login" className="text-sm bg-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-800 transition">
                  Đăng nhập
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 container mx-auto p-4 mb-16 md:mb-0 md:flex">
          {/* Sidebar for Desktop */}
          <aside className="hidden md:block w-64 mr-8 shrink-0">
            <nav className="sticky top-24 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 text-slate-700 hover:text-blue-600 transition">
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                ))}
                {isAdminOrGvcn && (
                  <li className="pt-2 border-t border-slate-100">
                    <Link href="/admin/thanh-vien" className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 transition font-semibold">
                      <Users className="w-5 h-5 text-amber-600" />
                      <span>Duyệt thành viên</span>
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
          </aside>
          
          <div className="flex-1 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100">
            {children}
          </div>
        </main>

        {/* Bottom Nav for Mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-10">
          <ul className="flex justify-around items-center p-2 pb-safe">
            {navItems.slice(0, 5).map((item) => ( // Show first 5 on mobile
              <li key={item.href} className="flex-1">
                <Link href={item.href} className="flex flex-col items-center p-2 text-slate-500 hover:text-blue-600">
                  <item.icon className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-medium text-center">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </body>
    </html>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  GraduationCap,
  Bell,
  Users,
  DollarSign,
  Calendar,
  FileText,
  CheckSquare,
  MessageSquare,
  ShieldCheck,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
  School,
} from 'lucide-react'

const navItems = [
  { href: '/', icon: Home, label: 'Trang chủ' },
  { href: '/hoc-sinh', icon: GraduationCap, label: 'Học sinh' },
  { href: '/thong-bao', icon: Bell, label: 'Thông báo' },
  { href: '/danh-ba', icon: Users, label: 'Danh bạ' },
  { href: '/quy-lop', icon: DollarSign, label: 'Quỹ lớp' },
  { href: '/lich', icon: Calendar, label: 'Lịch' },
  { href: '/tai-lieu', icon: FileText, label: 'Tài liệu' },
  { href: '/khao-sat', icon: CheckSquare, label: 'Khảo sát' },
  { href: '/hoi-dap', icon: MessageSquare, label: 'Hỏi đáp' },
]

export default function RootLayoutClient({
  children,
  user,
  isAdminOrGvcn,
}: {
  children: React.ReactNode
  user: any
  isAdminOrGvcn: boolean
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } ${collapsed ? 'lg:w-20' : 'lg:w-64'} w-64`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 overflow-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-md shadow-blue-500/20 shrink-0">
              A5
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-slate-900 text-base leading-tight tracking-tight truncate">
                  Lớp 10A5
                </span>
                <span className="text-[11px] text-slate-400 truncate">
                  THPT Hoài Đức C
                </span>
              </div>
            )}
          </Link>

          {/* Close button for mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin">
          <div className={`px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider ${collapsed ? 'text-center' : ''}`}>
            {collapsed ? '•••' : 'Menu chính'}
          </div>

          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                } ${collapsed ? 'justify-center px-2' : ''}`}
              >
                <item.icon
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            )
          })}

          {/* Admin / GVCN section */}
          {isAdminOrGvcn && (
            <div className="pt-4 mt-3 border-t border-slate-100">
              <div className={`px-3 pb-2 text-[10px] font-bold text-amber-600 uppercase tracking-wider ${collapsed ? 'text-center' : ''}`}>
                {collapsed ? '•••' : 'Quản trị'}
              </div>
              <Link
                href="/admin/thanh-vien"
                onClick={() => setMobileOpen(false)}
                title={collapsed ? 'Duyệt thành viên' : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  pathname === '/admin/thanh-vien'
                    ? 'bg-amber-100 text-amber-900 font-bold shadow-2xs'
                    : 'bg-amber-50/70 text-amber-800 hover:bg-amber-100'
                } ${collapsed ? 'justify-center px-2' : ''}`}
              >
                <ShieldCheck className="w-5 h-5 shrink-0 text-amber-600" />
                {!collapsed && <span className="truncate">Duyệt thành viên</span>}
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar Footer: Toggle Collapse & User profile */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 shrink-0 space-y-2">
          {/* Collapse button for desktop */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-full py-1.5 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition"
            title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <div className="flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" />
                <span>Thu gọn menu</span>
              </div>
            )}
          </button>

          {/* User Profile / Auth */}
          {user ? (
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className={`flex items-center gap-2.5 w-full p-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition ${
                  collapsed ? 'justify-center' : ''
                }`}
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">Đăng xuất</span>}
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className={`flex items-center gap-2.5 w-full p-2 rounded-xl text-xs font-medium text-blue-600 hover:bg-blue-50 transition ${
                collapsed ? 'justify-center' : ''
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] shrink-0">
                +
              </div>
              {!collapsed && <span className="truncate">Đăng nhập</span>}
            </Link>
          )}
        </div>
      </aside>

      {/* Main Full-Page Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger toggle */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 focus:outline-none"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <School className="w-5 h-5 text-blue-600 hidden sm:inline" />
              <span className="font-semibold text-slate-800 text-sm sm:text-base truncate">
                Cổng thông tin Lớp 10A5 - Niên khoá 2026 - 2029
              </span>
            </div>
          </div>

          {/* Right actions in header */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2 text-xs">
                <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-blue-700 uppercase">
                  {user.email ? user.email.slice(0, 2) : 'A5'}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="font-semibold text-slate-800 truncate max-w-[140px]">
                    {user.email}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {isAdminOrGvcn ? 'Giáo viên / Quản trị' : 'Thành viên'}
                  </span>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3.5 py-1.5 rounded-xl transition shadow-2xs"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </header>

        {/* Scrollable Content Container (Full Width & Height) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 min-w-0">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

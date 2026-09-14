'use client'

import { useState, useEffect, useMemo } from 'react'
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
  Sun,
  Moon,
  Phone,
  CalendarDays,
  BookOpen,
} from 'lucide-react'
import { getModulePermission, ModuleKey, parseRoleData } from '@/utils/permissions'
import NotificationBell from '@/components/NotificationBell'

const navItems: { href: string; icon: any; label: string; moduleKey?: ModuleKey }[] = [
  { href: '/', icon: Home, label: 'Trang chủ' },
  { href: '/hoc-sinh', icon: GraduationCap, label: 'Học sinh', moduleKey: 'hoc-sinh' },
  { href: '/thong-bao', icon: Bell, label: 'Thông báo', moduleKey: 'thong-bao' },
  { href: '/thoi-khoa-bieu', icon: CalendarDays, label: 'Thời khóa biểu', moduleKey: 'thoi-khoa-bieu' },
  { href: '/danh-ba', icon: Users, label: 'Danh bạ', moduleKey: 'danh-ba' },
  { href: '/quy-lop', icon: DollarSign, label: 'Quỹ lớp', moduleKey: 'quy-lop' },
  { href: '/lich', icon: Calendar, label: 'Lịch', moduleKey: 'lich' },
  { href: '/tai-lieu', icon: BookOpen, label: 'Tài liệu', moduleKey: 'tai-lieu' },
  { href: '/khao-sat', icon: CheckSquare, label: 'Khảo sát', moduleKey: 'khao-sat' },
  { href: '/hoi-dap', icon: MessageSquare, label: 'Hỏi đáp', moduleKey: 'hoi-dap' },
]

export default function AppLayoutClient({
  children,
  user,
  profile,
  isAdminOrGvcn,
}: {
  children: React.ReactNode
  user: any
  profile?: any
  isAdminOrGvcn: boolean
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    } else {
      setIsDark(false)
      document.documentElement.classList.remove('dark')
    }
  }, [])

  // Toggle theme handler
  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      setIsDark(false)
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setIsDark(true)
    }
  }

  // Display user identifier (Phone number or Full name or Email)
  const displayName =
    profile?.full_name ||
    profile?.phone_number ||
    (user?.email?.includes('@phhs.a5.local') ? user.email.split('@')[0] : user?.email) ||
    'Thành viên'
  const displayPhone =
    profile?.phone_number ||
    (user?.email?.includes('@phhs.a5.local') ? user.email.split('@')[0] : '')

  const roleLabels: Record<string, string> = {
    admin: 'Quản trị viên',
    gvcn: 'GVCN',
    phu_huynh: 'Phụ huynh',
    hoc_sinh: 'Học sinh',
  }

  const roleData = parseRoleData(profile?.role)
  const roleText = roleLabels[roleData.baseRole] || (isAdminOrGvcn ? 'GVCN / Admin' : 'Thành viên')

  // Lọc các menu hiển thị dựa trên quyền 'view' của tài khoản
  const visibleNavItems = useMemo(() => {
    return navItems.filter((item) => {
      // Trang chủ luôn luôn hiển thị
      if (!item.moduleKey) return true
      // Kiểm tra quyền xem của module
      const perm = getModulePermission(profile?.role, item.moduleKey)
      return perm.view
    })
  }, [profile?.role])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Navigation: Xanh lam sâu thẳm sang trọng (Deep Royal Blue) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-gradient-to-b from-[#0e2a47] via-[#103459] to-[#0a1e33] text-white border-r border-blue-900/50 shadow-xl transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } ${collapsed ? 'lg:w-20' : 'lg:w-64'} w-64`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 overflow-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-white font-black shadow-lg shadow-cyan-500/30 shrink-0 ring-2 ring-white/20">
              A5
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-white text-base leading-tight tracking-tight truncate drop-shadow-xs">
                  Lớp 10A5
                </span>
                <span className="text-[11px] text-cyan-200/80 truncate">
                  THPT Hoài Đức C
                </span>
              </div>
            )}
          </Link>

          {/* Close button for mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 text-slate-300 hover:text-white rounded-lg lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin">
          <div
            className={`px-3 pb-2 text-[10px] font-bold text-cyan-200/60 uppercase tracking-wider ${
              collapsed ? 'text-center' : ''
            }`}
          >
            {collapsed ? '•••' : 'Menu chính'}
          </div>

          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-white/15 text-white font-semibold shadow-inner border border-white/20 ring-1 ring-cyan-400/30'
                    : 'text-slate-200/80 hover:bg-white/10 hover:text-white'
                } ${collapsed ? 'justify-center px-2' : ''}`}
              >
                <item.icon
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-cyan-300 drop-shadow-sm' : 'text-slate-300 group-hover:text-cyan-200'
                  }`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            )
          })}

          {/* Admin / GVCN section */}
          {isAdminOrGvcn && (
            <div className="pt-4 mt-3 border-t border-white/10">
              <div
                className={`px-3 pb-2 text-[10px] font-bold text-amber-300/80 uppercase tracking-wider ${
                  collapsed ? 'text-center' : ''
                }`}
              >
                {collapsed ? '•••' : 'Quản trị'}
              </div>
              <Link
                href="/admin/thanh-vien"
                onClick={() => setMobileOpen(false)}
                title={collapsed ? 'Duyệt thành viên' : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  pathname === '/admin/thanh-vien'
                    ? 'bg-amber-500/20 text-amber-200 font-bold border border-amber-400/30'
                    : 'text-amber-200/80 hover:bg-amber-500/15 hover:text-amber-100'
                } ${collapsed ? 'justify-center px-2' : ''}`}
              >
                <ShieldCheck className="w-5 h-5 shrink-0 text-amber-400" />
                {!collapsed && <span className="truncate">Quản trị & Phân quyền</span>}
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/10 bg-black/20 shrink-0 space-y-2">
          {/* Theme Mode Toggle (Sáng / Tối) in Sidebar */}
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-2.5 w-full p-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-white/10 transition ${
              collapsed ? 'justify-center' : ''
            }`}
            title={isDark ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối'}
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-300 shrink-0" />
                {!collapsed && <span className="truncate">Giao diện: Sáng</span>}
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-cyan-300 shrink-0" />
                {!collapsed && <span className="truncate">Giao diện: Tối</span>}
              </>
            )}
          </button>

          {/* Collapse button for desktop */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-full py-1.5 text-xs text-slate-300/70 hover:text-white hover:bg-white/10 rounded-lg transition"
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
                className={`flex items-center gap-2.5 w-full p-2 rounded-xl text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition ${
                  collapsed ? 'justify-center' : ''
                }`}
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                {!collapsed && <span>Đăng xuất</span>}
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className={`flex items-center gap-2.5 w-full p-2 rounded-xl text-xs font-medium text-cyan-300 hover:bg-cyan-500/20 transition ${
                collapsed ? 'justify-center' : ''
              }`}
              title="Đăng nhập"
            >
              <School className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Đăng nhập</span>}
            </Link>
          )}

          {/* User info snippet */}
          {user && !collapsed && (
            <div className="px-2 pt-1 border-t border-white/10 text-left">
              <div className="font-semibold text-xs text-white truncate">
                {displayName}
              </div>
              <div className="text-[10px] text-cyan-200/70 truncate flex items-center justify-between">
                <span>{roleText}</span>
                {displayPhone && (
                  <span className="font-mono text-cyan-300">{displayPhone}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar on Desktop & Mobile */}
        <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 shrink-0 transition-colors">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1.5 -ml-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg focus:outline-none lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-sm tracking-tight text-slate-800 dark:text-white lg:hidden">
              10A5 - THPT Hoài Đức C
            </span>
          </div>

          <div className="flex items-center gap-2">
            {user && <NotificationBell user={user} />}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 focus:outline-none"
              title="Đổi giao diện"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950 p-3 sm:p-5 lg:p-6 transition-colors">
          <div className="max-w-[1700px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

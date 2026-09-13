import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { createClient } from '@/utils/supabase/server'
import AppLayoutClient from './AppLayoutClient'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Lớp 10A5 - THPT Hoài Đức C',
  description: 'Hệ thống quản lý lớp học 10A5 - Niên khoá 2026 - 2029',
}

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
    <html lang="vi" className="h-full">
      <body className={`${inter.className} h-full antialiased overflow-hidden`}>
        <AppLayoutClient user={user} isAdminOrGvcn={isAdminOrGvcn}>
          {children}
        </AppLayoutClient>
      </body>
    </html>
  )
}

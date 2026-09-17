import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SoQuyClient from './SoQuyClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Sổ Quỹ Chi Tiết | 10A5',
  description: 'Quản lý thu chi và tồn quỹ lớp 10A5',
}

export default async function SoQuyPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch everything concurrently to avoid waterfall
  const [
    { data: profile },
    { data: transactions },
    { data: locks }
  ] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase
      .from('fund_transactions')
      .select('*, fund_attachments(*)')
      .order('entry_date', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase.from('fund_period_locks').select('*')
  ])

  const canManage = profile?.role === 'admin' || profile?.role === 'gvcn' || (profile?.role || '').includes('admin') || (profile?.role || '').includes('gvcn')

  return (
    <SoQuyClient 
      canManage={!!canManage}
      transactions={transactions || []}
      locks={locks || []}
      userId={user.id}
    />
  )
}

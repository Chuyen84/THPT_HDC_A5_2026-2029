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

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const canManage = profile?.role === 'admin' || profile?.role === 'gvcn' || (profile?.role || '').includes('admin') || (profile?.role || '').includes('gvcn')

  // Fetch transactions with attachments
  const { data: transactions } = await supabase
    .from('fund_transactions')
    .select(`
      *,
      fund_attachments(*)
    `)
    .order('entry_date', { ascending: true })
    .order('created_at', { ascending: true })

  // Fetch locks
  const { data: locks } = await supabase
    .from('fund_period_locks')
    .select('*')

  return (
    <SoQuyClient 
      canManage={!!canManage}
      transactions={transactions || []}
      locks={locks || []}
      userId={user.id}
    />
  )
}

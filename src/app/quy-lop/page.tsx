import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import QuyLopClient from './QuyLopClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Quỹ Lớp | 10A5',
  description: 'Quản lý quỹ lớp 10A5',
}

export default async function QuyLopPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const canManage = profile?.role === 'admin' || profile?.role === 'gvcn' || (profile?.role || '').includes('admin') || (profile?.role || '').includes('gvcn')

  // Fetch transactions
  const { data: transactions } = await supabase
    .from('fund_transactions')
    .select(`
      *,
      students(full_name),
      fund_dues(title)
    `)
    .order('date', { ascending: false })

  let totalThu = 0
  let totalChi = 0
  const thuTxs: any[] = []
  const chiTxs: any[] = []
  const chiCategories: Record<string, number> = {}

  if (transactions) {
    transactions.forEach(tx => {
      const amount = Number(tx.amount)
      if (tx.type === 'thu') {
        totalThu += amount
        thuTxs.push(tx)
      } else {
        totalChi += amount
        chiTxs.push(tx)
        if (!chiCategories[tx.category]) chiCategories[tx.category] = 0
        chiCategories[tx.category] += amount
      }
    })
  }

  const chiCategoryTotals = Object.keys(chiCategories).map(cat => ({
    category: cat,
    total: chiCategories[cat]
  })).sort((a, b) => b.total - a.total)

  // Fetch current due
  const { data: dues } = await supabase
    .from('fund_dues')
    .select('*')
    .order('start_date', { ascending: false })
    .limit(1)
  
  const currentDue = dues && dues.length > 0 ? dues[0] : null
  let paidStudents = 0
  let totalStudents = 0

  if (currentDue) {
    const { data: dueStatus } = await supabase
      .from('student_due_status')
      .select('status')
      .eq('due_id', currentDue.id)
    
    if (dueStatus) {
      totalStudents = dueStatus.length
      paidStudents = dueStatus.filter(s => s.status === 'da_nop' || s.status === 'mien_giam').length
    }
  }

  return (
    <QuyLopClient 
      canManage={!!canManage}
      totalThu={totalThu}
      totalChi={totalChi}
      currentDue={currentDue}
      paidStudents={paidStudents}
      totalStudents={totalStudents}
      thuTransactions={thuTxs}
      chiTransactions={chiTxs}
      chiCategoryTotals={chiCategoryTotals}
    />
  )
}

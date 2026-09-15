'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteFund(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Chưa đăng nhập')
  }

  // Check role
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'gvcn' && !profile?.role?.includes('admin') && !profile?.role?.includes('gvcn')) {
    throw new Error('Không có quyền xóa')
  }

  // Delete from fund_transactions if exists
  const { error: err1 } = await supabase.from('fund_transactions').delete().eq('id', id)
  if (err1) {
    // Fallback delete from funds table
    await supabase.from('funds').delete().eq('id', id)
  }

  revalidatePath('/quy-lop')
}

export async function getStudentsForImport() {
  const supabase = await createClient()
  const { data } = await supabase.from('students').select('id, full_name, student_code').order('full_name')
  return data || []
}

export interface ImportFundItem {
  studentName?: string
  studentId?: string
  title: string
  amount: number
  type: 'thu' | 'chi'
  date: string
  category: string
  note?: string
}

export async function bulkImportFunds(items: ImportFundItem[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Chưa đăng nhập')
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'gvcn' && !profile?.role?.includes('admin') && !profile?.role?.includes('gvcn')) {
    throw new Error('Chỉ Quản trị viên hoặc GVCN mới có quyền import dữ liệu')
  }

  if (!items || items.length === 0) {
    throw new Error('Không có dữ liệu để import')
  }

  // 1. Try to insert into fund_transactions
  const txRows = items.map(it => ({
    type: it.type || 'thu',
    amount: it.amount,
    category: it.category || 'thu_dot',
    description: it.title || (it.studentName ? `Thu tiền: ${it.studentName}` : 'Thu quỹ lớp'),
    date: it.date || new Date().toISOString().split('T')[0],
    student_id: it.studentId || null,
    created_by: user.id
  }))

  const { error: txError } = await supabase.from('fund_transactions').insert(txRows)

  // 2. If fund_transactions table is not present, insert into funds table
  if (txError) {
    console.warn('fund_transactions insert error, fallback to funds:', txError.message)
    const fundRows = items.map(it => ({
      title: it.title || (it.studentName ? `Thu tiền: ${it.studentName}` : 'Thu quỹ'),
      amount: it.amount,
      type: it.type || 'thu',
      transaction_date: it.date || new Date().toISOString().split('T')[0],
      category: it.category || 'thu_dot',
      receiver: it.studentName || null,
      created_by: user.id
    }))

    const { error: fundError } = await supabase.from('funds').insert(fundRows)
    if (fundError) {
      throw new Error('Lỗi lưu dữ liệu thu quỹ: ' + fundError.message)
    }
  }

  revalidatePath('/quy-lop')
  return { success: true, count: items.length }
}


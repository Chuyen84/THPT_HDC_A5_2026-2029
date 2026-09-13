'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

async function checkIsAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Chưa đăng nhập')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'gvcn') {
    throw new Error('Chỉ Quản trị viên hoặc GVCN mới có quyền thực hiện thao tác này')
  }
  return { supabase, user }
}

export async function updateMemberStatus(id: string, status: 'active' | 'rejected' | 'pending') {
  const { supabase } = await checkIsAdmin()

  const { error } = await supabase
    .from('profiles')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/thanh-vien')
  revalidatePath('/danh-ba')
}

export async function updateMemberRole(id: string, role: string) {
  const { supabase } = await checkIsAdmin()

  const { error } = await supabase
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/thanh-vien')
  revalidatePath('/danh-ba')
}

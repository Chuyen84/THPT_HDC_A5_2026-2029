'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteEvent(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Chưa đăng nhập')
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'gvcn') {
    throw new Error('Không có quyền xóa sự kiện')
  }

  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/lich')
}

'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addDocument(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Chưa đăng nhập')
  }

  const title = formData.get('title') as string
  const file_url = formData.get('file_url') as string
  const file_type = formData.get('file_type') as string || 'Tài liệu'

  if (!title || !file_url) {
    throw new Error('Vui lòng điền đầy đủ tiêu đề và đường link')
  }

  const { error } = await supabase.from('documents').insert({
    title,
    file_url,
    file_type,
    uploaded_by: user.id
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/tai-lieu')
}

export async function deleteDocument(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Chưa đăng nhập')
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  
  // Either admin, gvcn or the uploader can delete
  const { data: doc } = await supabase.from('documents').select('uploaded_by').eq('id', id).single()

  const isOwner = doc?.uploaded_by === user.id
  const isAdminOrGvcn = profile?.role === 'admin' || profile?.role === 'gvcn'

  if (!isOwner && !isAdminOrGvcn) {
    throw new Error('Bạn không có quyền xóa tài liệu này')
  }

  const { error } = await supabase.from('documents').delete().eq('id', id)
  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/tai-lieu')
}

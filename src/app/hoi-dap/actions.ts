'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addQuestion(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Chưa đăng nhập')
  }

  const title = formData.get('title') as string
  const content = formData.get('content') as string

  if (!title || !content) {
    throw new Error('Vui lòng nhập cả tiêu đề và nội dung câu hỏi')
  }

  const { error } = await supabase.from('questions').insert({
    title,
    content,
    author_id: user.id
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/hoi-dap')
}

export async function deleteQuestion(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Chưa đăng nhập')
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const { data: q } = await supabase.from('questions').select('author_id').eq('id', id).single()

  const isOwner = q?.author_id === user.id
  const isAdminOrGvcn = profile?.role === 'admin' || profile?.role === 'gvcn'

  if (!isOwner && !isAdminOrGvcn) {
    throw new Error('Bạn không có quyền xóa câu hỏi này')
  }

  const { error } = await supabase.from('questions').delete().eq('id', id)
  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/hoi-dap')
}

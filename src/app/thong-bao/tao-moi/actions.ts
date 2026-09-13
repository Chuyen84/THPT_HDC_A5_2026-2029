'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function submitAnnouncement(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return

  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const is_important = formData.get('is_important') === 'on'

  const { error } = await supabase.from('announcements').insert({
    title,
    content,
    is_important,
    author_id: user.id
  })

  if (error) {
    console.error('Error inserting announcement:', error)
    return
  }

  revalidatePath('/thong-bao')
  revalidatePath('/')
  redirect('/thong-bao')
}

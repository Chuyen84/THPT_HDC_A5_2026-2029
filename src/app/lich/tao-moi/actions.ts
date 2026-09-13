'use server'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function submitEvent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const event_date = formData.get('event_date') as string

  await supabase.from('events').insert({ title, description, event_date, created_by: user.id })
  revalidatePath('/lich')
  redirect('/lich')
}

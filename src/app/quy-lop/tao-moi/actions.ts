'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function submitFund(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return

  const type = formData.get('type') as string
  const title = formData.get('title') as string
  const amount = Number(formData.get('amount'))
  const category = formData.get('category') as string || null
  const receiver = formData.get('receiver') as string || null

  const { error } = await supabase.from('funds').insert({
    type,
    title,
    amount,
    transaction_date,
    category,
    receiver,
    created_by: user.id
  })

  if (error) {
    console.error('Error inserting fund:', error)
    return
  }

  revalidatePath('/quy-lop')
  redirect('/quy-lop')
}

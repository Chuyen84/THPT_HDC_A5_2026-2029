'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function submitFund(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return

  const type = formData.get('type') as string
  const description = formData.get('description') as string
  const amount = Number(formData.get('amount'))
  const date = formData.get('date') as string
  const category = formData.get('category') as string || (type === 'chi' ? 'khac' : 'thu_dot')

  const { error } = await supabase.from('fund_transactions').insert({
    type,
    description,
    amount,
    date,
    category,
    created_by: user.id
  })

  if (error) {
    console.error('Error inserting fund:', error)
    return
  }

  revalidatePath('/quy-lop')
  redirect('/quy-lop')
}

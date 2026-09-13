'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createSurvey(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Chưa đăng nhập')
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'gvcn') {
    throw new Error('Chỉ Quản trị viên và GVCN mới có quyền tạo khảo sát')
  }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const optionsRaw = formData.getAll('options') as string[]

  const options = optionsRaw.map((o) => o.trim()).filter((o) => o.length > 0)

  if (!title || options.length < 2) {
    throw new Error('Vui lòng nhập tiêu đề và ít nhất 2 phương án bình chọn')
  }

  // Insert survey
  const { data: survey, error: sError } = await supabase
    .from('surveys')
    .insert({
      title,
      description,
      created_by: user.id
    })
    .select()
    .single()

  if (sError || !survey) {
    throw new Error(sError?.message || 'Không thể tạo khảo sát')
  }

  // Insert survey options
  const optionRows = options.map((opt) => ({
    survey_id: survey.id,
    option_text: opt,
    votes: 0
  }))

  const { error: optError } = await supabase.from('survey_options').insert(optionRows)
  if (optError) {
    throw new Error(optError.message)
  }

  revalidatePath('/khao-sat')
}

export async function voteOption(optionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Chưa đăng nhập')
  }

  // Increment vote count
  const { data: currentOpt, error: fetchErr } = await supabase
    .from('survey_options')
    .select('votes')
    .eq('id', optionId)
    .single()

  if (fetchErr) throw new Error(fetchErr.message)

  const newVotes = (currentOpt?.votes || 0) + 1

  const { error: updateErr } = await supabase
    .from('survey_options')
    .update({ votes: newVotes })
    .eq('id', optionId)

  if (updateErr) throw new Error(updateErr.message)

  revalidatePath('/khao-sat')
}

export async function deleteSurvey(surveyId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Chưa đăng nhập')
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'gvcn') {
    throw new Error('Không có quyền xóa khảo sát')
  }

  const { error } = await supabase.from('surveys').delete().eq('id', surveyId)
  if (error) throw new Error(error.message)

  revalidatePath('/khao-sat')
}

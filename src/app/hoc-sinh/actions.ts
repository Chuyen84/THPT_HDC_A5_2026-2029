'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addStudent(data: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Chưa đăng nhập')

  const { error } = await supabase.from('students').insert({
    full_name: data.full_name,
    gender: data.gender || 'Nam',
    dob: data.dob || null,
    address: data.address || '',
    father_name: data.father_name || '',
    father_phone: data.father_phone || '',
    mother_name: data.mother_name || '',
    mother_phone: data.mother_phone || '',
    notes: data.notes || '',
  })

  if (error) throw new Error(error.message)
  revalidatePath('/hoc-sinh')
}

export async function updateStudent(id: string, data: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Chưa đăng nhập')

  const { error } = await supabase
    .from('students')
    .update({
      full_name: data.full_name,
      gender: data.gender || 'Nam',
      dob: data.dob || null,
      address: data.address || '',
      father_name: data.father_name || '',
      father_phone: data.father_phone || '',
      mother_name: data.mother_name || '',
      mother_phone: data.mother_phone || '',
      notes: data.notes || '',
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/hoc-sinh')
}

export async function deleteStudent(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Chưa đăng nhập')

  const { error } = await supabase.from('students').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/hoc-sinh')
}

export async function importStudentsBatch(studentsList: any[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Chưa đăng nhập')

  if (!studentsList || studentsList.length === 0) {
    throw new Error('Danh sách học sinh rỗng')
  }

  const { error } = await supabase.from('students').insert(studentsList)
  if (error) throw new Error(error.message)

  revalidatePath('/hoc-sinh')
  return { success: true, count: studentsList.length }
}

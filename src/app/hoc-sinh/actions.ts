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

// Xóa hàng loạt theo danh sách ID
export async function deleteStudentsBatch(ids: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Chưa đăng nhập')

  if (!ids || ids.length === 0) return

  const { error } = await supabase.from('students').delete().in('id', ids)
  if (error) throw new Error(error.message)
  revalidatePath('/hoc-sinh')
}

// Xóa toàn bộ học sinh trong bảng
export async function clearAllStudents() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Chưa đăng nhập')

  const { error } = await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) throw new Error(error.message)
  revalidatePath('/hoc-sinh')
}

// Import học sinh (Hỗ trợ thêm mới hoặc cập nhật nối tiếp)
export async function importStudentsBatch(studentsToInsert: any[], studentsToUpdate: { id: string; data: any }[] = []) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Chưa đăng nhập')

  // Cập nhật các bản ghi ghi đè
  if (studentsToUpdate && studentsToUpdate.length > 0) {
    for (const item of studentsToUpdate) {
      await supabase.from('students').update(item.data).eq('id', item.id)
    }
  }

  // Thêm mới các bản ghi nối tiếp
  if (studentsToInsert && studentsToInsert.length > 0) {
    const { error } = await supabase.from('students').insert(studentsToInsert)
    if (error) throw new Error(error.message)
  }

  revalidatePath('/hoc-sinh')
  return { success: true }
}

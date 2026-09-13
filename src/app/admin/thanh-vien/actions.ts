'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

async function checkIsAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Chưa đăng nhập')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'gvcn') {
    throw new Error('Chỉ Quản trị viên hoặc GVCN mới có quyền thực hiện thao tác này')
  }
  return { supabase, user }
}

export async function updateMemberStatus(id: string, status: 'active' | 'rejected' | 'pending') {
  const { supabase } = await checkIsAdmin()

  const { error } = await supabase
    .from('profiles')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/thanh-vien')
  revalidatePath('/danh-ba')
}

export async function updateMemberRole(id: string, role: string) {
  const { supabase } = await checkIsAdmin()

  const { error } = await supabase
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/thanh-vien')
  revalidatePath('/danh-ba')
}

// Xoá thành viên khỏi hệ thống
export async function deleteMember(id: string) {
  const { supabase } = await checkIsAdmin()

  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/thanh-vien')
  revalidatePath('/danh-ba')
}

// Admin thêm tài khoản mới và phân quyền trực tiếp
export async function createAccountByAdmin(formData: {
  identifier: string // SĐT hoặc Email
  fullName: string
  role: 'admin' | 'gvcn' | 'phu_huynh' | 'hoc_sinh'
  customPassword?: string
}) {
  await checkIsAdmin()

  const { identifier, fullName, role, customPassword } = formData
  if (!identifier || !fullName) {
    throw new Error('Vui lòng điền đầy đủ thông tin tài khoản và họ tên!')
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  let email = ''
  let phoneNumber: string | null = null
  let password = ''

  if (identifier.includes('@')) {
    email = identifier.trim()
    password = customPassword || '123456'
  } else {
    // Standardize phone number
    let cleanPhone = identifier.replace(/[\s\.\-\(\)]/g, '').trim()
    if (/^\d{9}$/.test(cleanPhone)) {
      cleanPhone = '0' + cleanPhone
    }
    if (!/^0\d{9}$/.test(cleanPhone)) {
      throw new Error('Số điện thoại không hợp lệ! Vui lòng nhập đúng 10 số (VD: 0912345678)')
    }
    phoneNumber = cleanPhone
    email = `${cleanPhone}@phhs.a5.local`
    // Password default convention: <phone>_phhs or custom password if provided
    password = customPassword || `${cleanPhone}_phhs`
  }

  // Call Supabase Auth signup API
  const res = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      data: {
        full_name: fullName.trim(),
        phone_number: phoneNumber,
        role,
      },
    }),
  })

  const authResult = await res.json()
  if (!res.ok) {
    throw new Error(authResult.msg || authResult.error_description || authResult.message || 'Không thể tạo tài khoản xác thực')
  }

  const newUserId = authResult.user?.id || authResult.id
  if (newUserId) {
    // Update profile to ensure correct role and active status
    const supabase = await createClient()
    await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        role,
        status: 'active',
        phone_number: phoneNumber,
      })
      .eq('id', newUserId)
  }

  revalidatePath('/admin/thanh-vien')
  revalidatePath('/danh-ba')

  return {
    success: true,
    identifier: phoneNumber || email,
    password,
    role,
  }
}

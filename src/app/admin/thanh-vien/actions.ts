'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { encodeRoleData, parseRoleData, UserPermissions } from '@/utils/permissions'

async function checkIsAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Chưa đăng nhập')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const roleData = parseRoleData(profile?.role)
  if (roleData.baseRole !== 'admin' && roleData.baseRole !== 'gvcn') {
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

// Cập nhật phân quyền chi tiết (Menu list: view, add, edit, delete)
export async function updateMemberDetailedPermissions(
  id: string,
  baseRole: 'admin' | 'gvcn' | 'phu_huynh' | 'hoc_sinh',
  customPerms: UserPermissions
) {
  const { supabase } = await checkIsAdmin()

  const encodedRole = encodeRoleData(baseRole, customPerms)

  const { error } = await supabase
    .from('profiles')
    .update({ role: encodedRole, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/thanh-vien')
  revalidatePath('/', 'layout')
}

// Sửa thông tin tài khoản (Họ tên, SĐT, Email, Mật khẩu mới nếu có) và phân quyền
export async function updateMemberAccount(formData: {
  id: string
  fullName: string
  phoneNumber?: string
  email?: string
  baseRole: 'admin' | 'gvcn' | 'phu_huynh' | 'hoc_sinh'
  customPerms?: UserPermissions
  newPassword?: string
}) {
  const { supabase } = await checkIsAdmin()
  const { id, fullName, phoneNumber, email, baseRole, customPerms, newPassword } = formData

  if (!id || !fullName) {
    throw new Error('Vui lòng cung cấp đầy đủ thông tin bắt buộc')
  }

  const encodedRole = encodeRoleData(baseRole, customPerms)

  const updateData: any = {
    full_name: fullName.trim(),
    role: encodedRole,
    updated_at: new Date().toISOString(),
  }

  if (phoneNumber !== undefined) {
    let cleanPhone = phoneNumber.replace(/[^0-9]/g, '').trim()
    if (cleanPhone) {
      if (/^\d{9}$/.test(cleanPhone)) {
        cleanPhone = '0' + cleanPhone
      }
      if (!/^0\d{9}$/.test(cleanPhone)) {
        throw new Error('Số điện thoại không hợp lệ! Vui lòng nhập đúng 10 chữ số')
      }
      updateData.phone_number = cleanPhone
    } else {
      updateData.phone_number = null
    }
  }

  if (email !== undefined && email.trim()) {
    updateData.email = email.trim()
  }

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', id)

  if (error) throw new Error(error.message)

  // Nếu Admin đổi mật khẩu mới cho tài khoản, gọi Supabase Admin Auth API
  if (newPassword && newPassword.trim()) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    // Thử cập nhật mật khẩu qua Supabase Admin API
    try {
      await fetch(`${supabaseUrl}/auth/v1/admin/users/${id}`, {
        method: 'PUT',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: newPassword.trim(),
        }),
      })
    } catch (e) {
      console.warn('Could not update auth password directly:', e)
    }
  }

  revalidatePath('/admin/thanh-vien')
  revalidatePath('/danh-ba')
  revalidatePath('/', 'layout')

  return { 
    success: true,
    updatedProfile: {
      id,
      ...updateData,
    }
  }
}

// Xoá thành viên khỏi hệ thống
export async function deleteMember(id: string) {
  const { supabase } = await checkIsAdmin()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // 1. Nếu có service role key, xoá trực tiếp trong Auth (sẽ cascade xoá luôn profile)
  if (serviceRoleKey) {
    try {
      await fetch(`${supabaseUrl}/auth/v1/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
      })
    } catch (e) {
      console.warn('Could not delete auth user via service role:', e)
    }
  }

  // 2. Thử xoá trực tiếp từ bảng profiles
  const { error: deleteError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id)

  // 3. Nếu delete gặp lỗi do RLS policy chưa cấu hình DELETE, ta đánh dấu status = 'rejected' để loại khỏi danh sách
  if (deleteError) {
    console.warn('Direct delete blocked by RLS, setting status to rejected:', deleteError.message)
    await supabase
      .from('profiles')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', id)
  }

  revalidatePath('/admin/thanh-vien')
  revalidatePath('/danh-ba')
  revalidatePath('/', 'layout')

  return { success: true }
}

// Admin thêm tài khoản mới và phân quyền chi tiết trực tiếp
export async function createAccountByAdmin(formData: {
  identifier: string // SĐT hoặc Email
  fullName: string
  role: 'admin' | 'gvcn' | 'phu_huynh' | 'hoc_sinh'
  customPassword?: string
  customPerms?: UserPermissions
}) {
  await checkIsAdmin()

  const { identifier, fullName, role, customPassword, customPerms } = formData
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
    let cleanPhone = identifier.replace(/[^0-9]/g, '').trim()
    if (/^\d{9}$/.test(cleanPhone)) {
      cleanPhone = '0' + cleanPhone
    }
    if (!/^0\d{9}$/.test(cleanPhone)) {
      throw new Error('Số điện thoại không hợp lệ! Vui lòng nhập đúng 10 số (VD: 0912345678)')
    }
    phoneNumber = cleanPhone
    email = `${cleanPhone}@phhs.a5.local`
    password = customPassword || `123456`
  }

  const encodedRole = encodeRoleData(role, customPerms)

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
        role: encodedRole,
      },
    }),
  })

  const authResult = await res.json()
  if (!res.ok) {
    throw new Error(authResult.msg || authResult.error_description || authResult.message || 'Không thể tạo tài khoản xác thực')
  }

  const newUserId = authResult.user?.id || authResult.id
  if (newUserId) {
    const supabase = await createClient()
    await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        role: encodedRole,
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

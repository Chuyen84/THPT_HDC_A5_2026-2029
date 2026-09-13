'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

// Format phone number to standard: strips spaces/dots and ensures leading 0
function cleanPhoneNumber(raw: string): string {
  let p = raw.replace(/[\s\.\-\(\)]/g, '').trim()
  if (/^\d{9}$/.test(p)) {
    p = '0' + p
  }
  return p
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const rawPhone = (formData.get('phone') as string || '').trim()
  const password = (formData.get('password') as string || '').trim()

  if (!rawPhone) {
    redirect('/login?message=' + encodeURIComponent('Vui lòng nhập số điện thoại đăng nhập!'))
  }

  // Support both direct phone number or email (for Admin/GVCN fallback)
  let email = ''
  let cleanedPhone = ''

  if (rawPhone.includes('@')) {
    email = rawPhone
  } else {
    cleanedPhone = cleanPhoneNumber(rawPhone)
    // Check if phone matches 10 digits
    if (!/^0\d{9}$/.test(cleanedPhone)) {
      redirect('/login?message=' + encodeURIComponent('Số điện thoại không hợp lệ! Vui lòng nhập đúng 10 số (VD: 0912345678)'))
    }
    // Map phone to internal Auth email
    email = `${cleanedPhone}@phhs.a5.local`
  }

  // 1. Try sign in with Supabase Auth
  const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  // 2. If user doesn't exist yet in auth.users, check if this phone number belongs to a Parent in students table!
  if (signInError && cleanedPhone) {
    const expectedPassword = `${cleanedPhone}_phhs`

    // If password provided matches the required convention <phone>_phhs
    if (password === expectedPassword) {
      // Look up student by father_phone or mother_phone
      const { data: studentList } = await supabase
        .from('students')
        .select('*')
        .or(`father_phone.eq.${cleanedPhone},mother_phone.eq.${cleanedPhone}`)
        .limit(1)

      if (studentList && studentList.length > 0) {
        const student = studentList[0]
        const isFather = student.father_phone === cleanedPhone
        const parentName = isFather ? student.father_name : student.mother_name
        const roleName = 'phu_huynh'

        // Automatically provision auth user for parent
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email,
          password: expectedPassword,
          options: {
            data: {
              full_name: parentName || `Phụ huynh em ${student.full_name}`,
              phone_number: cleanedPhone,
              role: roleName,
            },
          },
        })

        if (!signUpErr && signUpData.user) {
          // Activate profile directly since phone number is verified against students table
          await supabase
            .from('profiles')
            .update({
              status: 'active',
              role: roleName,
              phone_number: cleanedPhone,
              full_name: parentName || `Phụ huynh em ${student.full_name}`,
              student_id: student.id,
            })
            .eq('id', signUpData.user.id)

          // Re-sign in
          await supabase.auth.signInWithPassword({
            email,
            password: expectedPassword,
          })

          revalidatePath('/', 'layout')
          redirect('/')
        }
      }
    }
  }

  if (signInError) {
    redirect(`/login?message=${encodeURIComponent('Số điện thoại hoặc mật khẩu không chính xác! Quy ước mật khẩu: <sodienthoai>_phhs')}`)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

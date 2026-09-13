import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function PendingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-center">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Chờ phê duyệt</h1>
        <p className="text-slate-600 mb-6">
          Tài khoản của bạn đã được tạo thành công nhưng đang chờ Quản trị viên phê duyệt để có thể truy cập vào dữ liệu lớp. Vui lòng quay lại sau!
        </p>
        
        <form action="/auth/signout" method="post">
          <button className="text-blue-600 font-medium hover:underline">
            Đăng xuất
          </button>
        </form>
      </div>
    </div>
  )
}

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { submitAnnouncement } from './actions'
import Link from 'next/link'

export default async function TaoThongBaoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if they are GVCN or admin
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  
  if (profile?.role !== 'admin' && profile?.role !== 'gvcn') {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl">
        Chỉ có Giáo viên chủ nhiệm và Ban quản trị mới có thể đăng thông báo.
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4 border-b pb-4">
        <Link href="/thong-bao" className="text-slate-500 hover:text-slate-700">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Tạo thông báo mới</h1>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <form action={submitAnnouncement} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu đề</label>
            <input 
              name="title" 
              required 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="VD: Họp phụ huynh đầu năm..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nội dung</label>
            <textarea 
              name="content" 
              required 
              rows={5}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Nhập nội dung thông báo..."
            ></textarea>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_important" name="is_important" className="w-4 h-4 text-blue-600" />
            <label htmlFor="is_important" className="text-sm text-slate-700 font-medium">Đánh dấu là thông báo quan trọng</label>
          </div>

          <div className="pt-4">
            <button type="submit" className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition">
              Đăng thông báo
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

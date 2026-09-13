import { submitEvent } from './actions'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function TaoLichPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'gvcn') {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl">
        Chỉ có Giáo viên chủ nhiệm và Ban quản trị mới có quyền tạo sự kiện lịch.
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4 border-b pb-4">
        <Link href="/lich" className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Thêm sự kiện / Lịch học mới</h1>
          <p className="text-xs text-slate-500 mt-0.5">Tạo lịch kiểm tra, hoạt động ngoại khóa, thi đua lớp</p>
        </div>
      </div>

      <form action={submitEvent} className="space-y-4 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tên sự kiện / Lịch học</label>
          <input 
            name="title" 
            required 
            placeholder="VD: Kiểm tra 1 tiết Toán hình học..." 
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Thời gian diễn ra</label>
          <input 
            name="event_date" 
            type="datetime-local" 
            required 
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú / Mô tả chi tiết</label>
          <textarea 
            name="description" 
            placeholder="Nội dung ôn tập, phòng học, hoặc các đồ dùng cần mang theo..." 
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" 
            rows={4}
          ></textarea>
        </div>

        <div className="pt-2">
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition shadow-sm">
            Lưu sự kiện
          </button>
        </div>
      </form>
    </div>
  )
}

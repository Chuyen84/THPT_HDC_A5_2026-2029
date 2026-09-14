import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { submitFund } from './actions'
import Link from 'next/link'

export default async function TaoQuyLopPage() {
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
        Chỉ có Giáo viên chủ nhiệm và Ban quản trị mới có quyền quản lý quỹ lớp.
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4 border-b pb-4">
        <Link href="/quy-lop" className="text-slate-500 hover:text-slate-700">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Thêm Giao Dịch Mới</h1>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <form action={submitFund} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Loại giao dịch</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" name="type" value="thu" defaultChecked className="text-blue-600 focus:ring-blue-500" />
                <span className="font-medium text-green-600">Khoản Thu</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="type" value="chi" className="text-blue-600 focus:ring-blue-500" />
                <span className="font-medium text-orange-600">Khoản Chi</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Khoản mục (Danh mục)</label>
            <input 
              name="category" 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="VD: Quỹ đầu năm, Ăn liên hoan..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nội dung chi tiết</label>
            <input 
              name="title" 
              required 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="VD: Thu tiền đồng phục kỳ 1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Người nhận tiền / Người nộp</label>
            <input 
              name="receiver" 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="VD: Đỗ Thị Tâm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Số tiền (VNĐ)</label>
            <input 
              name="amount" 
              type="number"
              min="0"
              step="1000"
              required 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="VD: 150000"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ngày giao dịch</label>
            <input 
              name="transaction_date" 
              type="date"
              required 
              defaultValue={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="pt-4">
            <button type="submit" className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition">
              Lưu giao dịch
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

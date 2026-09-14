import { DollarSign, Wallet, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import FundTable from './FundTable'

export const dynamic = 'force-dynamic'

export default async function QuyLopPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  let canManage = false

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role === 'admin' || profile?.role === 'gvcn') {
      canManage = true
    }
  }

  // Fetch fund data
  const { data: funds } = await supabase
    .from('funds')
    .select('*, profiles(full_name)')
    .order('transaction_date', { ascending: false })

  let totalThu = 0
  let totalChi = 0

  if (funds) {
    funds.forEach(fund => {
      if (fund.type === 'thu') totalThu += Number(fund.amount)
      if (fund.type === 'chi') totalChi += Number(fund.amount)
    })
  }

  const balance = totalThu - totalChi
  const expectedTotal = 20000000 // Tạm tính quỹ dự kiến là 20 triệu
  const remainingToCollect = Math.max(0, expectedTotal - totalThu)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-2xl font-bold text-slate-800">Quản lý Quỹ Lớp</h1>
        {canManage && (
          <Link href="/quy-lop/tao-moi" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-semibold shadow-sm">
            + Thêm thu/chi
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Tổng thu */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-green-50 text-[#16A34A] rounded-xl"><ArrowDownCircle className="w-5 h-5" /></div>
            <h3 className="text-sm font-semibold text-slate-600">Tổng thu</h3>
          </div>
          <div className="text-2xl font-bold text-slate-800">{formatCurrency(totalThu)}</div>
        </div>

        {/* Tổng chi */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-orange-50 text-[#EA580C] rounded-xl"><ArrowUpCircle className="w-5 h-5" /></div>
            <h3 className="text-sm font-semibold text-slate-600">Tổng chi</h3>
          </div>
          <div className="text-2xl font-bold text-slate-800">{formatCurrency(totalChi)}</div>
        </div>

        {/* Còn lại (Tồn quỹ) */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-blue-50 text-[#1E40AF] rounded-xl"><Wallet className="w-5 h-5" /></div>
            <h3 className="text-sm font-semibold text-slate-600">Tồn quỹ hiện tại</h3>
          </div>
          <div className="text-2xl font-bold text-blue-700">{formatCurrency(balance)}</div>
        </div>

        {/* Còn phải thu */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-slate-50 text-slate-600 rounded-xl"><DollarSign className="w-5 h-5" /></div>
            <h3 className="text-sm font-semibold text-slate-600">Còn phải thu (Dự kiến)</h3>
          </div>
          <div className="text-2xl font-bold text-slate-500">{formatCurrency(remainingToCollect)}</div>
        </div>
      </div>
      
      <div className="space-y-4 mt-8">
        <h2 className="text-lg font-bold text-slate-800">Theo dõi thu chi ({funds?.length || 0})</h2>
        
        {!funds || funds.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Wallet className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p>Chưa có giao dịch nào.</p>
          </div>
        ) : (
          <FundTable funds={funds} canManage={canManage} />
        )}
      </div>
    </div>
  )
}

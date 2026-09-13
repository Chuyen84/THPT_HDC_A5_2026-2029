import { DollarSign } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import FundTable from './FundTable'

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

  // Lấy dữ liệu quỹ lớp
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-2xl font-bold text-slate-800">Quỹ lớp</h1>
        <Link href="/quy-lop/tao-moi" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm font-medium">
          + Thêm thu/chi
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <div className="text-sm text-blue-600 font-medium mb-1">Tổng thu</div>
          <div className="text-2xl font-bold text-blue-800">{formatCurrency(totalThu)}</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
          <div className="text-sm text-orange-600 font-medium mb-1">Tổng chi</div>
          <div className="text-2xl font-bold text-orange-800">{formatCurrency(totalChi)}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
          <div className="text-sm text-green-600 font-medium mb-1">Tồn quỹ hiện tại</div>
          <div className="text-2xl font-bold text-green-800">{formatCurrency(balance)}</div>
        </div>
      </div>
      
      <div className="space-y-4 mt-8">
        <h2 className="text-lg font-bold text-slate-800">Lịch sử giao dịch ({funds?.length || 0})</h2>
        
        {!funds || funds.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <DollarSign className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p>Chưa có giao dịch nào.</p>
          </div>
        ) : (
          <FundTable funds={funds} canManage={canManage} />
        )}
      </div>
    </div>
  )
}


import { DollarSign } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function QuyLopPage() {
  const supabase = await createClient()

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
        <h2 className="text-lg font-bold text-slate-800">Lịch sử giao dịch</h2>
        
        {!funds || funds.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <DollarSign className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p>Chưa có giao dịch nào.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-4 font-medium">Ngày</th>
                  <th className="p-4 font-medium">Nội dung</th>
                  <th className="p-4 font-medium">Người tạo</th>
                  <th className="p-4 font-medium text-right">Số tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {funds.map((fund) => (
                  <tr key={fund.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 text-slate-600">
                      {new Date(fund.transaction_date).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-4 font-medium text-slate-800">{fund.title}</td>
                    <td className="p-4 text-slate-600">{fund.profiles?.full_name || 'N/A'}</td>
                    <td className={`p-4 text-right font-bold ${fund.type === 'thu' ? 'text-green-600' : 'text-orange-600'}`}>
                      {fund.type === 'thu' ? '+' : '-'}{formatCurrency(Number(fund.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}


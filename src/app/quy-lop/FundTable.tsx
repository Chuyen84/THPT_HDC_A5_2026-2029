'use client'

import { useState } from 'react'
import { Trash2, Search, Filter } from 'lucide-react'
import { deleteFund } from './actions'

interface Fund {
  id: string
  title: string
  amount: number
  type: 'thu' | 'chi'
  transaction_date: string
  category?: string
  receiver?: string
  profiles?: {
    full_name: string | null
  } | null
}

export default function FundTable({
  funds,
  canManage,
}: {
  funds: Fund[]
  canManage: boolean
}) {
  const [filterType, setFilterType] = useState<'all' | 'thu' | 'chi'>('all')
  const [search, setSearch] = useState('')
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  // Sắp xếp tăng dần theo ngày để tính "Tồn" (Running Balance)
  const sortedForCalculation = [...funds].sort((a, b) => 
    new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
  )

  let currentBalance = 0
  const fundsWithBalance = sortedForCalculation.map(f => {
    if (f.type === 'thu') currentBalance += Number(f.amount)
    if (f.type === 'chi') currentBalance -= Number(f.amount)
    return { ...f, runningBalance: currentBalance }
  })

  // Đảo ngược lại để hiển thị cái mới nhất lên đầu
  const displayFunds = fundsWithBalance.reverse().filter((f) => {
    const matchType = filterType === 'all' || f.type === filterType
    const matchSearch =
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      (f.profiles?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.category || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.receiver || '').toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc muốn xóa khoản giao dịch "${title}" không?`)) return
    try {
      setIsDeleting(id)
      await deleteFund(id)
    } catch (err: any) {
      alert('Không thể xóa: ' + (err.message || 'Lỗi không xác định'))
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo nội dung, người tạo, khoản mục..."
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-medium text-slate-600">Lọc:</span>
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-xs font-medium">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-md transition ${filterType === 'all' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-blue-600'}`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterType('thu')}
              className={`px-3 py-1 rounded-md transition ${filterType === 'thu' ? 'bg-green-600 text-white' : 'text-slate-600 hover:text-green-600'}`}
            >
              Khoản Thu
            </button>
            <button
              onClick={() => setFilterType('chi')}
              className={`px-3 py-1 rounded-md transition ${filterType === 'chi' ? 'bg-orange-600 text-white' : 'text-slate-600 hover:text-orange-600'}`}
            >
              Khoản Chi
            </button>
          </div>
        </div>
      </div>

      {displayFunds.length === 0 ? (
        <div className="text-center py-8 text-slate-500 bg-white rounded-xl border border-slate-100">
          Không tìm thấy giao dịch nào phù hợp.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-3 font-medium border-r border-slate-100">Ngày</th>
                <th className="p-3 font-medium border-r border-slate-100">Khoản mục</th>
                <th className="p-3 font-medium border-r border-slate-100">Nội dung</th>
                <th className="p-3 font-medium border-r border-slate-100">Người tạo</th>
                <th className="p-3 font-medium border-r border-slate-100">Người nhận tiền</th>
                <th className="p-3 font-medium border-r border-slate-100 text-right">Thu</th>
                <th className="p-3 font-medium border-r border-slate-100 text-right">Chi</th>
                <th className="p-3 font-medium text-right">Tồn</th>
                {canManage && <th className="p-3 font-medium text-center w-12"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayFunds.map((fund) => (
                <tr key={fund.id} className="hover:bg-slate-50 transition">
                  <td className="p-3 text-slate-500 border-r border-slate-100">
                    {new Date(fund.transaction_date).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="p-3 text-slate-700 border-r border-slate-100">
                    {fund.category || <span className="text-slate-300 italic">Trống</span>}
                  </td>
                  <td className="p-3 font-medium text-slate-800 border-r border-slate-100">
                    {fund.title}
                  </td>
                  <td className="p-3 text-slate-600 border-r border-slate-100">
                    {fund.profiles?.full_name || 'N/A'}
                  </td>
                  <td className="p-3 text-slate-700 border-r border-slate-100">
                    {fund.receiver || <span className="text-slate-300 italic">Trống</span>}
                  </td>
                  
                  {/* Cột Thu */}
                  <td className="p-3 text-right font-bold text-green-600 border-r border-slate-100 bg-green-50/30">
                    {fund.type === 'thu' ? `+${formatCurrency(Number(fund.amount))}` : '-'}
                  </td>
                  
                  {/* Cột Chi */}
                  <td className="p-3 text-right font-bold text-orange-600 border-r border-slate-100 bg-orange-50/30">
                    {fund.type === 'chi' ? `-${formatCurrency(Number(fund.amount))}` : '-'}
                  </td>

                  {/* Cột Tồn */}
                  <td className="p-3 text-right font-bold text-blue-700 bg-blue-50/30">
                    {formatCurrency(fund.runningBalance)}
                  </td>

                  {canManage && (
                    <td className="p-2 text-center">
                      <button
                        onClick={() => handleDelete(fund.id, fund.title)}
                        disabled={isDeleting === fund.id}
                        className="text-slate-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition"
                        title="Xóa giao dịch"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

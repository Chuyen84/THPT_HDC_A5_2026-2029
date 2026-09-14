'use client'

import { useState, useMemo } from 'react'
import { Plus, Lock, Unlock, FileText, Image as ImageIcon, Trash2, Edit2, Download, X } from 'lucide-react'
import dayjs from 'dayjs'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts'
import TransactionForm from './TransactionForm'
import { createBrowserClient } from '@supabase/ssr'

const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount)

interface Props {
  canManage: boolean
  transactions: any[]
  locks: any[]
  userId: string
}

export default function SoQuyClient({ canManage, transactions, locks, userId }: Props) {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const [currentYear, setCurrentYear] = useState(dayjs().year().toString())
  const [currentMonth, setCurrentMonth] = useState((dayjs().month() + 1).toString().padStart(2, '0'))
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<any>(null)
  const [viewingImages, setViewingImages] = useState<string[]>([])

  const periodString = `${currentYear}-${currentMonth}`
  const isLocked = locks.find(l => l.period_month === periodString)?.is_locked || false

  // Find max voucher numbers for the form auto-gen
  const currentMaxVoucher = useMemo(() => {
    let maxThu = 0
    let maxChi = 0
    transactions.forEach(t => {
      if (t.voucher_number) {
        const num = parseInt(t.voucher_number.replace(/\D/g, ''))
        if (!isNaN(num)) {
          if (t.type === 'thu' && num > maxThu) maxThu = num
          if (t.type === 'chi' && num > maxChi) maxChi = num
        }
      }
    })
    return { thu: maxThu, chi: maxChi }
  }, [transactions])

  const filteredTx = useMemo(() => {
    return transactions.filter(t => dayjs(t.entry_date).format('YYYY-MM') === periodString)
  }, [transactions, periodString])

  // Stats for the selected month
  const stats = useMemo(() => {
    let tongThu = 0
    let tongChi = 0
    filteredTx.forEach(t => {
      if (t.type === 'thu') tongThu += Number(t.amount)
      if (t.type === 'chi') tongChi += Number(t.amount)
    })

    // Find the last transaction BEFORE this month to get opening balance
    const beforeTx = transactions.filter(t => t.entry_date < `${periodString}-01`)
    const openingBalance = beforeTx.length > 0 ? Number(beforeTx[beforeTx.length - 1].running_balance) : 0
    const closingBalance = openingBalance + tongThu - tongChi

    return { openingBalance, tongThu, tongChi, closingBalance }
  }, [transactions, filteredTx, periodString])

  // Chart data (Grouped by month for the selected year)
  const chartData = useMemo(() => {
    const months = Array.from({length: 12}, (_, i) => (i + 1).toString().padStart(2, '0'))
    return months.map(m => {
      const p = `${currentYear}-${m}`
      const tx = transactions.filter(t => dayjs(t.entry_date).format('YYYY-MM') === p)
      let thu = 0, chi = 0
      tx.forEach(t => {
        if (t.type === 'thu') thu += Number(t.amount)
        if (t.type === 'chi') chi += Number(t.amount)
      })
      return { name: `T${m}`, thu, chi }
    })
  }, [transactions, currentYear])

  const handleToggleLock = async () => {
    if (!canManage) return
    
    if (isLocked) {
      if (!confirm('Bạn có chắc chắn muốn MỞ KHÓA sổ quỹ tháng này? Việc này có thể ảnh hưởng đến tính minh bạch.')) return
      if (!confirm('Xác nhận lần 2: Chắc chắn mở khóa?')) return
    }

    try {
      await supabase.from('fund_period_locks').upsert({
        period_month: periodString,
        is_locked: !isLocked,
        locked_by: userId,
        locked_at: new Date().toISOString()
      }, { onConflict: 'period_month' })
      
      window.location.reload() // Simple refresh to get new lock state
    } catch (err) {
      console.error(err)
      alert('Có lỗi xảy ra khi thay đổi trạng thái khóa.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!canManage || isLocked) return
    if (!confirm('Bạn có chắc chắn muốn xóa giao dịch này? Số dư sẽ được tự động tính toán lại.')) return
    
    try {
      await supabase.from('fund_transactions').delete().eq('id', id)
      window.location.reload()
    } catch (err) {
      console.error(err)
      alert('Lỗi xóa giao dịch.')
    }
  }

  const handleSuccess = () => {
    window.location.reload()
  }

  const checkIsLocked = (dateStr: string) => {
    const p = dayjs(dateStr).format('YYYY-MM')
    return locks.find(l => l.period_month === p)?.is_locked || false
  }

  return (
    <div className="space-y-6">
      {/* Header Lọc */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <select value={currentMonth} onChange={e => setCurrentMonth(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {Array.from({length: 12}, (_, i) => {
              const m = (i + 1).toString().padStart(2, '0')
              return <option key={m} value={m}>Tháng {m}</option>
            })}
          </select>
          <select value={currentYear} onChange={e => setCurrentYear(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="2026">Năm 2026</option>
            <option value="2027">Năm 2027</option>
          </select>

          {isLocked ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded-lg uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" /> Đã khóa sổ
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg uppercase tracking-wider">
              <Unlock className="w-3.5 h-3.5" /> Đang mở
            </span>
          )}
        </div>

        {canManage && !isLocked && (
          <button onClick={() => { setEditingTx(null); setIsFormOpen(true); }} className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition font-semibold shadow-sm">
            <Plus className="w-4 h-4" /> Thêm giao dịch
          </button>
        )}
      </div>

      {/* 4 Thẻ Số Liệu */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <h3 className="text-sm font-semibold text-slate-500 mb-2">Tồn quỹ đầu kỳ</h3>
          <div className="text-xl md:text-2xl font-bold text-slate-800">{formatCurrency(stats.openingBalance)}</div>
        </div>
        <div className="bg-emerald-50 p-5 rounded-2xl shadow-sm border border-emerald-100 flex flex-col justify-between">
          <h3 className="text-sm font-semibold text-emerald-700 mb-2">Tổng Thu trong kỳ</h3>
          <div className="text-xl md:text-2xl font-bold text-emerald-600">+{formatCurrency(stats.tongThu)}</div>
        </div>
        <div className="bg-red-50 p-5 rounded-2xl shadow-sm border border-red-100 flex flex-col justify-between">
          <h3 className="text-sm font-semibold text-red-700 mb-2">Tổng Chi trong kỳ</h3>
          <div className="text-xl md:text-2xl font-bold text-red-600">-{formatCurrency(stats.tongChi)}</div>
        </div>
        <div className="bg-blue-600 p-5 rounded-2xl shadow-md text-white flex flex-col justify-between">
          <h3 className="text-sm font-semibold text-blue-100 mb-2">Tồn quỹ cuối kỳ</h3>
          <div className="text-xl md:text-2xl font-bold">{formatCurrency(stats.closingBalance)}</div>
        </div>
      </div>

      {/* Biểu đồ & Quản lý */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6">Biểu đồ Thu / Chi Năm {currentYear}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(val: any) => formatCurrency(Number(val))} />
                <Bar dataKey="thu" name="Thu" fill="#16A34A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="chi" name="Chi" fill="#DC2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {canManage && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4">Khóa sổ kế toán</h3>
            <p className="text-sm text-slate-500 mb-6">
              Khóa sổ sẽ ngăn chặn mọi thay đổi (thêm, sửa, xóa) đối với các giao dịch trong tháng, đảm bảo tính minh bạch.
            </p>
            
            {isLocked ? (
              <button onClick={handleToggleLock} className="w-full py-3 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                <Unlock className="w-5 h-5" /> Mở khóa tháng {currentMonth}
              </button>
            ) : (
              <button onClick={handleToggleLock} className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                <Lock className="w-5 h-5" /> Khóa sổ tháng {currentMonth}
              </button>
            )}

            <div className="mt-8">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Lịch sử khóa sổ</h4>
              <div className="space-y-2 text-sm max-h-[150px] overflow-y-auto pr-2 scrollbar-thin">
                {locks.map(l => (
                  <div key={l.id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                    <span className="font-medium text-slate-600">Tháng {l.period_month}</span>
                    {l.is_locked ? <span className="text-red-600 font-semibold text-xs bg-red-50 px-2 py-1 rounded">Đã khóa</span> : <span className="text-emerald-600 font-semibold text-xs bg-emerald-50 px-2 py-1 rounded">Mở</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bảng Dữ Liệu */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left whitespace-nowrap min-w-[1200px]">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-center">STT</th>
                <th className="px-4 py-3">Ngày tháng</th>
                <th className="px-4 py-3">Khoản mục</th>
                <th className="px-4 py-3">Khoản mục chi tiết</th>
                <th className="px-4 py-3 w-64 max-w-xs">Nội dung</th>
                <th className="px-4 py-3 text-right">Thu</th>
                <th className="px-4 py-3 text-right">Chi</th>
                <th className="px-4 py-3 text-right font-bold">Tồn quỹ</th>
                <th className="px-4 py-3">Người nhận/nộp</th>
                <th className="px-4 py-3 text-center">Đính kèm</th>
                <th className="px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTx.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-slate-500">Chưa có giao dịch nào trong tháng {currentMonth}/{currentYear}</td>
                </tr>
              ) : (
                filteredTx.map((tx, idx) => {
                  const isTxLocked = checkIsLocked(tx.entry_date)
                  const images = tx.fund_attachments?.filter((a: any) => a.file_type === 'image') || []
                  const docs = tx.fund_attachments?.filter((a: any) => a.file_type === 'document') || []
                  
                  return (
                    <tr key={tx.id} className={`hover:bg-slate-50 transition-colors ${isTxLocked ? 'opacity-60 bg-slate-50/50' : ''}`}>
                      <td className="px-4 py-3 text-center text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">{dayjs(tx.entry_date).format('DD/MM/YYYY')}</td>
                      <td className="px-4 py-3 text-slate-600 uppercase text-xs font-semibold">{tx.category}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${tx.type === 'thu' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {tx.voucher_number || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-800 font-medium whitespace-normal w-64 max-w-xs">{tx.description}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-bold">{tx.type === 'thu' ? formatCurrency(tx.amount) : ''}</td>
                      <td className="px-4 py-3 text-right text-red-600 font-bold">{tx.type === 'chi' ? formatCurrency(tx.amount) : ''}</td>
                      <td className="px-4 py-3 text-right text-blue-600 font-black bg-blue-50/30">{formatCurrency(tx.running_balance || 0)}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{tx.recipient_or_payer || '-'}</td>
                      
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {images.length > 0 && (
                            <button onClick={() => setViewingImages(images.map((i: any) => i.file_url))} className="relative group rounded-md overflow-hidden border border-slate-200">
                              <img src={images[0].file_url} className="w-8 h-8 object-cover" alt="thumb" />
                              {images.length > 1 && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] text-white font-bold">+{images.length - 1}</div>}
                            </button>
                          )}
                          {docs.length > 0 && (
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-50 text-blue-600 rounded-md border border-blue-100" title={docs.map((d:any)=>d.file_name).join(', ')}>
                              <FileText className="w-4 h-4" />
                              <span className="text-[10px] ml-0.5 font-bold">{docs.length}</span>
                            </div>
                          )}
                          {images.length === 0 && docs.length === 0 && <span className="text-slate-300">-</span>}
                        </div>
                      </td>
                      
                      <td className="px-4 py-3 text-center">
                        {isTxLocked ? (
                          <Lock className="w-4 h-4 text-slate-400 mx-auto" />
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            {canManage && (
                              <>
                                <button onClick={() => { setEditingTx(tx); setIsFormOpen(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(tx.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSuccess={handleSuccess} 
        initialData={editingTx} 
        currentMaxVoucher={currentMaxVoucher}
        isLocked={checkIsLocked}
      />

      {/* Image Lightbox */}
      {viewingImages.length > 0 && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4">
          <button onClick={() => setViewingImages([])} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-white/10 rounded-full">
            <X className="w-6 h-6" />
          </button>
          <div className="flex gap-4 overflow-x-auto max-w-full pb-4 snap-x">
            {viewingImages.map((url, i) => (
              <img key={i} src={url} className="max-h-[85vh] object-contain snap-center rounded-lg shadow-2xl" alt="attachment" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

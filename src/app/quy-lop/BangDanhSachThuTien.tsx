'use client'

import { useState, useMemo } from 'react'
import {
  Search,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  Plus,
  Filter,
  Save,
  X,
  DollarSign,
  Loader2
} from 'lucide-react'
import dayjs from 'dayjs'
import { upsertFundPayment, deleteFund } from './actions'

import { useRouter } from 'next/navigation'

interface Student {
  id: string
  full_name: string
  student_code?: string | null
}

interface ThuTransaction {
  id: string
  amount: number
  category?: string
  description: string
  date: string
  students?: { full_name: string } | null
  student_id?: string | null
}

interface Props {
  students: Student[]
  thuTransactions: ThuTransaction[]
  canManage: boolean
  onOpenImport: () => void
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

const normalize = (str: string) => {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .trim()
}

export default function BangDanhSachThuTien({
  students,
  thuTransactions,
  canManage,
  onOpenImport
}: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all')
  const [editingStudent, setEditingStudent] = useState<{
    id?: string
    studentName: string
    studentId?: string
    amount: number
    date: string
    note: string
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletedTxIds, setDeletedTxIds] = useState<string[]>([])
  const [error, setError] = useState('')

  // Map each student to their payment records (filter out optimistically deleted txs)
  const studentPaymentList = useMemo(() => {
    const activeTxs = thuTransactions.filter(t => !deletedTxIds.includes(t.id))
    const txByStudent: Record<string, ThuTransaction[]> = {}
    const extraTxs: ThuTransaction[] = []

    activeTxs.forEach(tx => {
      const studentName = tx.students?.full_name || ''
      let matchedStudent = students.find(s => s.id === tx.student_id)
      if (!matchedStudent && studentName) {
        const norm = normalize(studentName)
        matchedStudent = students.find(s => normalize(s.full_name) === norm)
      }

      if (matchedStudent) {
        if (!txByStudent[matchedStudent.id]) txByStudent[matchedStudent.id] = []
        txByStudent[matchedStudent.id].push(tx)
      } else {
        extraTxs.push(tx)
      }
    })

    const list = students.map((stu, index) => {
      const txs = txByStudent[stu.id] || []
      const totalAmount = txs.reduce((sum, t) => sum + Number(t.amount || 0), 0)
      const isPaid = txs.length > 0 && totalAmount > 0
      const latestTx = txs.length > 0 ? txs[0] : null
      const date = latestTx ? latestTx.date : ''
      const note = latestTx ? (latestTx.description.replace(/^Thu tiền.*?:s*/i, '').replace(stu.full_name, '').replace(/^[- :]+/, '').trim() || latestTx.description) : ''

      return {
        stt: index + 1,
        studentId: stu.id,
        studentName: stu.full_name,
        studentCode: stu.student_code,
        isPaid,
        amount: totalAmount,
        date,
        note,
        transactionId: latestTx ? latestTx.id : undefined,
        allTxs: txs
      }
    })

    extraTxs.forEach((tx, idx) => {
      const rawName = tx.students?.full_name || tx.description.replace(/^Thu tiền.*?:s*/i, '').trim() || 'Người nộp khác'
      list.push({
        stt: students.length + idx + 1,
        studentId: '',
        studentName: rawName,
        studentCode: null,
        isPaid: true,
        amount: Number(tx.amount || 0),
        date: tx.date,
        note: tx.description,
        transactionId: tx.id,
        allTxs: [tx]
      })
    })

    return list
  }, [students, thuTransactions, deletedTxIds])

  const filteredList = useMemo(() => {
    return studentPaymentList.filter(item => {
      const matchesSearch = !search || 
        normalize(item.studentName).includes(normalize(search)) ||
        (item.studentCode && item.studentCode.toLowerCase().includes(search.toLowerCase())) ||
        (item.note && normalize(item.note).includes(normalize(search)))

      if (!matchesSearch) return false

      if (filterStatus === 'paid') return item.isPaid
      if (filterStatus === 'unpaid') return !item.isPaid
      return true
    })
  }, [studentPaymentList, search, filterStatus])

  const totalPaidCount = studentPaymentList.filter(s => s.isPaid).length
  const totalUnpaidCount = studentPaymentList.length - totalPaidCount
  const totalCollectedMoney = studentPaymentList.reduce((sum, s) => sum + s.amount, 0)

  const handleOpenEdit = (item: typeof studentPaymentList[0]) => {
    setEditingStudent({
      id: item.transactionId,
      studentName: item.studentName,
      studentId: item.studentId || undefined,
      amount: item.amount || 1718000,
      date: item.date || new Date().toISOString().split('T')[0],
      note: item.note || ''
    })
    setError('')
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStudent) return
    setIsSubmitting(true)
    setError('')
    try {
      await upsertFundPayment({
        id: editingStudent.id,
        studentName: editingStudent.studentName,
        studentId: editingStudent.studentId,
        amount: Number(editingStudent.amount),
        date: editingStudent.date,
        note: editingStudent.note
      })
      setEditingStudent(null)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Lỗi khi cập nhật khoản thu.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (txId: string, studentName: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa khoản thu của "${studentName}"? Thao tác này sẽ xóa vĩnh viễn khoản nộp.`)) return
    setDeletingId(txId)
    // Cập nhật giao diện ngay lập tức (optimistic UI)
    setDeletedTxIds(prev => [...prev, txId])

    try {
      await deleteFund(txId)
      router.refresh()
    } catch (err: any) {
      // Hoàn tác nếu lỗi
      setDeletedTxIds(prev => prev.filter(id => id !== txId))
      alert(err.message || 'Lỗi khi xóa khoản thu.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Table Top Header */}
      <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50/50 via-white to-slate-50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h3 className="font-bold text-slate-800 text-lg">
                Bảng Danh Sách Thu Tiền Theo Học Sinh
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Theo dõi chi tiết khoản thu của từng học sinh trong lớp (STT, Họ và tên, Số tiền đã nộp, Trạng thái, Ghi chú)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canManage && (
              <button
                type="button"
                onClick={onOpenImport}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition shadow-sm"
              >
                <Plus className="w-4 h-4" /> Import Excel / Ảnh thu tiền
              </button>
            )}
          </div>
        </div>

        {/* Quick KPI stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-200/60">
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Tổng tiền đã thu</span>
            <span className="text-lg font-black text-emerald-600">{formatCurrency(totalCollectedMoney)}</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Sĩ số lớp</span>
            <span className="text-lg font-bold text-slate-800">{studentPaymentList.length} học sinh</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Đã nộp tiền</span>
            <span className="text-lg font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> {totalPaidCount} HS
            </span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Chưa nộp tiền</span>
            <span className="text-lg font-bold text-amber-600 flex items-center gap-1">
              <Clock className="w-4 h-4" /> {totalUnpaidCount} HS
            </span>
          </div>
        </div>

        {/* Filter and Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên học sinh, ghi chú..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            <span className="text-xs text-slate-500 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Lọc:
            </span>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterStatus === 'all'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả ({studentPaymentList.length})
            </button>
            <button
              onClick={() => setFilterStatus('paid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterStatus === 'paid'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Đã đóng ({totalPaidCount})
            </button>
            <button
              onClick={() => setFilterStatus('unpaid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterStatus === 'unpaid'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              Chưa đóng ({totalUnpaidCount})
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#8ec251] text-white uppercase tracking-wider font-bold border-b border-[#7bb140]">
            <tr>
              <th className="p-3.5 text-center w-14 border-r border-[#7bb140]/60">STT</th>
              <th className="p-3.5 min-w-[200px] border-r border-[#7bb140]/60">Họ và tên</th>
              <th className="p-3.5 text-right min-w-[140px] border-r border-[#7bb140]/60">Số tiền</th>
              <th className="p-3.5 text-center min-w-[130px] border-r border-[#7bb140]/60">Trạng thái</th>
              <th className="p-3.5 min-w-[120px] border-r border-[#7bb140]/60">Ngày nộp</th>
              <th className="p-3.5 min-w-[220px] border-r border-[#7bb140]/60">Ghi chú</th>
              {canManage && (
                <th className="p-3.5 text-center w-24">Thao tác</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 7 : 6} className="p-10 text-center text-slate-400">
                  Không tìm thấy học sinh nào phù hợp với bộ lọc
                </td>
              </tr>
            ) : (
              filteredList.map((item) => (
                <tr
                  key={item.studentId || item.stt}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    !item.isPaid ? 'bg-amber-50/20' : ''
                  }`}
                >
                  <td className="p-3.5 text-center font-bold text-slate-400">
                    {item.stt}
                  </td>
                  <td className="p-3.5 font-bold text-slate-800">
                    <div className="flex items-center gap-2">
                      <span>{item.studentName}</span>
                      {item.studentCode && (
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({item.studentCode})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3.5 text-right whitespace-nowrap">
                    {item.isPaid ? (
                      <span className="font-extrabold text-emerald-600 text-sm">
                        {formatCurrency(item.amount)}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium italic">0 đ</span>
                    )}
                  </td>
                  <td className="p-3.5 text-center whitespace-nowrap">
                    {item.isPaid ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100/70 text-emerald-700 rounded-full font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã đóng
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100/70 text-amber-700 rounded-full font-semibold text-[11px]">
                        <Clock className="w-3.5 h-3.5" /> Chưa đóng
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-slate-600 whitespace-nowrap">
                    {item.date ? dayjs(item.date).format('DD/MM/YYYY') : '-'}
                  </td>
                  <td className="p-3.5 text-slate-600 max-w-xs truncate" title={item.note}>
                    {item.note || '-'}
                  </td>
                  {canManage && (
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Cập nhật khoản thu"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {item.transactionId && (
                          <button
                            type="button"
                            disabled={deletingId === item.transactionId}
                            onClick={() => handleDelete(item.transactionId!, item.studentName)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                            title="Xóa khoản thu"
                          >
                            {deletingId === item.transactionId ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit / Update Single Payment Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Cập nhật thu tiền: {editingStudent.studentName}
              </h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số tiền nộp (VNĐ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1000"
                  value={editingStudent.amount}
                  onChange={(e) =>
                    setEditingStudent((prev) =>
                      prev ? { ...prev, amount: Number(e.target.value) } : null
                    )
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="VD: 1718000"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ngày nộp tiền
                </label>
                <input
                  type="date"
                  value={editingStudent.date}
                  onChange={(e) =>
                    setEditingStudent((prev) =>
                      prev ? { ...prev, date: e.target.value } : null
                    )
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ghi chú / Thông tin chuyển khoản
                </label>
                <input
                  type="text"
                  value={editingStudent.note}
                  onChange={(e) =>
                    setEditingStudent((prev) =>
                      prev ? { ...prev, note: e.target.value } : null
                    )
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="VD: CK ngày 14/09/2026, Đã nộp tiền mặt..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition shadow-sm disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Đang lưu...' : 'Lưu cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

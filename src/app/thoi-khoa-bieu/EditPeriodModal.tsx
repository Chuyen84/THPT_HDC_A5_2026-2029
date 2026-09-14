'use client'

import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import { saveWeeklyOverride } from './actions'

interface Props {
  isOpen: boolean
  onClose: () => void
  weekStartDate: string
  day: number
  period: number
  initialData: any
  onSuccess: () => void
}

export default function EditPeriodModal({ isOpen, onClose, weekStartDate, day, period, initialData, onSuccess }: Props) {
  const [subject, setSubject] = useState('')
  const [teacher, setTeacher] = useState('')
  const [room, setRoom] = useState('')
  const [subjectGroup, setSubjectGroup] = useState('khac')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setSubject(initialData?.subject || '')
      setTeacher(initialData?.teacher || '')
      setRoom(initialData?.room || '')
      setSubjectGroup(initialData?.subject_group || 'khac')
      setError('')
    }
  }, [isOpen, initialData])

  if (!isOpen) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim()) {
      setError('Môn học không được để trống')
      return
    }

    setLoading(true)
    try {
      await saveWeeklyOverride(
        weekStartDate,
        day,
        period,
        subject.trim(),
        teacher.trim(),
        room.trim(),
        subjectGroup,
        initialData
      )
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Auto-fill map
  const autoFillMap: Record<string, { teacher: string, group: string }> = {
    'Toán': { teacher: 'cô Mai', group: 'tu_nhien' },
    'Toán CĐ': { teacher: 'cô Mai', group: 'tu_nhien' },
    'Văn': { teacher: 'cô Hoa', group: 'xa_hoi' },
    'Văn CĐ': { teacher: 'cô Hoa', group: 'xa_hoi' },
    'Anh': { teacher: 'Cô Hường', group: 'ngoai_ngu' },
    'Lý': { teacher: 'cô Huệ', group: 'tu_nhien' },
    'Lý CĐ': { teacher: 'cô Huệ', group: 'tu_nhien' },
    'Sử': { teacher: 'cô An', group: 'xa_hoi' },
    'Địa': { teacher: 'thầy Chiến', group: 'xa_hoi' },
    'GDKTPL': { teacher: 'cô Chung', group: 'xa_hoi' },
    'GDĐP': { teacher: 'cô Nhung', group: 'khac' },
    'GDTC': { teacher: 'thầy Đức', group: 'khac' },
    'GDQP': { teacher: 'cô Vân', group: 'khac' },
    'CNNN': { teacher: 'cô Nguyệt', group: 'ngoai_ngu' },
    'SHL': { teacher: 'HĐTN2', group: 'khac' },
    'Chào cờ': { teacher: 'HĐTN1', group: 'khac' },
  }

  const handleSubjectChange = (val: string) => {
    setSubject(val)
    const match = autoFillMap[val]
    if (match) {
      setTeacher(match.teacher)
      setSubjectGroup(match.group)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800">Sửa Thứ {day} - {period <= 5 ? 'Sáng' : 'Chiều'} Tiết {period <= 5 ? period : period - 5}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg transition text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</div>}
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Môn học *</label>
            <div className="relative">
              <input 
                type="text" 
                value={subject} 
                onChange={e => handleSubjectChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="Chọn hoặc nhập tên môn..."
                list="subject-list"
              />
              <datalist id="subject-list">
                {Object.keys(autoFillMap).map(sub => (
                  <option key={sub} value={sub}>{sub} - {autoFillMap[sub].teacher}</option>
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Nhóm môn</label>
            <select 
              value={subjectGroup} 
              onChange={e => setSubjectGroup(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="tu_nhien">Tự nhiên (Toán, Lý, Hóa...)</option>
              <option value="xa_hoi">Xã hội (Văn, Sử, Địa...)</option>
              <option value="ngoai_ngu">Ngoại ngữ</option>
              <option value="khac">Khác (Thể dục, GDCD...)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Giáo viên</label>
              <input 
                type="text" 
                value={teacher} 
                onChange={e => setTeacher(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="Tên GV..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Phòng học</label>
              <input 
                type="text" 
                value={room} 
                onChange={e => setRoom(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="VD: P.102..."
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition font-medium">Hủy</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium flex items-center gap-2">
              <Save className="w-4 h-4" /> {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

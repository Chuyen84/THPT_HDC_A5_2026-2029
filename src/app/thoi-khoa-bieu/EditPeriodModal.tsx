'use client'

import { useState, useEffect } from 'react'
import { X, Save, Trash2 } from 'lucide-react'
import { saveWeeklyOverride } from './actions'

interface Props {
  isOpen: boolean
  onClose: () => void
  weekStartDate: string
  day: number
  period: number
  initialData: any
  onSuccess: () => void
  subjects?: any[]
}

export default function EditPeriodModal({ isOpen, onClose, weekStartDate, day, period, initialData, onSuccess, subjects = [] }: Props) {
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

  const handleSave = async (e?: React.FormEvent, isClear = false) => {
    if (e) e.preventDefault()
    
    const finalSubject = isClear ? '' : subject.trim()
    const finalTeacher = isClear ? '' : teacher.trim()
    const finalRoom = isClear ? '' : room.trim()
    const finalGroup = isClear ? 'khac' : subjectGroup

    if (!isClear && !finalSubject) {
      setError('Môn học không được để trống')
      return
    }

    setLoading(true)
    try {
      await saveWeeklyOverride(
        weekStartDate,
        day,
        period,
        finalSubject,
        finalTeacher,
        finalRoom,
        finalGroup,
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

  const handleSubjectChange = (val: string) => {
    setSubject(val)
    const match = subjects.find(s => s.abbreviation === val || s.name === val)
    if (match) {
      setTeacher(match.teacher_name)
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

        <form onSubmit={e => handleSave(e, false)} className="p-4 space-y-4">
          {error && <div className="text-red-600 text-sm p-2 bg-red-50 rounded-lg">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Môn học</label>
            <input 
              list="subject-list"
              value={subject} 
              onChange={e => handleSubjectChange(e.target.value)} 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Nhập hoặc chọn môn học..."
            />
            <datalist id="subject-list">
              {subjects.map(s => (
                <option key={s.id} value={s.abbreviation}>{s.name}</option>
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Giáo viên</label>
            <input 
              value={teacher} 
              onChange={e => setTeacher(e.target.value)} 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="VD: Cô Mai"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phòng học</label>
              <input 
                value={room} 
                onChange={e => setRoom(e.target.value)} 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Trống"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nhóm môn</label>
              <select 
                value={subjectGroup}
                onChange={e => setSubjectGroup(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="tu_nhien">Tự nhiên</option>
                <option value="xa_hoi">Xã hội</option>
                <option value="ngoai_ngu">Ngoại ngữ</option>
                <option value="khac">Khác</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-between items-center gap-3">
            <button 
              type="button"
              onClick={() => handleSave(undefined, true)}
              disabled={loading}
              className="flex items-center gap-2 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition font-medium"
            >
              <Trash2 className="w-4 h-4" /> Xóa trắng
            </button>
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition"
              >
                Hủy
              </button>
              <button 
                type="submit" 
                disabled={loading} 
                className="flex items-center gap-2 bg-blue-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Đang lưu...' : <><Save className="w-4 h-4" /> Lưu lại</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

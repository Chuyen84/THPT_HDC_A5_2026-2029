'use client'

import { useState } from 'react'
import { Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { saveTimetable } from './actions'

interface TimetableCell {
  day: number
  period: number
  subject: string
  teacher: string
}

export default function TimetableEditor({ initialData }: { initialData: any[] }) {
  const days = [2, 3, 4, 5, 6, 7]
  const periods = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  
  // Transform initial data to state
  const [schedule, setSchedule] = useState<Record<string, TimetableCell>>(() => {
    const s: Record<string, TimetableCell> = {}
    initialData.forEach(item => {
      s[`${item.day_of_week}-${item.period}`] = {
        day: item.day_of_week,
        period: item.period,
        subject: item.subject,
        teacher: item.teacher_name || ''
      }
    })
    return s
  })

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleCellChange = (day: number, period: number, field: 'subject' | 'teacher', value: string) => {
    const key = `${day}-${period}`
    setSchedule(prev => {
      const cell = prev[key] || { day, period, subject: '', teacher: '' }
      return {
        ...prev,
        [key]: { ...cell, [field]: value }
      }
    })
  }

  const handleSave = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const dataToSave = Object.values(schedule).filter(s => s.subject.trim() !== '')
      await saveTimetable(dataToSave)
      alert('Đã lưu thời khóa biểu thành công!')
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi lưu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div className="flex items-center gap-3">
          <Link href="/thoi-khoa-bieu" className="text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">Chỉnh sửa Thời khóa biểu</h1>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-semibold shadow-sm flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg">{errorMsg}</div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
        <table className="w-full text-sm text-center min-w-[900px]">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-3 border-r border-slate-200 w-20">Tiết</th>
              {days.map(d => (
                <th key={d} className="p-3 border-r border-slate-200 last:border-0">Thứ {d}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {periods.map(p => (
              <tr key={p}>
                <td className="p-3 border-r border-slate-100 font-medium text-slate-500 bg-slate-50">
                  {p > 5 ? `Chiều T${p - 5}` : `Sáng T${p}`}
                </td>
                {days.map(d => {
                  const cell = schedule[`${d}-${p}`] || { subject: '', teacher: '' }
                  return (
                    <td key={`${d}-${p}`} className="p-2 border-r border-slate-100 last:border-0">
                      <div className="flex flex-col gap-1">
                        <input 
                          type="text" 
                          placeholder="Môn học..."
                          value={cell.subject}
                          onChange={(e) => handleCellChange(d, p, 'subject', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none font-medium"
                        />
                        <input 
                          type="text" 
                          placeholder="Giáo viên..."
                          value={cell.teacher}
                          onChange={(e) => handleCellChange(d, p, 'teacher', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none text-slate-600"
                        />
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

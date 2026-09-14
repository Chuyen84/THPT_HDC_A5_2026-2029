'use client'

import { useState } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { CalendarDays, ChevronLeft, ChevronRight, RotateCcw, Edit2 } from 'lucide-react'
import EditPeriodModal from './EditPeriodModal'
import ImportExcelModal from './ImportExcelModal'
import { resetWeeklySchedule } from './actions'
import { ScheduleItem } from './actions'

dayjs.locale('vi')

interface Props {
  initialSchedule: ScheduleItem[]
  canManage: boolean
  initialWeekStart: string
}

export default function TimetableGrid({ initialSchedule, canManage, initialWeekStart }: Props) {
  const [currentDate, setCurrentDate] = useState(dayjs(initialWeekStart))
  const [schedule, setSchedule] = useState<ScheduleItem[]>(initialSchedule)
  const [loading, setLoading] = useState(false)

  // Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editCell, setEditCell] = useState<{ day: number, period: number, data: any } | null>(null)

  const weekStartDateStr = currentDate.startOf('week').add(1, 'day').format('YYYY-MM-DD') // Monday

  const navigateWeek = async (direction: 'prev' | 'next') => {
    const newDate = currentDate.add(direction === 'next' ? 1 : -1, 'week')
    setCurrentDate(newDate)
    
    // Fetch new week schedule
    setLoading(true)
    try {
      const { getWeeklySchedule } = await import('./actions')
      const newSchedule = await getWeeklySchedule(newDate.startOf('week').add(1, 'day').format('YYYY-MM-DD'))
      setSchedule(newSchedule)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('Bạn có chắc muốn xóa tất cả tùy chỉnh của tuần này và quay về lịch chuẩn?')) return
    setLoading(true)
    try {
      await resetWeeklySchedule(weekStartDateStr)
      // Refresh
      const { getWeeklySchedule } = await import('./actions')
      const newSchedule = await getWeeklySchedule(weekStartDateStr)
      setSchedule(newSchedule)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (day: number, period: number) => {
    const data = schedule.find(s => s.day_of_week === day && s.period === period)
    setEditCell({ day, period, data })
    setIsModalOpen(true)
  }

  const handleEditSuccess = async () => {
    setLoading(true)
    try {
      const { getWeeklySchedule } = await import('./actions')
      const newSchedule = await getWeeklySchedule(weekStartDateStr)
      setSchedule(newSchedule)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const days = [2, 3, 4, 5, 6, 7]
  const periods = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  const getCellColor = (group?: string | null) => {
    switch (group) {
      case 'tu_nhien': return 'bg-blue-50 border-blue-200 text-blue-900'
      case 'xa_hoi': return 'bg-teal-50 border-teal-200 text-teal-900'
      case 'ngoai_ngu': return 'bg-orange-50 border-orange-200 text-orange-900'
      default: return 'bg-purple-50 border-purple-200 text-purple-900'
    }
  }

  const renderTable = (title: string, tablePeriods: number[]) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto relative flex-1">
      {loading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-center uppercase tracking-wider">
        {title}
      </div>
      <table className="w-full text-sm min-w-[700px] border-collapse table-fixed">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="p-2 w-16 text-slate-500 font-semibold border-r border-slate-200">Tiết</th>
            {days.map(d => (
              <th key={d} className="p-2 font-bold text-slate-700 border-r border-slate-200 last:border-r-0">
                Thứ {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tablePeriods.map(p => (
            <tr key={p} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors">
              <td className="p-2 text-center font-medium border-r border-slate-100 bg-slate-50 w-16">
                <span className="text-base text-slate-700">{p <= 5 ? p : p - 5}</span>
              </td>
              {days.map(d => {
                const item = schedule.find(s => s.day_of_week === d && s.period === p)
                return (
                  <td key={`${d}-${p}`} className="p-1.5 border-r border-slate-100 last:border-r-0 h-20 align-top relative group">
                    {item ? (
                      <div className={`h-full rounded-lg p-2 border flex flex-col justify-between ${getCellColor(item.subject_group)} ${item.isOverride ? 'ring-1 ring-amber-400 ring-offset-1' : ''}`}>
                        <div>
                          <div className="font-bold text-[13px] leading-tight">{item.subject}</div>
                        </div>
                        <div className="flex justify-between items-end mt-1">
                          {item.teacher && <div className="text-[11px] font-medium truncate pr-1">{item.teacher}</div>}
                          {item.room && <div className="text-[10px] opacity-80 whitespace-nowrap">{item.room}</div>}
                        </div>
                        
                        {item.isOverride && (
                          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-amber-400 rounded-full" title="Đã thay đổi"></span>
                        )}
                      </div>
                    ) : (
                      <div className="h-full rounded-lg border border-dashed border-slate-200 flex items-center justify-center text-slate-300 text-xs transition-colors group-hover:bg-slate-50">
                        -
                      </div>
                    )}
                    
                    {canManage && (
                      <button 
                        onClick={() => handleEditClick(d, p)}
                        className="absolute top-2 right-2 p-1 bg-white text-blue-600 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-50"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <button onClick={() => navigateWeek('prev')} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="text-center">
            <h2 className="font-bold text-slate-800 text-lg">Tuần {currentDate.format('DD/MM/YYYY')}</h2>
            <p className="text-xs text-slate-500">
              {currentDate.startOf('week').add(1, 'day').format('DD/MM')} - {currentDate.endOf('week').add(1, 'day').format('DD/MM')}
            </p>
          </div>
          <button onClick={() => navigateWeek('next')} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <ImportExcelModal weekStartDate={weekStartDateStr} onSuccess={handleEditSuccess} />
            <button 
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition"
            >
              <RotateCcw className="w-4 h-4" /> Áp dụng lịch chuẩn
            </button>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {renderTable('Ca Sáng', [1, 2, 3, 4, 5])}
        {renderTable('Ca Chiều', [6, 7, 8, 9, 10])}
      </div>

      {editCell && (
        <EditPeriodModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          weekStartDate={weekStartDateStr}
          day={editCell.day}
          period={editCell.period}
          initialData={editCell.data}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  )
}

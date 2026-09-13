'use client'

import { useState } from 'react'
import { Calendar as CalendarIcon, Trash2, Clock, MapPin } from 'lucide-react'
import { deleteEvent } from './actions'

interface EventItem {
  id: string
  title: string
  description: string | null
  event_date: string
  profiles?: {
    full_name: string | null
  } | null
}

export default function EventList({
  events,
  canManage,
}: {
  events: EventItem[]
  canManage: boolean
}) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc muốn xóa sự kiện: "${title}"?`)) return
    try {
      setIsDeleting(id)
      await deleteEvent(id)
    } catch (err: any) {
      alert('Không thể xóa: ' + (err.message || 'Lỗi không xác định'))
    } finally {
      setIsDeleting(null)
    }
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <CalendarIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <p>Chưa có sự kiện hoặc lịch kiểm tra nào sắp tới.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {events.map((event) => {
        const d = new Date(event.event_date)
        const dateNum = d.getDate()
        const monthNum = d.getMonth() + 1
        const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

        return (
          <div
            key={event.id}
            className="flex gap-4 p-4 border border-slate-100 rounded-xl bg-white shadow-sm hover:shadow-md transition relative group"
          >
            {/* Date badge */}
            <div className="flex flex-col items-center justify-center bg-blue-50 text-blue-700 w-16 h-16 rounded-xl shrink-0 border border-blue-100">
              <span className="text-[11px] font-semibold uppercase text-blue-500">Tháng {monthNum}</span>
              <span className="text-2xl font-black leading-none">{dateNum}</span>
            </div>

            <div className="flex-1 min-w-0 pr-8">
              <h3 className="font-bold text-slate-800 text-base leading-snug">{event.title}</h3>
              {event.description && (
                <p className="text-slate-600 text-sm mt-1 leading-relaxed line-clamp-2">
                  {event.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {timeStr}
                </span>
                {event.profiles?.full_name && (
                  <span>Đăng bởi: {event.profiles.full_name}</span>
                )}
              </div>
            </div>

            {canManage && (
              <button
                onClick={() => handleDelete(event.id, event.title)}
                disabled={isDeleting === event.id}
                className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Xóa sự kiện"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

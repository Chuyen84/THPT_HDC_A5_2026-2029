'use client'

import { useState } from 'react'
import { Bell, Trash2, Pin, Search } from 'lucide-react'
import { deleteAnnouncement } from './actions'

interface Announcement {
  id: string
  title: string
  content: string
  is_important: boolean | null
  created_at: string
  profiles?: {
    full_name: string | null
    role: string | null
  } | null
}

export default function AnnouncementList({
  announcements,
  canManage,
}: {
  announcements: Announcement[]
  canManage: boolean
}) {
  const [search, setSearch] = useState('')
  const [filterImportant, setFilterImportant] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const filtered = announcements.filter((item) => {
    const matchSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.content.toLowerCase().includes(search.toLowerCase()) ||
      (item.profiles?.full_name || '').toLowerCase().includes(search.toLowerCase())
    const matchImportant = !filterImportant || item.is_important
    return matchSearch && matchImportant
  })

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc muốn xóa thông báo: "${title}"?`)) return
    try {
      setIsDeleting(id)
      await deleteAnnouncement(id)
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
            placeholder="Tìm kiếm thông báo..."
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={() => setFilterImportant(!filterImportant)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
            filterImportant
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <Pin className="w-3.5 h-3.5" />
          <span>Chỉ xem quan trọng</span>
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Bell className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p>Không có thông báo nào phù hợp.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-xl bg-white border transition shadow-sm hover:shadow-md ${
                item.is_important ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-100'
              }`}
            >
              <div className="flex justify-between items-start gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                    {item.profiles?.full_name ? item.profiles.full_name.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">
                      {item.profiles?.full_name || 'Người dùng ẩn danh'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(item.created_at).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.is_important && (
                    <span className="bg-red-50 text-red-600 border border-red-200 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <Pin className="w-3 h-3" /> Quan trọng
                    </span>
                  )}
                  {canManage && (
                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      disabled={isDeleting === item.id}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Xóa thông báo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">
                {item.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

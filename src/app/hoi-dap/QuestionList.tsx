'use client'

import { useState } from 'react'
import { MessageSquare, Trash2, Plus, X, Search, HelpCircle } from 'lucide-react'
import { addQuestion, deleteQuestion } from './actions'

interface QuestionItem {
  id: string
  title: string
  content: string
  created_at: string
  author_id: string | null
  profiles?: {
    full_name: string | null
    role: string | null
  } | null
}

export default function QuestionList({
  questions,
  currentUserId,
  canManageAll,
}: {
  questions: QuestionItem[]
  currentUserId?: string
  canManageAll: boolean
}) {
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const roleDisplay: Record<string, string> = {
    admin: 'Ban quản trị',
    gvcn: 'GVCN',
    phu_huynh: 'Phụ huynh',
    hoc_sinh: 'Học sinh',
  }

  const filtered = questions.filter(
    (q) =>
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.content.toLowerCase().includes(search.toLowerCase()) ||
      (q.profiles?.full_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      await addQuestion(formData)
      setShowModal(false)
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Không thể đăng câu hỏi'))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc muốn xóa câu hỏi: "${title}"?`)) return
    try {
      setIsDeleting(id)
      await deleteQuestion(id)
    } catch (err: any) {
      alert('Không thể xóa: ' + (err.message || 'Lỗi không xác định'))
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search & Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm câu hỏi, người hỏi..."
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {currentUserId && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition shadow-sm whitespace-nowrap self-end sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Đặt câu hỏi mới</span>
          </button>
        )}
      </div>

      {/* Questions list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <HelpCircle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p>Chưa có câu hỏi nào. Hãy là người đầu tiên đặt câu hỏi trao đổi!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => {
            const canDelete = canManageAll || item.author_id === currentUserId
            return (
              <div
                key={item.id}
                className="p-5 border border-slate-100 rounded-xl bg-white shadow-sm hover:shadow-md transition relative group"
              >
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">
                      {item.profiles?.full_name ? item.profiles.full_name.charAt(0).toUpperCase() : 'H'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 text-sm">
                          {item.profiles?.full_name || 'Người dùng ẩn danh'}
                        </span>
                        {item.profiles?.role && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                            {roleDisplay[item.profiles.role] || item.profiles.role}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
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

                  {canDelete && (
                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      disabled={isDeleting === item.id}
                      className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Xóa câu hỏi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">
                  {item.content}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Add Question */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Đặt câu hỏi / Ý kiến thảo luận</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tiêu đề câu hỏi
                </label>
                <input
                  name="title"
                  required
                  placeholder="VD: Hỏi về lịch ôn thi giữa kỳ môn Hóa..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nội dung chi tiết
                </label>
                <textarea
                  name="content"
                  required
                  rows={4}
                  placeholder="Mô tả cụ thể thắc mắc của bạn để thầy cô hoặc các bạn giải đáp..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition shadow-sm"
                >
                  {loading ? 'Đang gửi...' : 'Gửi câu hỏi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

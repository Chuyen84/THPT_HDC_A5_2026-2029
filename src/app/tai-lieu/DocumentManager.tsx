'use client'

import { useState } from 'react'
import { FileText, ExternalLink, Trash2, Plus, X, Search, Link as LinkIcon } from 'lucide-react'
import { addDocument, deleteDocument } from './actions'

interface DocumentItem {
  id: string
  title: string
  file_url: string
  file_type: string | null
  created_at: string
  uploaded_by: string | null
  profiles?: {
    full_name: string | null
  } | null
}

export default function DocumentManager({
  documents,
  currentUserId,
  canManageAll,
}: {
  documents: DocumentItem[]
  currentUserId?: string
  canManageAll: boolean
}) {
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const types = ['Đề thi & Kiểm tra', 'Bài giảng', 'Sách giáo khoa / SBT', 'Tài liệu tham khảo', 'Khác']

  const filtered = documents.filter((doc) => {
    const matchSearch =
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      (doc.profiles?.full_name || '').toLowerCase().includes(search.toLowerCase())
    const matchType = selectedType === 'all' || doc.file_type === selectedType
    return matchSearch && matchType
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      await addDocument(formData)
      setShowModal(false)
    } catch (err: any) {
      alert('Không thể tải lên: ' + (err.message || 'Đã có lỗi xảy ra'))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc muốn xóa tài liệu: "${title}"?`)) return
    try {
      setIsDeleting(id)
      await deleteDocument(id)
    } catch (err: any) {
      alert('Không thể xóa: ' + (err.message || 'Đã có lỗi xảy ra'))
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tài liệu theo tên, môn học..."
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả thể loại</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {currentUserId && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Chia sẻ tài liệu</span>
            </button>
          )}
        </div>
      </div>

      {/* Document List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p>Chưa có tài liệu nào phù hợp.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((doc) => {
            const canDelete = canManageAll || doc.uploaded_by === currentUserId
            return (
              <div
                key={doc.id}
                className="flex items-start gap-4 p-4 border border-slate-100 rounded-xl bg-white shadow-sm hover:shadow-md transition relative group"
              >
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0 border border-purple-100">
                  <FileText className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0 pr-6">
                  <h3 className="font-bold text-slate-800 text-base leading-snug line-clamp-1">
                    {doc.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium">
                      {doc.file_type || 'Tài liệu'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(doc.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Người chia sẻ: {doc.profiles?.full_name || 'Thành viên'}
                  </div>

                  <div className="mt-3">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      <span>Mở / Tải xuống</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {canDelete && (
                  <button
                    onClick={() => handleDelete(doc.id, doc.title)}
                    disabled={isDeleting === doc.id}
                    className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Xóa tài liệu"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Upload Document */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Chia sẻ tài liệu học tập</h2>
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
                  Tiêu đề tài liệu
                </label>
                <input
                  name="title"
                  required
                  placeholder="VD: Đề cương ôn tập Toán Giữa Kỳ 1..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Thể loại
                </label>
                <select
                  name="file_type"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {types.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Đường dẫn tài liệu (Link Google Drive, OneDrive, DropBox...)
                </label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    name="file_url"
                    type="url"
                    required
                    placeholder="https://drive.google.com/..."
                    className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Mẹo: Đặt quyền chia sẻ trên Google Drive ở chế độ &quot;Bất kỳ ai có liên kết đều có thể xem&quot;.
                </p>
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
                  {loading ? 'Đang lưu...' : 'Lưu & Chia sẻ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

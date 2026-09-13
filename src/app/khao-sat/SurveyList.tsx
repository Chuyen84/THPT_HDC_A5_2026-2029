'use client'

import { useState } from 'react'
import { CheckSquare, Trash2, Plus, X, BarChart3, CheckCircle2 } from 'lucide-react'
import { createSurvey, voteOption, deleteSurvey } from './actions'

interface SurveyOption {
  id: string
  option_text: string
  votes: number
}

interface SurveyItem {
  id: string
  title: string
  description: string | null
  created_at: string
  profiles?: {
    full_name: string | null
  } | null
  survey_options: SurveyOption[]
}

export default function SurveyList({
  surveys,
  canManage,
  isLoggedIn,
}: {
  surveys: SurveyItem[]
  canManage: boolean
  isLoggedIn: boolean
}) {
  const [showModal, setShowModal] = useState(false)
  const [options, setOptions] = useState(['', ''])
  const [votingId, setVotingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleAddOptionField = () => {
    if (options.length < 6) {
      setOptions([...options, ''])
    }
  }

  const handleRemoveOptionField = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options]
    updated[index] = val
    setOptions(updated)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      await createSurvey(formData)
      setShowModal(false)
      setOptions(['', ''])
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Không thể tạo khảo sát'))
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (optionId: string) => {
    if (!isLoggedIn) {
      alert('Vui lòng đăng nhập để bình chọn')
      return
    }
    try {
      setVotingId(optionId)
      await voteOption(optionId)
    } catch (err: any) {
      alert('Lỗi bình chọn: ' + (err.message || 'Đã có lỗi xảy ra'))
    } finally {
      setVotingId(null)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc muốn xóa cuộc khảo sát: "${title}"?`)) return
    try {
      setIsDeleting(id)
      await deleteSurvey(id)
    } catch (err: any) {
      alert('Không thể xóa: ' + (err.message || 'Lỗi không xác định'))
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header action */}
      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
        <span className="text-sm font-medium text-slate-700">
          Hiện có {surveys.length} cuộc bình chọn
        </span>
        {canManage && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo cuộc bình chọn mới</span>
          </button>
        )}
      </div>

      {surveys.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <CheckSquare className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p>Không có cuộc khảo sát nào đang diễn ra.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {surveys.map((survey) => {
            const totalVotes = survey.survey_options.reduce((sum, opt) => sum + (opt.votes || 0), 0)

            return (
              <div
                key={survey.id}
                className="p-6 border border-slate-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition relative"
              >
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{survey.title}</h3>
                    {survey.description && (
                      <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                        {survey.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                      <span>Người tạo: {survey.profiles?.full_name || 'GVCN / Ban quản trị'}</span>
                      <span>•</span>
                      <span>{new Date(survey.created_at).toLocaleDateString('vi-VN')}</span>
                      <span>•</span>
                      <span className="font-semibold text-blue-600">Tổng: {totalVotes} lượt bình chọn</span>
                    </div>
                  </div>

                  {canManage && (
                    <button
                      onClick={() => handleDelete(survey.id, survey.title)}
                      disabled={isDeleting === survey.id}
                      className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Xóa cuộc khảo sát"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Options and Votes */}
                <div className="space-y-3 mt-4">
                  {survey.survey_options.map((opt) => {
                    const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0

                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleVote(opt.id)}
                        className={`group relative p-3.5 border rounded-xl cursor-pointer transition overflow-hidden ${
                          votingId === opt.id
                            ? 'opacity-60 bg-blue-50/50'
                            : 'hover:border-blue-300 hover:bg-slate-50/50 border-slate-200'
                        }`}
                      >
                        {/* Progress fill bar */}
                        <div
                          className="absolute inset-y-0 left-0 bg-blue-50 transition-all duration-500 -z-0"
                          style={{ width: `${percentage}%` }}
                        />

                        <div className="relative z-10 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full border border-slate-300 group-hover:border-blue-600 flex items-center justify-center transition">
                              <div className="w-2.5 h-2.5 rounded-full bg-blue-600 opacity-0 group-hover:opacity-100 transition" />
                            </div>
                            <span className="text-sm font-medium text-slate-800">
                              {opt.option_text}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                            <span>{percentage}%</span>
                            <span className="text-slate-400 font-normal">({opt.votes} phiếu)</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal create survey */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Tạo cuộc khảo sát / bình chọn</h2>
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
                  Chủ đề khảo sát / Câu hỏi
                </label>
                <input
                  name="title"
                  required
                  placeholder="VD: Bình chọn địa điểm dã ngoại cuối kỳ..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mô tả / Hướng dẫn thêm (nếu có)
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Thời hạn bình chọn đến hết thứ 6 tuần này..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Các phương án bình chọn
                </label>
                <div className="space-y-2">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        name="options"
                        value={opt}
                        required
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Phương án ${idx + 1}`}
                        className="flex-1 px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionField(idx)}
                          className="p-2 text-slate-400 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {options.length < 6 && (
                  <button
                    type="button"
                    onClick={handleAddOptionField}
                    className="mt-2 text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm phương án
                  </button>
                )}
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
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
                  {loading ? 'Đang tạo...' : 'Phát hành khảo sát'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

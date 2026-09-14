'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, X, Phone, User, BookOpen } from 'lucide-react'

interface Subject {
  id: string
  name: string
  abbreviation: string
  teacher_name: string
  teacher_phone: string
}

interface Props {
  subjects: Subject[]
  canManage: boolean
}

export default function SubjectManager({ subjects, canManage }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [name, setName] = useState('')
  const [abbrev, setAbbrev] = useState('')
  const [teacher, setTeacher] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  const openForm = (subject?: Subject) => {
    if (subject) {
      setEditingId(subject.id)
      setName(subject.name)
      setAbbrev(subject.abbreviation)
      setTeacher(subject.teacher_name)
      setPhone(subject.teacher_phone || '')
    } else {
      setEditingId(null)
      setName('')
      setAbbrev('')
      setTeacher('')
      setPhone('')
    }
    setIsOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { saveSubject } = await import('./actions')
      await saveSubject(editingId, {
        name,
        abbreviation: abbrev,
        teacher_name: teacher,
        teacher_phone: phone
      })
      setIsOpen(false)
      window.location.reload()
    } catch (err) {
      console.error(err)
      alert('Lỗi lưu môn học')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa môn học này?')) return
    try {
      const { deleteSubject } = await import('./actions')
      await deleteSubject(id)
      window.location.reload()
    } catch (err) {
      console.error(err)
      alert('Lỗi xóa môn học')
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Danh Sách Môn Học & Giáo Viên</h2>
        {canManage && (
          <button onClick={() => openForm()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold text-sm">
            <Plus className="w-4 h-4" /> Thêm môn
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {subjects.map(sub => (
          <div key={sub.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md transition-all group relative">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  {sub.name}
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 bg-slate-200 text-slate-600 rounded mt-1 inline-block">Viết tắt: {sub.abbreviation}</span>
              </div>
              {canManage && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openForm(sub)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(sub.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              )}
            </div>
            <div className="space-y-1.5 text-sm text-slate-600">
              <div className="flex items-center gap-2"><User className="w-4 h-4 text-slate-400" /> <span className="font-medium text-slate-700">{sub.teacher_name}</span></div>
              {sub.teacher_phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> {sub.teacher_phone}</div>}
            </div>
          </div>
        ))}
        {subjects.length === 0 && (
          <div className="col-span-full py-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            Chưa có môn học nào. Hãy thêm môn học mới.
          </div>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">{editingId ? 'Sửa Môn Học' : 'Thêm Môn Học'}</h2>
              <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên môn học *</label>
                <input required value={name} onChange={e => setName(e.target.value)} placeholder="VD: Toán học" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên viết tắt *</label>
                <input required value={abbrev} onChange={e => setAbbrev(e.target.value)} placeholder="VD: Toán" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Giáo viên phụ trách *</label>
                <input required value={teacher} onChange={e => setTeacher(e.target.value)} placeholder="VD: Cô Nga" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại liên hệ</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="VD: 0912345678" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Hủy</button>
                <button type="submit" disabled={loading} className="px-4 py-2 font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {loading ? 'Đang lưu...' : 'Lưu môn học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

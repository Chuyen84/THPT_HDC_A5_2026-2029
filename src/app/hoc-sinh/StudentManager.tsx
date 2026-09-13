'use client'

import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import {
  Plus,
  Upload,
  Download,
  Search,
  Edit2,
  Trash2,
  X,
  GraduationCap,
  Users,
  Phone,
  Calendar,
  MapPin,
  FileSpreadsheet,
} from 'lucide-react'
import { addStudent, updateStudent, deleteStudent, importStudentsBatch } from './actions'

export interface Student {
  id: string
  full_name: string
  gender: string | null
  dob: string | null
  address: string | null
  father_name: string | null
  father_phone: string | null
  mother_name: string | null
  mother_phone: string | null
  notes: string | null
}

export default function StudentManager({
  students,
  canManage,
}: {
  students: Student[]
  canManage: boolean
}) {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const filtered = students.filter((s) => {
    const term = search.toLowerCase()
    return (
      (s.full_name || '').toLowerCase().includes(term) ||
      (s.address || '').toLowerCase().includes(term) ||
      (s.father_phone || '').includes(term) ||
      (s.mother_phone || '').includes(term) ||
      (s.father_name || '').toLowerCase().includes(term) ||
      (s.mother_name || '').toLowerCase().includes(term)
    )
  })

  // Export to Excel
  const handleExportExcel = () => {
    if (students.length === 0) {
      alert('Chưa có dữ liệu học sinh để xuất file!')
      return
    }

    const exportRows = students.map((s, index) => ({
      'STT': index + 1,
      'Họ tên': s.full_name,
      'Giới tính': s.gender || 'Nam',
      'Ngày sinh': s.dob ? new Date(s.dob).toLocaleDateString('vi-VN') : '',
      'Địa chỉ': s.address || '',
      'Bố': s.father_name || '',
      'Điện thoại (Bố)': s.father_phone || '',
      'Mẹ': s.mother_name || '',
      'Điện thoại (Mẹ)': s.mother_phone || '',
      'Ghi chú': s.notes || '',
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách học sinh')

    // Tự động căn chỉnh độ rộng cột
    const colWidths = [
      { wch: 6 },  // STT
      { wch: 24 }, // Họ tên
      { wch: 10 }, // Giới tính
      { wch: 14 }, // Ngày sinh
      { wch: 30 }, // Địa chỉ
      { wch: 20 }, // Bố
      { wch: 15 }, // ĐT Bố
      { wch: 20 }, // Mẹ
      { wch: 15 }, // ĐT Mẹ
      { wch: 20 }, // Ghi chú
    ]
    worksheet['!cols'] = colWidths

    XLSX.writeFile(workbook, `Danh_Sach_Hoc_Sinh_Lop_10A5_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // Handle Excel File Upload & Parse
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const bstr = event.target?.result
        const workbook = XLSX.read(bstr, { type: 'binary' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

        // Map column names flexibly
        const mapped = rawJson.map((row) => {
          // Find fields by keys containing common headers
          const findVal = (keys: string[]) => {
            const foundKey = Object.keys(row).find((k) =>
              keys.some((cand) => k.toLowerCase().replace(/\s+/g, '').includes(cand.toLowerCase()))
            )
            return foundKey ? String(row[foundKey]).trim() : ''
          }

          const fullName = findVal(['họ tên', 'hoten', 'tên', 'name', 'họvàtên']) || 'Chưa đặt tên'
          const gender = findVal(['giới tính', 'gioitinh', 'phái', 'gender']) || 'Nam'
          const dob = findVal(['ngày sinh', 'ngaysinh', 'dob', 'năm sinh'])
          const address = findVal(['địa chỉ', 'diachi', 'nơi ở', 'address'])
          const fatherName = findVal(['bố', 'tên bố', 'cha', 'father'])
          const fatherPhone = findVal(['điện thoại bố', 'đt bố', 'sđt bố', 'phone bố']) || findVal(['điện thoại', 'sđt', 'phone'])
          const motherName = findVal(['mẹ', 'tên mẹ', 'mother'])
          const motherPhone = findVal(['điện thoại mẹ', 'đt mẹ', 'sđt mẹ', 'phone mẹ'])
          const notes = findVal(['ghi chú', 'ghichu', 'note', 'chuyên đề'])

          return {
            full_name: fullName,
            gender: gender.toLowerCase().includes('nữ') || gender.toLowerCase().includes('nu') ? 'Nữ' : 'Nam',
            dob: dob ? parseDateString(dob) : null,
            address,
            father_name: fatherName,
            father_phone: fatherPhone,
            mother_name: motherName,
            mother_phone: motherPhone,
            notes,
          }
        })

        setPreviewData(mapped)
        setShowImportModal(true)
      } catch (err: any) {
        alert('Không thể đọc file Excel: ' + (err.message || 'Lỗi định dạng file'))
      }
    }
    reader.readAsBinaryString(file)
    e.target.value = ''
  }

  // Parse various date formats like DD/MM/YYYY
  const parseDateString = (dateStr: string) => {
    if (!dateStr) return null
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
    const parts = dateStr.split(/[\/\-\.]/)
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0')
      const m = parts[1].padStart(2, '0')
      let y = parts[2]
      if (y.length === 2) y = '20' + y
      return `${y}-${m}-${d}`
    }
    return null
  }

  // Execute Batch Import
  const handleConfirmImport = async () => {
    if (previewData.length === 0) return
    try {
      setLoading(true)
      await importStudentsBatch(previewData)
      alert(`Đã nhập thành công ${previewData.length} học sinh vào hệ thống!`)
      setShowImportModal(false)
      setPreviewData([])
    } catch (err: any) {
      alert('Lỗi import: ' + (err.message || 'Đã có lỗi xảy ra'))
    } finally {
      setLoading(false)
    }
  }

  // Handle Form Submit (Add or Edit)
  const handleSaveStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      full_name: formData.get('full_name') as string,
      gender: formData.get('gender') as string,
      dob: (formData.get('dob') as string) || null,
      address: formData.get('address') as string,
      father_name: formData.get('father_name') as string,
      father_phone: formData.get('father_phone') as string,
      mother_name: formData.get('mother_name') as string,
      mother_phone: formData.get('mother_phone') as string,
      notes: formData.get('notes') as string,
    }

    try {
      if (editingStudent) {
        await updateStudent(editingStudent.id, data)
      } else {
        await addStudent(data)
      }
      setShowModal(false)
      setEditingStudent(null)
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Không thể lưu học sinh'))
    } finally {
      setLoading(false)
    }
  }

  // Handle Delete Student
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa thông tin học sinh "${name}" không?`)) return
    try {
      setDeletingId(id)
      await deleteStudent(id)
    } catch (err: any) {
      alert('Lỗi khi xóa: ' + (err.message || 'Không xác định'))
    } finally {
      setDeletingId(null)
    }
  }

  const femaleCount = students.filter((s) => s.gender === 'Nữ').length
  const maleCount = students.length - femaleCount

  return (
    <div className="space-y-5">
      {/* Top statistics summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5">
          <div className="text-xs text-blue-600 font-medium">Sĩ số lớp</div>
          <div className="text-2xl font-bold text-blue-900 mt-0.5">{students.length} <span className="text-xs font-normal text-slate-500">học sinh</span></div>
        </div>
        <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5">
          <div className="text-xs text-emerald-600 font-medium">Học sinh Nam</div>
          <div className="text-2xl font-bold text-emerald-900 mt-0.5">{maleCount}</div>
        </div>
        <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-3.5">
          <div className="text-xs text-rose-600 font-medium">Học sinh Nữ</div>
          <div className="text-2xl font-bold text-rose-900 mt-0.5">{femaleCount}</div>
        </div>
        <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-3.5">
          <div className="text-xs text-purple-600 font-medium">Khối / Chuyên đề</div>
          <div className="text-sm font-bold text-purple-900 mt-1 truncate">Toán, Vật lý, Ngữ văn</div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên học sinh, địa chỉ, SĐT phụ huynh..."
            className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          {/* Export Button */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-2xs"
            title="Xuất file Excel"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>

          {/* Import Button */}
          {canManage && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-2xs"
                title="Nhập từ file Excel"
              >
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Nhập Excel</span>
              </button>
            </>
          )}

          {/* Add Student Button */}
          {canManage && (
            <button
              onClick={() => {
                setEditingStudent(null)
                setShowModal(true)
              }}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm học sinh</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead className="bg-[#bfe6f7]/60 text-slate-800 font-bold border-b border-blue-200">
              <tr>
                <th className="p-3 text-center w-12 border-r border-blue-200">STT</th>
                <th className="p-3 border-r border-blue-200 min-w-[160px]">Họ tên</th>
                <th className="p-3 text-center border-r border-blue-200 w-20">Giới tính</th>
                <th className="p-3 border-r border-blue-200 w-28">Ngày sinh</th>
                <th className="p-3 border-r border-blue-200 min-w-[180px]">Địa chỉ</th>
                <th className="p-3 border-r border-blue-200 min-w-[140px]">Bố</th>
                <th className="p-3 border-r border-blue-200 min-w-[120px]">Điện thoại</th>
                <th className="p-3 border-r border-blue-200 min-w-[140px]">Mẹ</th>
                <th className="p-3 border-r border-blue-200 min-w-[120px]">Điện thoại</th>
                <th className="p-3 border-r border-blue-200 min-w-[150px]">Ghi chú</th>
                {canManage && <th className="p-3 text-center w-20">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 11 : 10} className="p-12 text-center text-slate-400">
                    <GraduationCap className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                    Chưa có dữ liệu học sinh nào. Bấm &quot;Thêm học sinh&quot; hoặc &quot;Nhập Excel&quot; để thêm danh sách.
                  </td>
                </tr>
              ) : (
                filtered.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-blue-50/40 transition">
                    <td className="p-3 text-center font-medium text-slate-500 border-r border-slate-100">
                      {idx + 1}
                    </td>
                    <td className="p-3 font-semibold text-slate-900 border-r border-slate-100 whitespace-nowrap">
                      {student.full_name}
                    </td>
                    <td className="p-3 text-center border-r border-slate-100">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          student.gender === 'Nữ'
                            ? 'bg-rose-50 text-rose-600 border border-rose-200'
                            : 'bg-blue-50 text-blue-600 border border-blue-200'
                        }`}
                      >
                        {student.gender || 'Nam'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 border-r border-slate-100 whitespace-nowrap">
                      {student.dob ? new Date(student.dob).toLocaleDateString('vi-VN') : '-'}
                    </td>
                    <td className="p-3 text-slate-600 border-r border-slate-100">
                      {student.address || '-'}
                    </td>
                    <td className="p-3 text-slate-800 border-r border-slate-100 font-medium">
                      {student.father_name || '-'}
                    </td>
                    <td className="p-3 text-slate-600 border-r border-slate-100 whitespace-nowrap">
                      {student.father_phone ? (
                        <a href={`tel:${student.father_phone}`} className="text-blue-600 hover:underline flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {student.father_phone}
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-3 text-slate-800 border-r border-slate-100 font-medium">
                      {student.mother_name || '-'}
                    </td>
                    <td className="p-3 text-slate-600 border-r border-slate-100 whitespace-nowrap">
                      {student.mother_phone ? (
                        <a href={`tel:${student.mother_phone}`} className="text-blue-600 hover:underline flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {student.mother_phone}
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-3 text-slate-500 border-r border-slate-100 text-xs">
                      {student.notes || '-'}
                    </td>
                    {canManage && (
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingStudent(student)
                              setShowModal(true)
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Sửa học sinh"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(student.id, student.full_name)}
                            disabled={deletingId === student.id}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Xóa học sinh"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit Student */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                {editingStudent ? 'Cập nhật thông tin học sinh' : 'Thêm học sinh mới'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Họ và tên học sinh <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="full_name"
                    required
                    defaultValue={editingStudent?.full_name || ''}
                    placeholder="VD: Nguyễn Văn Nam"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Giới tính</label>
                  <select
                    name="gender"
                    defaultValue={editingStudent?.gender || 'Nam'}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày sinh</label>
                  <input
                    name="dob"
                    type="date"
                    defaultValue={editingStudent?.dob || ''}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Địa chỉ</label>
                  <input
                    name="address"
                    defaultValue={editingStudent?.address || ''}
                    placeholder="VD: Thôn 1, Hoài Đức, Hà Nội"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Thông tin bố mẹ */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Thông tin phụ huynh
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Họ tên Bố</label>
                    <input
                      name="father_name"
                      defaultValue={editingStudent?.father_name || ''}
                      placeholder="Họ tên bố..."
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Điện thoại Bố</label>
                    <input
                      name="father_phone"
                      defaultValue={editingStudent?.father_phone || ''}
                      placeholder="Số điện thoại..."
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Họ tên Mẹ</label>
                    <input
                      name="mother_name"
                      defaultValue={editingStudent?.mother_name || ''}
                      placeholder="Họ tên mẹ..."
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Điện thoại Mẹ</label>
                    <input
                      name="mother_phone"
                      defaultValue={editingStudent?.mother_phone || ''}
                      placeholder="Số điện thoại..."
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi chú</label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={editingStudent?.notes || ''}
                  placeholder="Ghi chú về học sinh, chuyên đề học..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition shadow-sm"
                >
                  {loading ? 'Đang lưu...' : 'Lưu học sinh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Preview Import Excel */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-800">
                  Xem trước dữ liệu Excel ({previewData.length} học sinh)
                </h2>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Vui lòng kiểm tra lại thông tin các cột trước khi bấm &quot;Xác nhận nhập dữ liệu&quot;.
            </p>

            <div className="flex-1 overflow-y-auto mt-4 border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 text-center">STT</th>
                    <th className="p-2.5">Họ tên</th>
                    <th className="p-2.5 text-center">Giới tính</th>
                    <th className="p-2.5">Ngày sinh</th>
                    <th className="p-2.5">Địa chỉ</th>
                    <th className="p-2.5">Bố</th>
                    <th className="p-2.5">ĐT Bố</th>
                    <th className="p-2.5">Mẹ</th>
                    <th className="p-2.5">ĐT Mẹ</th>
                    <th className="p-2.5">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewData.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50/70">
                      <td className="p-2.5 text-center text-slate-500">{i + 1}</td>
                      <td className="p-2.5 font-semibold text-slate-800">{item.full_name}</td>
                      <td className="p-2.5 text-center">{item.gender}</td>
                      <td className="p-2.5">{item.dob || '-'}</td>
                      <td className="p-2.5">{item.address || '-'}</td>
                      <td className="p-2.5">{item.father_name || '-'}</td>
                      <td className="p-2.5">{item.father_phone || '-'}</td>
                      <td className="p-2.5">{item.mother_name || '-'}</td>
                      <td className="p-2.5">{item.mother_phone || '-'}</td>
                      <td className="p-2.5 text-slate-400">{item.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={loading}
                className="px-5 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition shadow-sm flex items-center gap-1.5"
              >
                {loading ? 'Đang lưu vào hệ thống...' : `Xác nhận nhập (${previewData.length} học sinh)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

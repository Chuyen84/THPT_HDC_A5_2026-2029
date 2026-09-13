'use client'

import { useState, useRef, useMemo } from 'react'
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
  AlertTriangle,
  CheckSquare,
  Square,
  Filter,
  RefreshCw,
} from 'lucide-react'
import {
  addStudent,
  updateStudent,
  deleteStudent,
  deleteStudentsBatch,
  clearAllStudents,
  importStudentsBatch,
} from './actions'

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

interface ParsedImportItem {
  full_name: string
  gender: string
  dob: string | null
  address: string
  father_name: string
  father_phone: string
  mother_name: string
  mother_phone: string
  notes: string
  // Duplicate check
  isDuplicate?: boolean
  existingId?: string
  existingStudent?: Student
}

export default function StudentManager({
  students,
  canManage,
}: {
  students: Student[]
  canManage: boolean
}) {
  // Filters & Search
  const [search, setSearch] = useState('')
  const [filterGender, setFilterGender] = useState<string>('ALL')
  const [filterMonth, setFilterMonth] = useState<string>('ALL')
  const [filterYear, setFilterYear] = useState<string>('ALL')

  // Selection for Batch Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Modals
  const [showModal, setShowModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Import preview & duplicate handling
  const [previewList, setPreviewList] = useState<ParsedImportItem[]>([])
  const [duplicateAction, setDuplicateAction] = useState<'overwrite' | 'skip'>('overwrite')

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Extract list of unique years from existing student records for year filter
  const availableYears = useMemo(() => {
    const years = new Set<string>()
    students.forEach((s) => {
      if (s.dob) {
        const y = s.dob.split('-')[0]
        if (y && y.length === 4) years.add(y)
      }
    })
    return Array.from(years).sort((a, b) => b.localeCompare(a))
  }, [students])

  // Filtered student list
  const filtered = useMemo(() => {
    return students.filter((s) => {
      // Search term
      const term = search.toLowerCase().trim()
      const matchesSearch =
        !term ||
        (s.full_name || '').toLowerCase().includes(term) ||
        (s.address || '').toLowerCase().includes(term) ||
        (s.father_phone || '').includes(term) ||
        (s.mother_phone || '').includes(term) ||
        (s.father_name || '').toLowerCase().includes(term) ||
        (s.mother_name || '').toLowerCase().includes(term)

      // Gender filter
      const matchesGender =
        filterGender === 'ALL' || (s.gender || 'Nam') === filterGender

      // DOB filters (Month & Year)
      let matchesMonth = true
      let matchesYear = true

      if (filterMonth !== 'ALL') {
        if (!s.dob) {
          matchesMonth = false
        } else {
          const parts = s.dob.split('-')
          const m = parts[1] ? parseInt(parts[1], 10) : null
          matchesMonth = m === parseInt(filterMonth, 10)
        }
      }

      if (filterYear !== 'ALL') {
        if (!s.dob) {
          matchesYear = false
        } else {
          const parts = s.dob.split('-')
          matchesYear = parts[0] === filterYear
        }
      }

      return matchesSearch && matchesGender && matchesMonth && matchesYear
    })
  }, [students, search, filterGender, filterMonth, filterYear])

  // Selection Helpers
  const isAllSelected =
    filtered.length > 0 && filtered.every((s) => selectedIds.includes(s.id))

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      const filteredIds = new Set(filtered.map((s) => s.id))
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.has(id)))
    } else {
      const newIds = new Set([...selectedIds, ...filtered.map((s) => s.id)])
      setSelectedIds(Array.from(newIds))
    }
  }

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Batch Delete Selected
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return
    if (
      !confirm(
        `Bạn có chắc chắn muốn xoá ${selectedIds.length} học sinh đã chọn không?`
      )
    )
      return

    try {
      setLoading(true)
      await deleteStudentsBatch(selectedIds)
      setSelectedIds([])
      alert('Đã xoá các học sinh đã chọn thành công!')
    } catch (err: any) {
      alert('Lỗi khi xoá: ' + (err.message || 'Không xác định'))
    } finally {
      setLoading(false)
    }
  }

  // Clear All Students
  const handleClearAll = async () => {
    if (students.length === 0) return
    const confirmed = confirm(
      'CẢNH BÁO: Thao tác này sẽ xoá TOÀN BỘ học sinh trong danh sách!\nBạn có chắc chắn muốn thực hiện?'
    )
    if (!confirmed) return

    try {
      setLoading(true)
      await clearAllStudents()
      setSelectedIds([])
      alert('Đã xoá toàn bộ danh sách học sinh!')
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Không xác định'))
    } finally {
      setLoading(false)
    }
  }

  // Export to Excel
  const handleExportExcel = () => {
    if (students.length === 0) {
      alert('Chưa có dữ liệu học sinh để xuất file!')
      return
    }

    const exportRows = students.map((s, index) => {
      let dobDisplay = ''
      if (s.dob) {
        const parts = s.dob.split('-')
        if (parts.length === 3) {
          dobDisplay = `${parts[2]}/${parts[1]}/${parts[0]}`
        } else {
          dobDisplay = s.dob
        }
      }

      return {
        STT: index + 1,
        'Họ tên': s.full_name,
        'Giới tính': s.gender || 'Nam',
        'Ngày sinh': dobDisplay,
        'Địa chỉ': s.address || '',
        Bố: s.father_name || '',
        'Điện thoại bố': s.father_phone || '',
        Mẹ: s.mother_name || '',
        'Điện thoại mẹ': s.mother_phone || '',
        'Ghi chú': s.notes || '',
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(exportRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách học sinh')

    const colWidths = [
      { wch: 6 },
      { wch: 24 },
      { wch: 10 },
      { wch: 14 },
      { wch: 28 },
      { wch: 20 },
      { wch: 16 },
      { wch: 20 },
      { wch: 16 },
      { wch: 20 },
    ]
    worksheet['!cols'] = colWidths

    XLSX.writeFile(
      workbook,
      `Danh_Sach_Hoc_Sinh_Lop_10A5_${new Date().toISOString().split('T')[0]}.xlsx`
    )
  }

  // Robust Date Parser
  const parseDateString = (val: any): string | null => {
    if (!val && val !== 0) return null

    if (typeof val === 'number') {
      try {
        const date = new Date(Math.round((val - 25569) * 86400 * 1000))
        return date.toISOString().split('T')[0]
      } catch {
        return null
      }
    }

    const str = String(val).trim()
    if (!str) return null

    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str

    const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/)
    if (dmyMatch) {
      const d = dmyMatch[1].padStart(2, '0')
      const m = dmyMatch[2].padStart(2, '0')
      let y = dmyMatch[3]
      if (y.length === 2) y = '20' + y
      return `${y}-${m}-${d}`
    }

    const cleanDigits = str.replace(/[^\d]/g, '')
    if (cleanDigits.length >= 8) {
      const d = cleanDigits.slice(0, 2)
      const m = cleanDigits.slice(2, 4)
      const y = cleanDigits.slice(4, 8)
      const dayNum = parseInt(d, 10)
      const monthNum = parseInt(m, 10)
      if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12) {
        return `${y}-${m}-${d}`
      }
    }

    return null
  }

  // Format Phone Number
  const formatPhone = (val: any): string => {
    if (!val && val !== 0) return ''
    let s = String(val).replace(/[\s\.\-\(\)]/g, '').trim()
    if (!s) return ''
    if (/^\d{9}$/.test(s)) {
      s = '0' + s
    }
    return s
  }

  // Smart Header Normalization
  const normalizeText = (text: any): string => {
    return String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\_\n\r\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  // Handle Excel File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const bstr = event.target?.result
        const workbook = XLSX.read(bstr, { type: 'binary', cellDates: false })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        const rawSheet: any[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
        })
        if (rawSheet.length === 0) {
          alert('File Excel không có dữ liệu!')
          return
        }

        let headerRowIndex = 0
        for (let i = 0; i < Math.min(rawSheet.length, 12); i++) {
          const rowNorm = rawSheet[i].map(normalizeText).join(' ')
          if (
            rowNorm.includes('ho ten') ||
            rowNorm.includes('hoten') ||
            rowNorm.includes('ho va ten') ||
            (rowNorm.includes('stt') && rowNorm.includes('ngay sinh'))
          ) {
            headerRowIndex = i
            break
          }
        }

        const rawHeaders = rawSheet[headerRowIndex] || []
        const dataRows = rawSheet.slice(headerRowIndex + 1)

        const colIndexes = {
          stt: -1,
          fullName: -1,
          gender: -1,
          dob: -1,
          address: -1,
          fatherName: -1,
          fatherPhone: -1,
          motherName: -1,
          motherPhone: -1,
          notes: -1,
        }

        rawHeaders.forEach((h: any, idx: number) => {
          const norm = normalizeText(h)
          if (!norm) return

          if (norm === 'stt' || norm.startsWith('stt')) {
            colIndexes.stt = idx
          } else if (
            norm.includes('ho ten') ||
            norm.includes('ho va ten') ||
            norm === 'ten' ||
            norm === 'hoc sinh'
          ) {
            colIndexes.fullName = idx
          } else if (
            norm.includes('gioi tinh') ||
            norm.includes('nam/nu') ||
            norm === 'phai'
          ) {
            colIndexes.gender = idx
          } else if (
            norm.includes('ngay sinh') ||
            norm.includes('ngaysinh') ||
            norm === 'ns' ||
            norm.includes('sinh ngay')
          ) {
            colIndexes.dob = idx
          } else if (
            norm.includes('dia chi') ||
            norm.includes('ho khau') ||
            norm.includes('noi o') ||
            norm.includes('thuong tru')
          ) {
            colIndexes.address = idx
          } else if (
            norm.includes('dien thoai bo') ||
            norm.includes('dien thoai b') ||
            norm.includes('dt bo') ||
            norm.includes('dt b') ||
            norm.includes('sdt bo') ||
            norm.includes('sdt cha') ||
            norm.includes('phone bo') ||
            norm.includes('so dt bo')
          ) {
            colIndexes.fatherPhone = idx
          } else if (
            norm.includes('dien thoai me') ||
            norm.includes('dien thoai m') ||
            norm.includes('dt me') ||
            norm.includes('dt m') ||
            norm.includes('sdt me') ||
            norm.includes('phone me') ||
            norm.includes('so dt me')
          ) {
            colIndexes.motherPhone = idx
          } else if (
            norm === 'bo' ||
            norm.includes('ho ten bo') ||
            norm.includes('ten bo') ||
            norm.includes('cha')
          ) {
            colIndexes.fatherName = idx
          } else if (
            norm === 'me' ||
            norm.includes('ho ten me') ||
            norm.includes('ten me')
          ) {
            colIndexes.motherName = idx
          } else if (
            norm.includes('ghi chu') ||
            norm.includes('chuyen de') ||
            norm.includes('luu y')
          ) {
            colIndexes.notes = idx
          }
        })

        if (colIndexes.fullName === -1 && rawHeaders.length >= 2) colIndexes.fullName = 1
        if (colIndexes.gender === -1 && rawHeaders.length >= 3) colIndexes.gender = 2
        if (colIndexes.dob === -1 && rawHeaders.length >= 4) colIndexes.dob = 3
        if (colIndexes.address === -1 && rawHeaders.length >= 5) colIndexes.address = 4
        if (colIndexes.fatherName === -1 && rawHeaders.length >= 6) colIndexes.fatherName = 5
        if (colIndexes.fatherPhone === -1 && rawHeaders.length >= 7) colIndexes.fatherPhone = 6
        if (colIndexes.motherName === -1 && rawHeaders.length >= 8) colIndexes.motherName = 7
        if (colIndexes.motherPhone === -1 && rawHeaders.length >= 9) colIndexes.motherPhone = 8
        if (colIndexes.notes === -1 && rawHeaders.length >= 10) colIndexes.notes = 9

        const getCellStr = (row: any[], index: number): string => {
          if (index < 0 || index >= row.length) return ''
          const val = row[index]
          if (val === null || val === undefined) return ''
          return String(val).trim()
        }

        const existingStudentMap = new Map<string, Student>()
        students.forEach((s) => {
          existingStudentMap.set(normalizeText(s.full_name), s)
        })

        const mapped: ParsedImportItem[] = []

        dataRows.forEach((row) => {
          const fullName = getCellStr(row, colIndexes.fullName)
          const normName = normalizeText(fullName)

          if (!fullName || normName === 'ho ten' || normName === 'ho va ten' || fullName.length < 2) {
            return
          }

          const rawGender = getCellStr(row, colIndexes.gender)
          const normGender = normalizeText(rawGender)
          const gender = normGender.includes('nu') ? 'Nữ' : 'Nam'

          const rawDob = colIndexes.dob >= 0 ? row[colIndexes.dob] : null
          const dob = parseDateString(rawDob)

          const address = getCellStr(row, colIndexes.address)
          const fatherName = getCellStr(row, colIndexes.fatherName)
          const fatherPhone = formatPhone(colIndexes.fatherPhone >= 0 ? row[colIndexes.fatherPhone] : '')
          const motherName = getCellStr(row, colIndexes.motherName)
          const motherPhone = formatPhone(colIndexes.motherPhone >= 0 ? row[colIndexes.motherPhone] : '')
          const notes = getCellStr(row, colIndexes.notes)

          const existing = existingStudentMap.get(normName)
          const isDuplicate = !!existing

          mapped.push({
            full_name: fullName,
            gender,
            dob,
            address,
            father_name: fatherName,
            father_phone: fatherPhone,
            mother_name: motherName,
            mother_phone: motherPhone,
            notes,
            isDuplicate,
            existingId: existing?.id,
            existingStudent: existing,
          })
        })

        if (mapped.length === 0) {
          alert('Không tìm thấy bản ghi học sinh hợp lệ nào trong file!')
          return
        }

        setPreviewList(mapped)
        setDuplicateAction('overwrite')
        setShowImportModal(true)
      } catch (err: any) {
        alert('Không thể đọc file Excel: ' + (err.message || 'Lỗi định dạng file'))
      }
    }

    reader.readAsBinaryString(file)
    e.target.value = ''
  }

  const duplicateCount = useMemo(() => {
    return previewList.filter((p) => p.isDuplicate).length
  }, [previewList])

  // Execute Batch Import
  const handleConfirmImport = async () => {
    if (previewList.length === 0) return

    try {
      setLoading(true)
      const toInsert: any[] = []
      const toUpdate: { id: string; data: any }[] = []

      previewList.forEach((item) => {
        const studentPayload = {
          full_name: item.full_name,
          gender: item.gender,
          dob: item.dob,
          address: item.address,
          father_name: item.father_name,
          father_phone: item.father_phone,
          mother_name: item.mother_name,
          mother_phone: item.mother_phone,
          notes: item.notes,
        }

        if (item.isDuplicate && item.existingId) {
          if (duplicateAction === 'overwrite') {
            toUpdate.push({
              id: item.existingId,
              data: studentPayload,
            })
          }
        } else {
          toInsert.push(studentPayload)
        }
      })

      await importStudentsBatch(toInsert, toUpdate)

      const msg = [
        `Nhập dữ liệu thành công!`,
        toInsert.length > 0 ? `+ Thêm mới nối tiếp: ${toInsert.length} học sinh` : '',
        toUpdate.length > 0 ? `+ Cập nhật đè: ${toUpdate.length} học sinh` : '',
        duplicateAction === 'skip' && duplicateCount > 0 ? `+ Bỏ qua (trùng tên): ${duplicateCount} học sinh` : '',
      ]
        .filter(Boolean)
        .join('\n')

      alert(msg)
      setShowImportModal(false)
      setPreviewList([])
    } catch (err: any) {
      alert('Lỗi import: ' + (err.message || 'Đã có lỗi xảy ra'))
    } finally {
      setLoading(false)
    }
  }

  // Handle Save (Add/Edit)
  const handleSaveStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      full_name: (formData.get('full_name') as string).trim(),
      gender: formData.get('gender') as string,
      dob: (formData.get('dob') as string) || null,
      address: (formData.get('address') as string).trim(),
      father_name: (formData.get('father_name') as string).trim(),
      father_phone: formatPhone(formData.get('father_phone') as string),
      mother_name: (formData.get('mother_name') as string).trim(),
      mother_phone: formatPhone(formData.get('mother_phone') as string),
      notes: (formData.get('notes') as string).trim(),
    }

    try {
      if (editingStudent) {
        await updateStudent(editingStudent.id, data)
      } else {
        const exists = students.some(
          (s) => normalizeText(s.full_name) === normalizeText(data.full_name)
        )
        if (exists) {
          const confirmAdd = confirm(
            `Học sinh "${data.full_name}" đã có trong danh sách. Bạn có chắc chắn muốn thêm trùng tên không?`
          )
          if (!confirmAdd) {
            setLoading(false)
            return
          }
        }
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

  // Delete single
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xoá thông tin học sinh "${name}" không?`)) return
    try {
      setDeletingId(id)
      await deleteStudent(id)
      setSelectedIds((prev) => prev.filter((item) => item !== id))
    } catch (err: any) {
      alert('Lỗi khi xoá: ' + (err.message || 'Không xác định'))
    } finally {
      setDeletingId(null)
    }
  }

  const femaleCount = students.filter((s) => s.gender === 'Nữ').length
  const maleCount = students.length - femaleCount

  return (
    <div className="space-y-4">
      {/* Top Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-xl p-3.5 shadow-2xs transition-colors">
          <div className="text-xs text-blue-600 dark:text-cyan-400 font-medium flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Sĩ số lớp
          </div>
          <div className="text-2xl font-bold text-blue-950 dark:text-white mt-0.5">
            {students.length}{' '}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">học sinh</span>
          </div>
        </div>
        <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 rounded-xl p-3.5 shadow-2xs transition-colors">
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Học sinh Nam</div>
          <div className="text-2xl font-bold text-emerald-950 dark:text-white mt-0.5">
            {maleCount} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({students.length > 0 ? Math.round((maleCount / students.length) * 100) : 0}%)</span>
          </div>
        </div>
        <div className="bg-rose-50/80 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/60 rounded-xl p-3.5 shadow-2xs transition-colors">
          <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">Học sinh Nữ</div>
          <div className="text-2xl font-bold text-rose-950 dark:text-white mt-0.5">
            {femaleCount} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({students.length > 0 ? Math.round((femaleCount / students.length) * 100) : 0}%)</span>
          </div>
        </div>
        <div className="bg-purple-50/80 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/60 rounded-xl p-3.5 shadow-2xs transition-colors">
          <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">Khối / Chuyên đề</div>
          <div className="text-sm font-bold text-purple-950 dark:text-white mt-1 truncate">
            Toán, Vật lý, Ngữ văn
          </div>
        </div>
      </div>

      {/* Action Toolbar & Filters */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs transition-colors">
        {/* Row 1: Search and Action Buttons */}
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên học sinh, địa chỉ, SĐT bố/mẹ..."
              className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
            {canManage && selectedIds.length > 0 && (
              <button
                onClick={handleBatchDelete}
                disabled={loading}
                className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-xs animate-in fade-in"
                title="Xoá các học sinh đã chọn"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xoá {selectedIds.length} đã chọn</span>
              </button>
            )}

            {canManage && students.length > 0 && selectedIds.length === 0 && (
              <button
                onClick={handleClearAll}
                disabled={loading}
                className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 text-xs font-medium px-3 py-2 rounded-xl transition shadow-2xs"
                title="Xoá toàn bộ danh sách"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Xoá tất cả</span>
              </button>
            )}

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-2xs"
              title="Xuất file Excel"
            >
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Xuất Excel</span>
            </button>

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
                  className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-2xs"
                  title="Nhập từ file Excel"
                >
                  <Upload className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                  <span>Nhập Excel</span>
                </button>
              </>
            )}

            {canManage && (
              <button
                onClick={() => {
                  setEditingStudent(null)
                  setShowModal(true)
                }}
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm học sinh</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium mr-1">
            <Filter className="w-3.5 h-3.5" /> Bộ lọc:
          </div>

          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400">Giới tính:</span>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="bg-transparent font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400">Tháng sinh:</span>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="bg-transparent font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả các tháng</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={String(m)}>
                  Tháng {m}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400">Năm sinh:</span>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="bg-transparent font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả các năm</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  Năm {y}
                </option>
              ))}
            </select>
          </div>

          {(filterGender !== 'ALL' || filterMonth !== 'ALL' || filterYear !== 'ALL' || search) && (
            <button
              onClick={() => {
                setSearch('')
                setFilterGender('ALL')
                setFilterMonth('ALL')
                setFilterYear('ALL')
              }}
              className="inline-flex items-center gap-1 text-blue-600 dark:text-cyan-400 hover:underline ml-auto font-medium"
            >
              <RefreshCw className="w-3 h-3" /> Đặt lại bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Main Table: Standard Columns */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead className="bg-[#bfe6f7]/70 dark:bg-[#103459]/80 text-slate-900 dark:text-cyan-100 font-bold border-b border-blue-200 dark:border-blue-900/60">
              <tr>
                {canManage && (
                  <th className="p-3 text-center w-10 border-r border-blue-200 dark:border-blue-900/40">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="text-slate-600 dark:text-slate-300 hover:text-blue-600 focus:outline-none"
                      title={isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      )}
                    </button>
                  </th>
                )}
                <th className="p-3 text-center w-12 border-r border-blue-200 dark:border-blue-900/40">STT</th>
                <th className="p-3 border-r border-blue-200 dark:border-blue-900/40 min-w-[170px]">Họ tên</th>
                <th className="p-3 text-center border-r border-blue-200 dark:border-blue-900/40 w-24">Giới tính</th>
                <th className="p-3 border-r border-blue-200 dark:border-blue-900/40 w-28 text-center">Ngày sinh</th>
                <th className="p-3 border-r border-blue-200 dark:border-blue-900/40 min-w-[190px]">Địa chỉ</th>
                <th className="p-3 border-r border-blue-200 dark:border-blue-900/40 min-w-[140px]">Bố</th>
                <th className="p-3 border-r border-blue-200 dark:border-blue-900/40 min-w-[125px]">Điện thoại bố</th>
                <th className="p-3 border-r border-blue-200 dark:border-blue-900/40 min-w-[140px]">Mẹ</th>
                <th className="p-3 border-r border-blue-200 dark:border-blue-900/40 min-w-[125px]">Điện thoại mẹ</th>
                <th className="p-3 border-r border-blue-200 dark:border-blue-900/40 min-w-[140px]">Ghi chú</th>
                {canManage && <th className="p-3 text-center w-20">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={canManage ? 12 : 10}
                    className="p-12 text-center text-slate-400 dark:text-slate-500"
                  >
                    <GraduationCap className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    Không tìm thấy học sinh nào phù hợp. Bấm &quot;Thêm học sinh&quot; hoặc &quot;Nhập Excel&quot; để thêm dữ liệu.
                  </td>
                </tr>
              ) : (
                filtered.map((student, idx) => {
                  const isSelected = selectedIds.includes(student.id)

                  let dobDisplay = '-'
                  if (student.dob) {
                    const p = student.dob.split('-')
                    if (p.length === 3) dobDisplay = `${p[2]}/${p[1]}/${p[0]}`
                    else dobDisplay = student.dob
                  }

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-blue-50/40 dark:hover:bg-blue-950/30 transition ${
                        isSelected ? 'bg-blue-50/60 dark:bg-blue-950/50' : ''
                      }`}
                    >
                      {canManage && (
                        <td className="p-3 text-center border-r border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => handleToggleSelectRow(student.id)}
                            className="text-slate-400 hover:text-blue-600 focus:outline-none"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                            )}
                          </button>
                        </td>
                      )}
                      <td className="p-3 text-center font-medium text-slate-500 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800">
                        {idx + 1}
                      </td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                        {student.full_name}
                      </td>
                      <td className="p-3 text-center border-r border-slate-100 dark:border-slate-800">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            student.gender === 'Nữ'
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60'
                              : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-300 border border-blue-200 dark:border-blue-900/60'
                          }`}
                        >
                          {student.gender || 'Nam'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300 text-center border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                        {dobDisplay}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800">
                        {student.address || '-'}
                      </td>
                      <td className="p-3 text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800 font-medium">
                        {student.father_name || '-'}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap font-mono text-xs">
                        {student.father_phone ? (
                          <a
                            href={`tel:${student.father_phone}`}
                            className="text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                            {student.father_phone}
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-3 text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800 font-medium">
                        {student.mother_name || '-'}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap font-mono text-xs">
                        {student.mother_phone ? (
                          <a
                            href={`tel:${student.mother_phone}`}
                            className="text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                            {student.mother_phone}
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-3 text-slate-500 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800 text-xs">
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
                              className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition"
                              title="Sửa thông tin"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleDelete(student.id, student.full_name)
                              }
                              disabled={deletingId === student.id}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition"
                              title="Xoá học sinh"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Student */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                {editingStudent
                  ? 'Cập nhật thông tin học sinh'
                  : 'Thêm học sinh mới'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Họ và tên học sinh <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="full_name"
                    required
                    defaultValue={editingStudent?.full_name || ''}
                    placeholder="VD: Nguyễn Văn Nam"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Giới tính
                  </label>
                  <select
                    name="gender"
                    defaultValue={editingStudent?.gender || 'Nam'}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ngày sinh
                  </label>
                  <input
                    name="dob"
                    type="date"
                    defaultValue={editingStudent?.dob || ''}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Địa chỉ
                  </label>
                  <input
                    name="address"
                    defaultValue={editingStudent?.address || ''}
                    placeholder="VD: Thôn 1, Hoài Đức, Hà Nội"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Thông tin phụ huynh */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="text-xs font-bold text-slate-700 dark:text-cyan-300 uppercase tracking-wider">
                  Thông tin phụ huynh
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                      Họ tên Bố
                    </label>
                    <input
                      name="father_name"
                      defaultValue={editingStudent?.father_name || ''}
                      placeholder="Họ tên bố..."
                      className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                      Điện thoại Bố
                    </label>
                    <input
                      name="father_phone"
                      defaultValue={editingStudent?.father_phone || ''}
                      placeholder="VD: 0912345678"
                      className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                      Họ tên Mẹ
                    </label>
                    <input
                      name="mother_name"
                      defaultValue={editingStudent?.mother_name || ''}
                      placeholder="Họ tên mẹ..."
                      className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                      Điện thoại Mẹ
                    </label>
                    <input
                      name="mother_phone"
                      defaultValue={editingStudent?.mother_phone || ''}
                      placeholder="VD: 0987654321"
                      className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi chú
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={editingStudent?.notes || ''}
                  placeholder="Ghi chú về học sinh, chuyên đề học..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition"
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

      {/* Modal Preview Import Excel with Deduplication Choice */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-5xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                    Xem trước dữ liệu Excel ({previewList.length} học sinh)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Kiểm tra các cột Ngày sinh, SĐT Bố/Mẹ và tuỳ chọn xử lý dữ liệu trùng lặp
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {duplicateCount > 0 ? (
              <div className="mt-3 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-medium">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>
                    Phát hiện <b>{duplicateCount}</b> học sinh đã có tên trong danh sách hiện tại.
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-amber-800 dark:text-amber-300 font-semibold">Xử lý trùng lặp:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="dupAction"
                      value="overwrite"
                      checked={duplicateAction === 'overwrite'}
                      onChange={() => setDuplicateAction('overwrite')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-medium text-amber-950 dark:text-amber-100">Ghi đè / Cập nhật</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="dupAction"
                      value="skip"
                      checked={duplicateAction === 'skip'}
                      onChange={() => setDuplicateAction('skip')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-medium text-amber-950 dark:text-amber-100">Bỏ qua (không lưu)</span>
                  </label>
                </div>
              </div>
            ) : (
              <div className="mt-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
                ✓ Tất cả {previewList.length} học sinh trong file đều mới, sẽ được thêm nối tiếp vào danh sách.
              </div>
            )}

            <div className="flex-1 overflow-y-auto mt-3 border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-700 z-10">
                  <tr>
                    <th className="p-2.5 text-center w-10">STT</th>
                    <th className="p-2.5">Họ tên</th>
                    <th className="p-2.5 text-center w-16">Giới tính</th>
                    <th className="p-2.5 text-center w-24">Ngày sinh</th>
                    <th className="p-2.5">Địa chỉ</th>
                    <th className="p-2.5">Bố</th>
                    <th className="p-2.5 font-mono">Điện thoại bố</th>
                    <th className="p-2.5">Mẹ</th>
                    <th className="p-2.5 font-mono">Điện thoại mẹ</th>
                    <th className="p-2.5">Ghi chú</th>
                    <th className="p-2.5 text-center w-20">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {previewList.map((item, i) => {
                    let dobDisplay = '-'
                    if (item.dob) {
                      const p = item.dob.split('-')
                      if (p.length === 3) dobDisplay = `${p[2]}/${p[1]}/${p[0]}`
                      else dobDisplay = item.dob
                    }

                    return (
                      <tr
                        key={i}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/60 ${
                          item.isDuplicate ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                        }`}
                      >
                        <td className="p-2.5 text-center text-slate-500 dark:text-slate-400">{i + 1}</td>
                        <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                          {item.full_name}
                        </td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                              item.gender === 'Nữ'
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-300'
                            }`}
                          >
                            {item.gender}
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {dobDisplay !== '-' ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{dobDisplay}</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-300">{item.address || '-'}</td>
                        <td className="p-2.5 text-slate-700 dark:text-slate-300">{item.father_name || '-'}</td>
                        <td className="p-2.5 font-mono font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {item.father_phone ? (
                            <span className="text-blue-700 dark:text-cyan-400 font-semibold">{item.father_phone}</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-2.5 text-slate-700 dark:text-slate-300">{item.mother_name || '-'}</td>
                        <td className="p-2.5 font-mono font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {item.mother_phone ? (
                            <span className="text-blue-700 dark:text-cyan-400 font-semibold">{item.mother_phone}</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-2.5 text-slate-400">{item.notes || '-'}</td>
                        <td className="p-2.5 text-center whitespace-nowrap">
                          {item.isDuplicate ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                              Trùng tên
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                              Mới
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="pt-3.5 flex justify-between items-center border-t border-slate-100 dark:border-slate-800 mt-3">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Tổng cộng: <b>{previewList.length}</b> bản ghi ({previewList.length - duplicateCount} mới, {duplicateCount} trùng)
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={loading}
                  className="px-5 py-2 text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition shadow-sm flex items-center gap-1.5"
                >
                  {loading
                    ? 'Đang lưu vào hệ thống...'
                    : `Xác nhận lưu (${
                        duplicateAction === 'overwrite'
                          ? previewList.length
                          : previewList.length - duplicateCount
                      } học sinh)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

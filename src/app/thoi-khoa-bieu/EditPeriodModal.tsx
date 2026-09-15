'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Save, Trash2, ChevronDown, Check, Search, BookOpen } from 'lucide-react'
import { saveWeeklyOverride } from './actions'

interface Props {
  isOpen: boolean
  onClose: () => void
  weekStartDate: string
  day: number
  period: number
  initialData: any
  onSuccess: () => void
  subjects?: any[]
}

// Danh mục môn học cấp 3 chuẩn mẫu với giáo viên, phòng học và nhóm môn mặc định
interface HighSchoolSubject {
  name: string
  shortName: string
  teacher: string
  room: string
  group: 'tu_nhien' | 'xa_hoi' | 'ngoai_ngu' | 'khac'
  aliases?: string[]
}

const DEFAULT_HIGH_SCHOOL_SUBJECTS: HighSchoolSubject[] = [
  { name: 'Toán học', shortName: 'Toán', teacher: 'Cô Nga', room: 'P.205', group: 'tu_nhien', aliases: ['toan', 'toan hoc', 'math'] },
  { name: 'Ngữ văn', shortName: 'Ngữ văn', teacher: 'Cô Yến', room: 'P.205', group: 'xa_hoi', aliases: ['van', 'ngu van', 'literature'] },
  { name: 'Tiếng Anh', shortName: 'Tiếng Anh', teacher: 'Cô Hương', room: 'P.205', group: 'ngoai_ngu', aliases: ['anh', 'tieng anh', 'english'] },
  { name: 'Vật lí', shortName: 'Vật lí', teacher: 'Cô Huệ', room: 'P.205', group: 'tu_nhien', aliases: ['ly', 'vat ly', 'vat li', 'physics'] },
  { name: 'Hóa học', shortName: 'Hóa học', teacher: 'Thầy Vinh', room: 'Lab Hóa', group: 'tu_nhien', aliases: ['hoa', 'hoa hoc', 'chemistry'] },
  { name: 'Sinh học', shortName: 'Sinh học', teacher: 'Cô Mai', room: 'Lab Sinh', group: 'tu_nhien', aliases: ['sinh', 'sinh hoc', 'biology'] },
  { name: 'Lịch sử', shortName: 'Lịch sử', teacher: 'Cô Hà', room: 'P.205', group: 'xa_hoi', aliases: ['su', 'lich su', 'history'] },
  { name: 'Địa lí', shortName: 'Địa lí', teacher: 'Thầy Hùng', room: 'P.205', group: 'xa_hoi', aliases: ['dia', 'dia ly', 'dia li', 'geography'] },
  { name: 'Tin học', shortName: 'Tin học', teacher: 'Thầy Tuấn', room: 'Phòng máy 1', group: 'tu_nhien', aliases: ['tin', 'tin hoc', 'computer'] },
  { name: 'Giáo dục Quốc phòng', shortName: 'GDQP', teacher: 'Thầy Dũng', room: 'Sân trường', group: 'khac', aliases: ['gdqp', 'quoc phong', 'an ninh'] },
  { name: 'Giáo dục Thể chất', shortName: 'Thể dục', teacher: 'Thầy Mạnh', room: 'Nhà đa năng', group: 'khac', aliases: ['the duc', 'gdtc', 'pe'] },
  { name: 'Sinh hoạt lớp', shortName: 'SHCN', teacher: 'Cô Nga (GVCN)', room: 'P.205', group: 'khac', aliases: ['shcn', 'shl', 'sinh hoat'] },
  { name: 'Chào cờ', shortName: 'Chào cờ', teacher: 'BGH & Đoàn trường', room: 'Sân trường', group: 'khac', aliases: ['chao co', 'cc'] },
  { name: 'Hoạt động trải nghiệm', shortName: 'HĐTN', teacher: 'Cô Nga (GVCN)', room: 'P.205', group: 'khac', aliases: ['hdtn', 'trai nghiem'] },
  { name: 'Giáo dục kinh tế & pháp luật', shortName: 'GDKT&PL', teacher: 'Cô Lan', room: 'P.205', group: 'xa_hoi', aliases: ['gdcd', 'ktpl', 'phap luat'] },
  { name: 'Công nghệ', shortName: 'Công nghệ', teacher: 'Thầy Đức', room: 'P.205', group: 'tu_nhien', aliases: ['cong nghe', 'cn'] },
]

export default function EditPeriodModal({ isOpen, onClose, weekStartDate, day, period, initialData, onSuccess, subjects = [] }: Props) {
  const [subject, setSubject] = useState('')
  const [teacher, setTeacher] = useState('')
  const [room, setRoom] = useState('')
  const [subjectGroup, setSubjectGroup] = useState<'tu_nhien' | 'xa_hoi' | 'ngoai_ngu' | 'khac'>('khac')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // State cho Searchable Dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Gộp danh sách subjects từ database và danh sách chuẩn THPT
  const mergedSubjects: HighSchoolSubject[] = (() => {
    const list = [...DEFAULT_HIGH_SCHOOL_SUBJECTS]
    // Nếu có subjects từ DB, bổ sung hoặc override
    subjects.forEach((s) => {
      const idx = list.findIndex(
        (item) =>
          item.name.toLowerCase() === s.name?.toLowerCase() ||
          item.shortName.toLowerCase() === s.abbreviation?.toLowerCase()
      )
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          teacher: s.teacher_name || list[idx].teacher,
          shortName: s.abbreviation || list[idx].shortName,
        }
      } else if (s.name) {
        list.push({
          name: s.name,
          shortName: s.abbreviation || s.name,
          teacher: s.teacher_name || '',
          room: 'P.205',
          group: 'khac',
        })
      }
    })
    return list
  })()

  // Lọc môn học theo từ khóa tìm kiếm khi người dùng gõ
  const filteredSubjects = mergedSubjects.filter((s) => {
    if (!subject.trim()) return true
    const term = subject.toLowerCase().trim()
    return (
      s.name.toLowerCase().includes(term) ||
      s.shortName.toLowerCase().includes(term) ||
      s.aliases?.some((a) => a.includes(term))
    )
  })

  useEffect(() => {
    if (isOpen) {
      setSubject(initialData?.subject || '')
      setTeacher(initialData?.teacher || '')
      setRoom(initialData?.room || '')
      setSubjectGroup(initialData?.subject_group || 'khac')
      setError('')
      setIsDropdownOpen(false)
    }
  }, [isOpen, initialData])

  // Đóng dropdown khi click ra bên ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!isOpen) return null

  // Khi người dùng click chọn 1 môn học từ danh sách
  const handleSelectSubject = (item: HighSchoolSubject) => {
    const displayName = item.shortName || item.name
    setSubject(displayName)
    setTeacher(item.teacher || '')
    setRoom(item.room || 'P.205')
    setSubjectGroup(item.group || 'khac')
    setIsDropdownOpen(false)
  }

  // Tự động nhận diện nhóm môn nếu người dùng tự gõ tay tên môn
  const detectSubjectGroup = (subjName: string): 'tu_nhien' | 'xa_hoi' | 'ngoai_ngu' | 'khac' => {
    const s = subjName.toLowerCase().trim()
    if (s.includes('toán') || s.includes('lý') || s.includes('hóa') || s.includes('sinh') || s.includes('tin') || s.includes('công nghệ')) return 'tu_nhien'
    if (s.includes('văn') || s.includes('sử') || s.includes('địa') || s.includes('gdcd') || s.includes('ktpl') || s.includes('pháp luật')) return 'xa_hoi'
    if (s.includes('anh') || s.includes('ngoại ngữ') || s.includes('tiếng')) return 'ngoai_ngu'
    return 'khac'
  }

  const handleSubjectInputChange = (val: string) => {
    setSubject(val)
    setIsDropdownOpen(true)

    // Nếu trùng khớp chính xác 1 môn trong danh mục thì tự fill
    const exact = mergedSubjects.find(
      (s) =>
        s.shortName.toLowerCase() === val.toLowerCase().trim() ||
        s.name.toLowerCase() === val.toLowerCase().trim()
    )
    if (exact) {
      if (!teacher) setTeacher(exact.teacher)
      if (!room) setRoom(exact.room)
      setSubjectGroup(exact.group)
    } else if (val.trim()) {
      setSubjectGroup(detectSubjectGroup(val))
    }
  }

  const handleSave = async (e?: React.FormEvent, isClear = false) => {
    if (e) e.preventDefault()

    const finalSubject = isClear ? '' : subject.trim()
    const finalTeacher = isClear ? '' : teacher.trim()
    const finalRoom = isClear ? '' : room.trim()
    const finalGroup = isClear ? 'khac' : subjectGroup

    if (!isClear && !finalSubject) {
      setError('Môn học không được để trống')
      return
    }

    setLoading(true)
    try {
      await saveWeeklyOverride(
        weekStartDate,
        day,
        period,
        finalSubject,
        finalTeacher,
        finalRoom,
        finalGroup,
        initialData
      )
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const groupBadgeColor: Record<string, string> = {
    tu_nhien: 'bg-blue-100 text-blue-700 border-blue-200',
    xa_hoi: 'bg-teal-100 text-teal-700 border-teal-200',
    ngoai_ngu: 'bg-orange-100 text-orange-700 border-orange-200',
    khac: 'bg-purple-100 text-purple-700 border-purple-200',
  }

  const groupLabel: Record<string, string> = {
    tu_nhien: 'Toán - Tin / Tự nhiên',
    xa_hoi: 'KH Xã hội',
    ngoai_ngu: 'Ngoại ngữ',
    khac: 'Khác',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800 text-base">
            Sửa Thứ {day} - {period <= 5 ? 'Sáng' : 'Chiều'} Tiết {period <= 5 ? period : period - 5}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-lg transition text-slate-500"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={(e) => handleSave(e, false)} className="p-4 space-y-4">
          {error && <div className="text-red-600 text-sm p-2.5 bg-red-50 rounded-lg border border-red-200">{error}</div>}

          {/* Ô Môn học: Searchable Autocomplete Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Môn học <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={subject}
                onChange={(e) => handleSubjectInputChange(e.target.value)}
                onFocus={() => setIsDropdownOpen(true)}
                className="w-full px-3.5 py-2.5 pr-10 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none placeholder:text-slate-400"
                placeholder="Nhập hoặc chọn môn học (Toán, Văn, Anh...)"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded"
                tabIndex={-1}
              >
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
              </button>
            </div>

            {/* Dropdown danh sách môn học thông minh */}
            {isDropdownOpen && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-1.5 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Gợi ý môn học cấp 3</span>
                  <span>GV mặc định • Phòng</span>
                </div>

                {filteredSubjects.length > 0 ? (
                  filteredSubjects.map((item, idx) => {
                    const isSelected =
                      subject.trim().toLowerCase() === item.shortName.toLowerCase() ||
                      subject.trim().toLowerCase() === item.name.toLowerCase()

                    return (
                      <div
                        key={idx}
                        onClick={() => handleSelectSubject(item)}
                        className={`px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-colors text-sm ${
                          isSelected ? 'bg-blue-50 text-blue-900 font-medium' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{item.shortName}</span>
                          {item.name !== item.shortName && (
                            <span className="text-xs text-slate-400">({item.name})</span>
                          )}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-normal ${groupBadgeColor[item.group] || ''}`}>
                            {item.group === 'tu_nhien' ? 'T.Nhiên' : item.group === 'xa_hoi' ? 'X.Hội' : item.group === 'ngoai_ngu' ? 'Ngoại ngữ' : 'Khác'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-medium text-slate-700">{item.teacher}</span>
                          <span className="text-slate-300">•</span>
                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[11px]">{item.room}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 ml-1" />}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="p-3 text-center text-xs text-slate-400">
                    Không tìm thấy môn có sẵn. Bạn có thể tiếp tục gõ môn mới!
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ô Giáo viên */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Giáo viên</label>
            <input
              type="text"
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none placeholder:text-slate-400"
              placeholder="VD: Cô Mai, Thầy Vinh..."
            />
          </div>

          {/* Grid: Phòng học & Nhóm môn */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phòng học</label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none placeholder:text-slate-400"
                placeholder="VD: P.205, Lab Hóa..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nhóm môn</label>
              <select
                value={subjectGroup}
                onChange={(e) => setSubjectGroup(e.target.value as any)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none bg-white"
              >
                <option value="tu_nhien">Toán - Tin / Tự nhiên</option>
                <option value="xa_hoi">KH Xã hội</option>
                <option value="ngoai_ngu">Ngoại ngữ</option>
                <option value="khac">Khác (GDTC, SHCN, Chào cờ...)</option>
              </select>
            </div>
          </div>

          {/* 3 nút hành động bên dưới theo đúng chuẩn yêu cầu */}
          <div className="pt-4 flex justify-between items-center gap-3 border-t border-slate-100">
            {/* Nút đỏ Xóa trắng bên trái */}
            <button
              type="button"
              onClick={() => handleSave(undefined, true)}
              disabled={loading}
              className="flex items-center gap-1.5 text-red-600 px-3.5 py-2 rounded-lg hover:bg-red-50 transition text-sm font-medium border border-transparent hover:border-red-200"
            >
              <Trash2 className="w-4 h-4" /> Xóa trắng
            </button>

            {/* Cụm nút bên phải: Hủy & Lưu lại */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition text-sm"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50 shadow-sm"
              >
                {loading ? 'Đang lưu...' : (
                  <>
                    <Save className="w-4 h-4" /> Lưu lại
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}


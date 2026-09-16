'use client'

import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import {
  Upload,
  FileSpreadsheet,
  Image as ImageIcon,
  Check,
  X,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Trash2,
  HelpCircle
} from 'lucide-react'
import { bulkImportFunds, ImportFundItem } from './actions'

interface Student {
  id: string
  full_name: string
  student_code?: string | null
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  students: Student[]
}

export default function ImportFundModal({ isOpen, onClose, onSuccess, students }: Props) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload')
  const [loading, setLoading] = useState(false)
  const [ocrProgress, setOcrProgress] = useState('')
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')

  const [rawHeaders, setRawHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<any[][]>([])

  const [mapping, setMapping] = useState<{
    studentNameCol: number
    amountCol: number
    dateCol: number
    categoryCol: number
    noteCol: number
  }>({
    studentNameCol: -1,
    amountCol: -1,
    dateCol: -1,
    categoryCol: -1,
    noteCol: -1
  })

  const [multiColMode, setMultiColMode] = useState(false)
  const [selectedFeeCols, setSelectedFeeCols] = useState<{ [colIdx: number]: string }>({})

  const [defaultTitle, setDefaultTitle] = useState('Thu tiền học kỳ I - Năm học 2026-2027')
  const [defaultDate, setDefaultDate] = useState(new Date().toISOString().split('T')[0])
  const [defaultCategory, setDefaultCategory] = useState('thu_dot')

  const [previewItems, setPreviewItems] = useState<ImportFundItem[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const imgInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const normalize = (str: string) => {
    return (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd')
      .trim()
  }

  const matchStudent = (name: string): Student | undefined => {
    if (!name) return undefined
    const norm = normalize(name)
    let found = students.find(s => normalize(s.full_name) === norm)
    if (found) return found

    const expandedNorm = norm
      .replace(/\bng\b/g, 'nguyen')
      .replace(/\btr\b/g, 'tran')
      .replace(/\bv\b/g, 'van')
      .replace(/\bt\b/g, 'thi')

    found = students.find(s => {
      const sNorm = normalize(s.full_name)
      return sNorm === expandedNorm || sNorm.includes(expandedNorm) || expandedNorm.includes(sNorm)
    })
    return found
  }

  const autoDetectMapping = (headers: string[]) => {
    let nameIdx = -1
    let amtIdx = -1
    let dtIdx = -1
    let catIdx = -1
    let ntIdx = -1
    const detectedFeeCols: { [colIdx: number]: string } = {}

    headers.forEach((h, idx) => {
      const text = normalize(h)
      if (nameIdx === -1 && (text.includes('ho va ten') || text.includes('ho ten') || text.includes('hoc sinh') || text.includes('nguoi nop') || text === 'ten')) {
        nameIdx = idx
      } else if (text.includes('tong cong') || text.includes('so tien') || text.includes('thanh tien') || text === 'tien') {
        amtIdx = idx
      } else if (text.includes('ngay') || text.includes('thoi gian')) {
        dtIdx = idx
      } else if (text.includes('ghi chu') || text.includes('noi dung') || text.includes('ck ngay')) {
        ntIdx = idx
      } else if (text.includes('khoan thu') || text.includes('muc thu') || text.includes('danh muc')) {
        catIdx = idx
      }

      if (text.includes('bhtt') || text.includes('nuoc') || text.includes('lldt') || text.includes('enetviet') || text.includes('dieu hoa') || text.includes('cmhs') || text.includes('quy lop') || text.includes('hoc phi') || text.includes('bao hiem')) {
        detectedFeeCols[idx] = h
      }
    })

    if (amtIdx === -1 && headers.length > 2) {
      const tIdx = headers.findIndex(h => normalize(h).includes('tong'))
      if (tIdx !== -1) amtIdx = tIdx
    }

    setMapping({
      studentNameCol: nameIdx !== -1 ? nameIdx : 1,
      amountCol: amtIdx !== -1 ? amtIdx : (headers.length > 2 ? headers.length - 2 : -1),
      dateCol: dtIdx,
      categoryCol: catIdx,
      noteCol: ntIdx !== -1 ? ntIdx : (headers.length > 1 ? headers.length - 1 : -1)
    })

    if (Object.keys(detectedFeeCols).length > 0) {
      setSelectedFeeCols(detectedFeeCols)
    }
  }

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]

        if (!data || data.length === 0) {
          throw new Error('File Excel rỗng, vui lòng chọn file khác.')
        }

        let headerRowIdx = 0
        for (let i = 0; i < Math.min(10, data.length); i++) {
          const rowText = (data[i] || []).map(c => normalize(String(c))).join(' ')
          if (rowText.includes('ho va ten') || rowText.includes('ho ten') || rowText.includes('stt') || rowText.includes('tong cong')) {
            headerRowIdx = i
            break
          }
        }

        const headers = (data[headerRowIdx] || []).map((h, i) => String(h || `Cột ${i + 1}`).trim())
        const dataRows = data.slice(headerRowIdx + 1).filter(r => r && r.length > 0 && r.some(c => c !== null && c !== ''))

        setRawHeaders(headers)
        setRawRows(dataRows)
        autoDetectMapping(headers)
        setStep('mapping')
      } catch (err: any) {
        setError(err.message || 'Lỗi đọc file Excel.')
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setFileName(file.name)
    setLoading(true)
    setOcrProgress('Đang nạp mô hình OCR nhận diện chữ tiếng Việt...')

    try {
      const Tesseract = await import('tesseract.js')
      const { data: { text } } = await Tesseract.recognize(file, 'vie', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(`Đang trích xuất dữ liệu ảnh: ${Math.round(m.progress * 100)}%`)
          }
        }
      })

      setOcrProgress('Đang phân tích bảng biểu thông minh...')
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

      const parsedData: any[][] = []
      const headers = ['STT', 'Họ và tên', 'Tổng cộng', 'Ghi chú']

      lines.forEach((line) => {
        const moneyMatches = line.match(/\b\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{3})?\b/g)
        const dateMatch = line.match(/(\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)/)
        
        let cleanName = line
          .replace(/CK ngày.*$/i, '')
          .replace(/\b\d{1,3}(?:[.,]\d{3})+\b/g, '')
          .replace(/^\d+[\s.]*/, '')
          .trim()

        if (cleanName && cleanName.length > 3 && moneyMatches && moneyMatches.length > 0) {
          const rawAmt = moneyMatches[moneyMatches.length - 1].replace(/[.,]/g, '')
          const amount = parseInt(rawAmt, 10)
          if (amount > 10000) {
            parsedData.push([
              parsedData.length + 1,
              cleanName,
              amount,
              dateMatch ? `CK ngày ${dateMatch[0]}` : 'Đã nộp'
            ])
          }
        }
      })

      if (parsedData.length === 0) {
        throw new Error('Chưa nhận diện được bảng thu tiền từ ảnh. Bạn có thể sử dụng file Excel hoặc kiểm tra lại độ nét của ảnh.')
      }

      setRawHeaders(headers)
      setRawRows(parsedData)
      setMapping({
        studentNameCol: 1,
        amountCol: 2,
        dateCol: -1,
        categoryCol: -1,
        noteCol: 3
      })
      setStep('mapping')
    } catch (err: any) {
      setError(err.message || 'Lỗi khi trích xuất dữ liệu từ ảnh.')
    } finally {
      setLoading(false)
      setOcrProgress('')
    }
  }

  const parseAmount = (val: any): number => {
    if (typeof val === 'number') return val
    if (!val) return 0
    const clean = String(val).replace(/[^0-9]/g, '')
    return parseInt(clean, 10) || 0
  }

  const parseDate = (val: any, noteVal: any): string => {
    if (val) {
      const str = String(val).trim()
      const dmy = str.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)
      if (dmy) {
        return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
      }
    }
    if (noteVal) {
      const str = String(noteVal).trim()
      const dmy = str.match(/(\d{1,2})[/-](\\d{1,2})[/-](\d{4})/) || str.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)
      if (dmy) {
        return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
      }
    }
    return defaultDate
  }

  const handleProceedToPreview = () => {
    setError('')
    if (mapping.studentNameCol === -1 && mapping.amountCol === -1 && Object.keys(selectedFeeCols).length === 0) {
      setError('Vui lòng chọn cột Tên học sinh và cột Số tiền!')
      return
    }

    const items: ImportFundItem[] = []

    rawRows.forEach((row) => {
      const rawName = mapping.studentNameCol !== -1 ? String(row[mapping.studentNameCol] || '').trim() : ''
      if (!rawName || normalize(rawName).includes('tong cong') || normalize(rawName).includes('nguoi lap') || normalize(rawName).includes('ha noi, ngay')) {
        return
      }

      const matchedStudent = matchStudent(rawName)
      const studentName = matchedStudent ? matchedStudent.full_name : rawName
      const studentId = matchedStudent ? matchedStudent.id : undefined

      const noteText = mapping.noteCol !== -1 ? String(row[mapping.noteCol] || '').trim() : ''
      const entryDate = parseDate(mapping.dateCol !== -1 ? row[mapping.dateCol] : null, noteText)

      if (!multiColMode || Object.keys(selectedFeeCols).length === 0) {
        let amount = mapping.amountCol !== -1 ? parseAmount(row[mapping.amountCol]) : 0

        // Thông minh: Nếu cột Tổng số tiền đang trống/bằng 0 nhưng có các cột thành phần chi phí trong hàng, tự động cộng dồn
        if (amount === 0 && Object.keys(selectedFeeCols).length > 0) {
          amount = Object.keys(selectedFeeCols).reduce((sum, colIdxStr) => {
            return sum + parseAmount(row[parseInt(colIdxStr, 10)])
          }, 0)
        }

        // Tự động quét các ô có giá trị số tiền nếu vẫn bằng 0
        if (amount === 0) {
          const rowNums = row
            .filter((cell, idx) => idx !== mapping.studentNameCol && idx !== mapping.noteCol && idx !== 0)
            .map(c => parseAmount(c))
            .filter(n => n > 1000)
          if (rowNums.length > 0) {
            amount = rowNums.reduce((a, b) => a + b, 0)
          }
        }

        if (amount > 0) {
          items.push({
            studentName,
            studentId,
            title: `${defaultTitle}: ${studentName}`,
            amount,
            type: 'thu',
            date: entryDate,
            category: defaultCategory,
            note: noteText
          })
        }
      } else {
        Object.entries(selectedFeeCols).forEach(([colIdxStr, feeName]) => {
          const colIdx = parseInt(colIdxStr, 10)
          const feeAmount = parseAmount(row[colIdx])
          if (feeAmount > 0) {
            items.push({
              studentName,
              studentId,
              title: `${feeName} (${defaultTitle}): ${studentName}`,
              amount: feeAmount,
              type: 'thu',
              date: entryDate,
              category: 'thu_dot',
              note: `${feeName} - ${noteText}`.trim()
            })
          }
        })
      }
    })

    if (items.length === 0) {
      setError('Không có dòng dữ liệu hợp lệ nào được tìm thấy. Vui lòng kiểm tra lại cấu hình ánh xạ cột.')
      return
    }

    setPreviewItems(items)
    setStep('preview')
  }

  const handleRemovePreviewItem = (index: number) => {
    setPreviewItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleConfirmImport = async () => {
    setLoading(true)
    setError('')
    try {
      await bulkImportFunds(previewItems)
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Lỗi khi import dữ liệu.')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount)
  }

  const totalImportAmount = previewItems.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Import Dữ Liệu Thu Quỹ Thông Minh
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hỗ trợ tự động đọc và ánh xạ cột từ file Excel (.xlsx) hoặc ảnh tài liệu chụp bảng thu tiền
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg transition text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-3 bg-blue-50/50 border-b border-blue-100/60 flex items-center gap-4 text-xs font-semibold">
          <div className={`flex items-center gap-1.5 ${step === 'upload' ? 'text-blue-700 font-bold' : 'text-slate-500'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center ${step === 'upload' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>1</span>
            Chọn file Excel / Ảnh
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
          <div className={`flex items-center gap-1.5 ${step === 'mapping' ? 'text-blue-700 font-bold' : 'text-slate-500'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center ${step === 'mapping' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>2</span>
            Ánh xạ cột thông tin
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
          <div className={`flex items-center gap-1.5 ${step === 'preview' ? 'text-blue-700 font-bold' : 'text-slate-500'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center ${step === 'preview' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>3</span>
            Kiểm tra & Cập nhật ({previewItems.length})
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'upload' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/30 flex flex-col items-center justify-center group"
                >
                  <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <FileSpreadsheet className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-base mb-1">Tải lên file Excel (.xlsx, .xls)</h4>
                  <p className="text-xs text-slate-500 max-w-xs mb-3">
                    Đọc toàn bộ các cột STT, Họ và tên, Tiền nộp, Ghi chú chuyển khoản...
                  </p>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-blue-600 rounded-lg text-xs font-semibold shadow-sm">
                    <Upload className="w-3.5 h-3.5" /> Chọn tệp Excel
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleExcelUpload}
                    className="hidden"
                  />
                </div>

                <div
                  onClick={() => imgInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-emerald-50/30 flex flex-col items-center justify-center group"
                >
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-base mb-1">Quét từ Ảnh / Tài liệu đính kèm</h4>
                  <p className="text-xs text-slate-500 max-w-xs mb-3">
                    Hỗ trợ quét ảnh chụp bảng biểu danh sách thu tiền, hóa đơn hoặc sổ tay (OCR)
                  </p>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-emerald-600 rounded-lg text-xs font-semibold shadow-sm">
                    <Upload className="w-3.5 h-3.5" /> Chọn ảnh tài liệu
                  </span>
                  <input
                    ref={imgInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {loading && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-center space-y-2 animate-pulse">
                  <div className="text-sm font-bold text-blue-700">{ocrProgress || 'Đang xử lý dữ liệu...'}</div>
                  <div className="text-xs text-blue-500">Vui lòng chờ trong giây lát...</div>
                </div>
              )}

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" /> Mẹo nhận diện dữ liệu nhanh và chuẩn xác:
                </div>
                <p>• Hệ thống tự động so khớp tên học sinh với danh sách 50 thành viên lớp 10A5.</p>
                <p>• Hỗ trợ nhận diện các từ viết tắt phổ biến: "Ng", "Tr", "V", "T" (VD: "Ng Văn Hoàng Bách").</p>
                <p>• Nhận diện số tiền có phân tách dấu chấm (VD: 1.718.000 đ) và ngày chuyển khoản tự động.</p>
              </div>
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-800">Cấu hình ánh xạ cột dữ liệu</h4>
                  <p className="text-xs text-slate-500">Tệp: <span className="font-medium text-slate-700">{fileName}</span> ({rawRows.length} dòng dữ liệu)</p>
                </div>
                <button
                  onClick={() => setStep('upload')}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Chọn lại file khác
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tên đợt thu / Nội dung</label>
                  <input
                    type="text"
                    value={defaultTitle}
                    onChange={(e) => setDefaultTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="VD: Thu tiền kỳ 1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày thu mặc định</label>
                  <input
                    type="date"
                    value={defaultDate}
                    onChange={(e) => setDefaultDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Danh mục thu</label>
                  <select
                    value={defaultCategory}
                    onChange={(e) => setDefaultCategory(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="thu_dot">Thu đợt quỹ</option>
                    <option value="tai_tro">Tài trợ / Quét mã</option>
                    <option value="khac">Khác</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cột Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={mapping.studentNameCol}
                    onChange={(e) => setMapping(prev => ({ ...prev, studentNameCol: parseInt(e.target.value, 10) }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-800"
                  >
                    <option value={-1}>-- Chọn cột --</option>
                    {rawHeaders.map((h, i) => (
                      <option key={i} value={i}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cột Tổng số tiền <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={mapping.amountCol}
                    onChange={(e) => setMapping(prev => ({ ...prev, amountCol: parseInt(e.target.value, 10) }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-800"
                  >
                    <option value={-1}>-- Chọn cột --</option>
                    {rawHeaders.map((h, i) => (
                      <option key={i} value={i}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cột Ngày thu (Tùy chọn)
                  </label>
                  <select
                    value={mapping.dateCol}
                    onChange={(e) => setMapping(prev => ({ ...prev, dateCol: parseInt(e.target.value, 10) }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value={-1}>-- Mặc định ({defaultDate}) --</option>
                    {rawHeaders.map((h, i) => (
                      <option key={i} value={i}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cột Ghi chú / CK (Tùy chọn)
                  </label>
                  <select
                    value={mapping.noteCol}
                    onChange={(e) => setMapping(prev => ({ ...prev, noteCol: parseInt(e.target.value, 10) }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value={-1}>-- Không có --</option>
                    {rawHeaders.map((h, i) => (
                      <option key={i} value={i}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Xem trước các dòng dữ liệu trích xuất:</div>
                <div className="border border-slate-200 rounded-xl overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                      <tr>
                        {rawHeaders.map((h, i) => (
                          <th key={i} className={`p-2.5 whitespace-nowrap ${i === mapping.studentNameCol ? 'bg-blue-100 text-blue-800 font-bold' : i === mapping.amountCol ? 'bg-emerald-100 text-emerald-800 font-bold' : ''}`}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rawRows.slice(0, 8).map((row, rIdx) => {
                        let rowAmt = mapping.amountCol !== -1 ? parseAmount(row[mapping.amountCol]) : 0
                        if (rowAmt === 0 && Object.keys(selectedFeeCols).length > 0) {
                          rowAmt = Object.keys(selectedFeeCols).reduce((sum, colIdxStr) => sum + parseAmount(row[parseInt(colIdxStr, 10)]), 0)
                        }
                        return (
                          <tr key={rIdx} className="hover:bg-slate-50">
                            {rawHeaders.map((_, cIdx) => {
                              const isAmount = cIdx === mapping.amountCol
                              const isName = cIdx === mapping.studentNameCol
                              let displayVal = String(row[cIdx] !== null && row[cIdx] !== undefined ? row[cIdx] : '')
                              if (isAmount && (!displayVal || displayVal === '0') && rowAmt > 0) {
                                displayVal = `${formatCurrency(rowAmt)} (tự tính)`
                              } else if (typeof row[cIdx] === 'number' && row[cIdx] > 1000) {
                                displayVal = formatCurrency(row[cIdx])
                              }
                              return (
                                <td key={cIdx} className={`p-2.5 whitespace-nowrap ${isName ? 'font-semibold text-blue-900 bg-blue-50/50' : isAmount ? 'font-bold text-emerald-700 bg-emerald-50/50' : 'text-slate-600'}`}>
                                  {displayVal}
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                <div>
                  <h4 className="font-bold text-emerald-900 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Đã trích xuất thành công {previewItems.length} giao dịch thu
                  </h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Hệ thống đã tự động ánh xạ thông tin học sinh và số tiền tương ứng.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-emerald-600 font-semibold block">Tổng tiền thu đợt này</span>
                  <span className="text-xl font-black text-emerald-700">{formatCurrency(totalImportAmount)} đ</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[360px] overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="p-3 text-center w-12">STT</th>
                      <th className="p-3">Họ và tên học sinh</th>
                      <th className="p-3">Nội dung thu</th>
                      <th className="p-3">Ngày thu</th>
                      <th className="p-3 text-right">Số tiền</th>
                      <th className="p-3">Ghi chú</th>
                      <th className="p-3 text-center w-12">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-center text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-semibold text-slate-800">
                          {item.studentName}
                          {item.studentId && (
                            <span className="ml-1.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-normal">
                              Khớp danh sách
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-600 truncate max-w-xs">{item.title}</td>
                        <td className="p-3 text-slate-500 whitespace-nowrap">{item.date}</td>
                        <td className="p-3 text-right font-bold text-emerald-600 whitespace-nowrap">
                          +{formatCurrency(item.amount)} đ
                        </td>
                        <td className="p-3 text-slate-500 truncate max-w-xs">{item.note || '-'}</td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemovePreviewItem(idx)}
                            className="text-slate-400 hover:text-red-600 p-1 rounded transition"
                            title="Xóa dòng này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div>
            {step === 'mapping' && (
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="px-4 py-2 text-slate-600 text-xs font-semibold hover:bg-slate-200 rounded-lg transition"
              >
                Quay lại
              </button>
            )}
            {step === 'preview' && (
              <button
                type="button"
                onClick={() => setStep('mapping')}
                className="px-4 py-2 text-slate-600 text-xs font-semibold hover:bg-slate-200 rounded-lg transition"
              >
                Chỉnh sửa ánh xạ cột
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 text-xs font-semibold hover:bg-slate-200 rounded-lg transition"
            >
              Hủy
            </button>

            {step === 'mapping' && (
              <button
                type="button"
                onClick={handleProceedToPreview}
                className="flex items-center gap-2 bg-blue-600 text-white text-xs font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm"
              >
                Tiếp tục xem trước ({rawRows.length} dòng) <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 'preview' && (
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={loading || previewItems.length === 0}
                className="flex items-center gap-2 bg-emerald-600 text-white text-xs font-semibold px-5 py-2.5 rounded-lg hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
              >
                {loading ? 'Đang lưu vào hệ thống...' : (
                  <>
                    <Check className="w-4 h-4" /> Xác nhận cập nhật ({previewItems.length} khoản thu)
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

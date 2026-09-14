'use client'

import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { Upload, FileSpreadsheet, Check, X, AlertTriangle } from 'lucide-react'
import { ScheduleItem } from './actions'

interface Props {
  weekStartDate: string
  onSuccess: () => void
}

export default function ImportExcelModal({ weekStartDate, onSuccess }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [previewData, setPreviewData] = useState<ScheduleItem[]>([])
  const [subjectList, setSubjectList] = useState<{ subject: string, teacher: string }[]>([])
  const [error, setError] = useState('')
  const [step, setStep] = useState(1) // 1: upload, 2: preview

  const getSubjectGroup = (subjectName: string): 'tu_nhien' | 'xa_hoi' | 'ngoai_ngu' | 'khac' => {
    const s = subjectName.toLowerCase()
    if (s.includes('toán') || s.includes('lý') || s.includes('hóa') || s.includes('sinh') || s.includes('tin')) return 'tu_nhien'
    if (s.includes('văn') || s.includes('sử') || s.includes('địa') || s.includes('gdcd') || s.includes('ktpl')) return 'xa_hoi'
    if (s.includes('anh') || s.includes('ngoại ngữ') || s.includes('cnnn')) return 'ngoai_ngu'
    return 'khac' // GDTC, GDQP, SHL, Chào cờ
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]

        let dayCols: Record<number, number> = {} // day_of_week -> colIndex
        const parsedItems: ScheduleItem[] = []

        // Find headers
        let headerRowIdx = -1
        for (let i = 0; i < data.length; i++) {
          const row = data[i]
          let foundDay = false
          for (let j = 0; j < row.length; j++) {
            const cellVal = String(row[j] || '').trim().toLowerCase()
            if (cellVal.includes('thứ 2') || cellVal === 'hai') { dayCols[2] = j; foundDay = true }
            else if (cellVal.includes('thứ 3') || cellVal === 'ba') dayCols[3] = j
            else if (cellVal.includes('thứ 4') || cellVal === 'tư') dayCols[4] = j
            else if (cellVal.includes('thứ 5') || cellVal === 'năm') dayCols[5] = j
            else if (cellVal.includes('thứ 6') || cellVal === 'sáu') dayCols[6] = j
            else if (cellVal.includes('thứ 7') || cellVal === 'bảy') dayCols[7] = j
          }
          if (foundDay) {
            headerRowIdx = i
            break
          }
        }

        if (headerRowIdx === -1) {
          throw new Error('Không tìm thấy dòng tiêu đề các Thứ (Thứ 2, Thứ 3...) trong file Excel.')
        }

        // Parse rows
        let currentSession = 'morning' // morning (1-5), afternoon (6-10)
        let morningCount = 0
        let afternoonCount = 0

        for (let i = headerRowIdx + 1; i < data.length; i++) {
          const row = data[i]
          if (!row || row.length === 0) continue
          
          const rowStr = row.map(c => String(c || '').toLowerCase()).join(' ')
          if (rowStr.includes('sáng')) currentSession = 'morning'
          if (rowStr.includes('chiều')) currentSession = 'afternoon'

          // Check if this row is a period row
          const isPeriodRow = row.some(c => {
            const str = String(c || '').toLowerCase()
            return str.includes('tiết 1') || str.includes('tiết 2') || str.includes('tiết 3') || str.includes('tiết 4') || str.includes('tiết 5')
          })

          if (isPeriodRow) {
            let actualPeriod = 1
            if (currentSession === 'morning') {
              morningCount++
              actualPeriod = morningCount
            } else {
              afternoonCount++
              actualPeriod = afternoonCount + 5 // 6-10
            }

            // Read cells for each day
            Object.entries(dayCols).forEach(([dayStr, colIdx]) => {
              const day = parseInt(dayStr)
              const cellVal = String(row[colIdx] || '').trim()
              if (cellVal) {
                // Split subject and teacher (e.g. "Văn CĐ - cô Hoa")
                const parts = cellVal.split('-')
                const subject = parts[0].trim()
                const teacher = parts.length > 1 ? parts.slice(1).join('-').trim() : ''
                const group = getSubjectGroup(subject)

                parsedItems.push({
                  day_of_week: day,
                  period: actualPeriod,
                  subject,
                  teacher,
                  subject_group: group,
                  isOverride: true
                })
              }
            })
          }
        }

        if (parsedItems.length === 0) {
          throw new Error('Không tìm thấy dữ liệu tiết học hợp lệ nào.')
        }

        setPreviewData(parsedItems)
        
        // Summarize subjects and teachers
        const map = new Map<string, string>()
        parsedItems.forEach(item => {
          if (item.teacher) {
            const key = `${item.subject}_${item.teacher}`
            map.set(key, JSON.stringify({ subject: item.subject, teacher: item.teacher }))
          }
        })
        setSubjectList(Array.from(map.values()).map(v => JSON.parse(v)))

        setStep(2)

      } catch (err: any) {
        setError(err.message || 'Lỗi đọc file Excel.')
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleSave = async () => {
    setLoading(true)
    setError('')
    try {
      const { bulkSaveWeeklyOverrides } = await import('./actions')
      await bulkSaveWeeklyOverrides(weekStartDate, previewData)
      setIsOpen(false)
      setStep(1)
      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition"
      >
        <FileSpreadsheet className="w-4 h-4" /> Nhập từ Excel
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg">Nhập Thời khóa biểu từ Excel</h3>
              <button onClick={() => { setIsOpen(false); setStep(1); setPreviewData([]) }} className="p-1 hover:bg-slate-200 rounded-lg transition text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              {error && (
                <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </div>
              )}

              {step === 1 ? (
                <div className="text-center py-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-800 mb-2">Tải lên file Excel (.xlsx)</h4>
                  <p className="text-slate-500 mb-6 max-w-md mx-auto text-sm">
                    File cần có các cột Thứ 2 đến Thứ 6. Ô dữ liệu nhập theo định dạng <b>Môn học - Giáo viên</b>.
                  </p>
                  <input 
                    type="file" 
                    accept=".xlsx, .xls"
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-sm transition"
                  >
                    Chọn file Excel
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <Check className="w-5 h-5 text-emerald-500" /> Nhận diện thành công {previewData.length} tiết học
                    </h4>
                    
                    <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-slate-600 font-medium">
                          <tr>
                            <th className="px-4 py-2 border-b">Thứ</th>
                            <th className="px-4 py-2 border-b">Tiết</th>
                            <th className="px-4 py-2 border-b">Môn học</th>
                            <th className="px-4 py-2 border-b">Giáo viên</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto block w-full table-fixed">
                          {previewData.slice(0, 50).map((item, i) => (
                            <tr key={i} className="hover:bg-slate-50 w-full table table-fixed">
                              <td className="px-4 py-2">Thứ {item.day_of_week}</td>
                              <td className="px-4 py-2">{item.period > 5 ? `Chiều - ${item.period - 5}` : `Sáng - ${item.period}`}</td>
                              <td className="px-4 py-2 font-medium">{item.subject}</td>
                              <td className="px-4 py-2">{item.teacher || '-'}</td>
                            </tr>
                          ))}
                          {previewData.length > 50 && (
                            <tr className="w-full table table-fixed">
                              <td colSpan={4} className="px-4 py-2 text-center text-slate-500 italic">
                                ... và {previewData.length - 50} tiết học khác
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3">Tổng hợp Giáo viên - Môn học</h4>
                    <div className="flex flex-wrap gap-2">
                      {subjectList.map((item, i) => (
                        <div key={i} className="px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-800 rounded-lg text-sm">
                          <span className="font-semibold">{item.teacher}</span> ({item.subject})
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {step === 2 && (
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
                <button 
                  disabled={loading}
                  onClick={() => { setStep(1); setPreviewData([]) }} 
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition"
                >
                  Nhập file khác
                </button>
                <button 
                  disabled={loading}
                  onClick={handleSave}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition flex items-center gap-2"
                >
                  {loading ? 'Đang lưu...' : 'Lưu đè vào Lịch Tuần này'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

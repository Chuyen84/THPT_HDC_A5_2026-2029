'use client'

import { useState, useEffect } from 'react'
import { X, Upload, File as FileIcon, Image as ImageIcon, Plus } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: any
  currentMaxVoucher: { thu: number, chi: number }
  isLocked: (dateStr: string) => boolean
}

export default function TransactionForm({ isOpen, onClose, onSuccess, initialData, currentMaxVoucher, isLocked }: Props) {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  
  const [type, setType] = useState<'thu' | 'chi'>('thu')
  const [category, setCategory] = useState('quy_dot_1')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0])
  const [voucherNumber, setVoucherNumber] = useState('')
  const [recipient, setRecipient] = useState('')
  const [note, setNote] = useState('')
  
  const [images, setImages] = useState<File[]>([])
  const [docs, setDocs] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialData) {
      setType(initialData.type)
      setCategory(initialData.category)
      setDescription(initialData.description)
      setAmount(initialData.amount.toString())
      setEntryDate(initialData.entry_date)
      setVoucherNumber(initialData.voucher_number || '')
      setRecipient(initialData.recipient_or_payer || '')
      setNote(initialData.note || '')
    } else {
      setType('thu')
      setCategory('quy_dot_1')
      setDescription('')
      setAmount('')
      setEntryDate(new Date().toISOString().split('T')[0])
      setRecipient('')
      setNote('')
      // Auto voucher
      const prefix = 'PT-'
      const nextNum = currentMaxVoucher.thu + 1
      setVoucherNumber(`${prefix}${nextNum.toString().padStart(3, '0')}`)
    }
    setImages([])
    setDocs([])
    setError('')
  }, [isOpen, initialData, currentMaxVoucher])

  const handleTypeChange = (newType: 'thu' | 'chi') => {
    setType(newType)
    if (!initialData) {
      const prefix = newType === 'thu' ? 'PT-' : 'PC-'
      const nextNum = (newType === 'thu' ? currentMaxVoucher.thu : currentMaxVoucher.chi) + 1
      setVoucherNumber(`${prefix}${nextNum.toString().padStart(3, '0')}`)
      setCategory(newType === 'thu' ? 'quy_dot_1' : 'an_uong')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (isLocked(entryDate)) {
      setError('Tháng này đã bị khóa sổ, không thể thêm/sửa giao dịch.')
      return
    }
    if (Number(amount) <= 0) {
      setError('Số tiền phải lớn hơn 0.')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const payload = {
        type,
        category,
        description,
        amount: Number(amount),
        entry_date: entryDate,
        voucher_number: voucherNumber,
        recipient_or_payer: recipient,
        note,
        created_by: user?.id,
        updated_by: user?.id
      }

      let txId = initialData?.id

      if (initialData) {
        const { error: txErr } = await supabase.from('fund_transactions').update(payload).eq('id', txId)
        if (txErr) throw txErr
      } else {
        const { data: tx, error: txErr } = await supabase.from('fund_transactions').insert(payload).select().single()
        if (txErr) throw txErr
        txId = tx.id
      }

      // Upload files
      const allFiles = [...images, ...docs]
      if (allFiles.length > 0 && txId) {
        for (const file of allFiles) {
          const fileExt = file.name.split('.').pop()
          const fileName = `${txId}/${Math.random().toString(36).substring(2)}.${fileExt}`
          
          const { error: uploadErr } = await supabase.storage.from('fund-attachments').upload(fileName, file)
          if (uploadErr) throw uploadErr

          const { data: urlData } = supabase.storage.from('fund-attachments').getPublicUrl(fileName)
          
          const fileType = images.includes(file) ? 'image' : 'document'
          await supabase.from('fund_attachments').insert({
            transaction_id: txId,
            file_url: urlData.publicUrl,
            file_name: file.name,
            file_type: fileType
          })
        }
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Có lỗi xảy ra khi lưu giao dịch.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-2xl sm:rounded-2xl h-[90vh] sm:h-auto max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95">
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">{initialData ? 'Sửa Giao Dịch' : 'Thêm Giao Dịch Mới'}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
          <form id="tx-form" onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}

            {/* Toggle Type */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
              <button type="button" onClick={() => handleTypeChange('thu')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${type === 'thu' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Khoản Thu</button>
              <button type="button" onClick={() => handleTypeChange('chi')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${type === 'chi' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Khoản Chi</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số chứng từ</label>
                <input value={voucherNumber} onChange={e => setVoucherNumber(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ngày tháng *</label>
                <input type="date" required value={entryDate} onChange={e => setEntryDate(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Khoản mục *</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                {type === 'thu' ? (
                  <>
                    <option value="quy_dot_1">Quỹ Đợt 1</option>
                    <option value="quy_dot_2">Quỹ Đợt 2</option>
                    <option value="tai_tro">Tài trợ / Ủng hộ</option>
                    <option value="khac">Khác</option>
                  </>
                ) : (
                  <>
                    <option value="an_uong">Ăn uống / Liên hoan</option>
                    <option value="in_an">In ấn tài liệu</option>
                    <option value="khen_thuong">Khen thưởng</option>
                    <option value="da_ngoai">Dã ngoại / Sự kiện</option>
                    <option value="qua_tang">Quà tặng (20/11, Lễ tết)</option>
                    <option value="khac">Khác</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nội dung *</label>
              <input required value={description} onChange={e => setDescription(e.target.value)} placeholder={type === 'thu' ? 'VD: Thu quỹ học kỳ 1' : 'VD: Mua bánh kẹo trung thu'} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số tiền (VNĐ) *</label>
                <input required type="number" min="1000" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold text-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{type === 'thu' ? 'Người nộp' : 'Người nhận'}</label>
                <input value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="VD: Phụ huynh em A" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Upload Images */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Hình ảnh minh chứng (Tối đa 6)</label>
              <div className="flex flex-wrap gap-2">
                {images.map((file, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 group">
                    <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setImages(images.filter((_, i) => i !== idx))} className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"><X className="w-3 h-3" /></button>
                  </div>
                ))}
                {images.length < 6 && (
                  <label className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-500 cursor-pointer transition-colors">
                    <input type="file" accept="image/*" multiple className="hidden" onChange={e => {
                      if (e.target.files) setImages(prev => [...prev, ...Array.from(e.target.files!)].slice(0, 6))
                    }} />
                    <Plus className="w-6 h-6" />
                  </label>
                )}
              </div>
            </div>

            {/* Upload Docs */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tài liệu đính kèm (PDF, Excel, Word)</label>
              <div className="space-y-2">
                {docs.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileIcon className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>
                    </div>
                    <button type="button" onClick={() => setDocs(docs.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                  </div>
                ))}
                <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium cursor-pointer w-fit transition-colors">
                  <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" multiple className="hidden" onChange={e => {
                    if (e.target.files) setDocs(prev => [...prev, ...Array.from(e.target.files!)])
                  }} />
                  <Upload className="w-4 h-4" /> Đính kèm tài liệu
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú thêm</label>
              <input value={note} onChange={e => setNote(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>

          </form>
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 sm:rounded-b-2xl">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-slate-200 rounded-xl transition-colors">Hủy</button>
          <button form="tx-form" type="submit" disabled={loading} className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
            Lưu giao dịch
          </button>
        </div>
      </div>
    </div>
  )
}

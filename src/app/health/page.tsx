import { createClient } from '@/utils/supabase/server'
import { CheckCircle2, XCircle, Database, Globe } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HealthPage() {
  let isConnected = false
  let errorMessage: string | null = null
  let tableTested = 'profiles'

  try {
    const supabase = await createClient()
    const { error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    if (error) {
      errorMessage = error.message
    } else {
      isConnected = true
    }
  } catch (err: any) {
    errorMessage = err?.message || 'Không thể kết nối đến Supabase'
  }

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
          <Database className="w-7 h-7 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-slate-800">Kiểm tra kết nối hệ thống (Health Check)</h1>
            <p className="text-xs text-slate-500">Xác thực kết nối giữa Vercel deployment và Supabase</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div
            className={`p-4 rounded-xl border flex items-start gap-3.5 ${
              isConnected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            {isConnected ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            )}
            <div>
              <h2 className="font-bold text-base">
                {isConnected ? 'Kết nối OK' : 'Kết nối thất bại'}
              </h2>
              <p className="text-xs mt-1 text-slate-600">
                {isConnected
                  ? `Đã truy vấn thử thành công bảng "${tableTested}". Ứng dụng đã sẵn sàng hoạt động!`
                  : `Lỗi kết nối: ${errorMessage || 'Không xác định'}. Vui lòng kiểm tra lại biến môi trường trên Vercel.`}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs space-y-2 text-slate-600">
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-500">Khu vực máy chủ (Region):</span>
              <span className="font-semibold text-slate-700">sin1 (Singapore)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-500">Cơ sở dữ liệu:</span>
              <span className="font-semibold text-slate-700">Supabase PostgreSQL</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-500">Thời gian kiểm tra:</span>
              <span>{new Date().toLocaleString('vi-VN')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

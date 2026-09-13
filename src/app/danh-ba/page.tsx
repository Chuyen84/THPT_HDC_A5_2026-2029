import { createClient } from '@/utils/supabase/server'
import DirectoryList from './DirectoryList'

export default async function DanhBaPage() {
  const supabase = await createClient()
  
  // Fetch profiles that are active
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('status', 'active')
    .order('full_name', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-slate-800">Danh bạ lớp 10A5</h1>
        <p className="text-xs text-slate-500 mt-1">Thông tin liên hệ Giáo viên chủ nhiệm, Ban phụ huynh và Học sinh</p>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-sm">
          Lỗi khi tải danh bạ: {error.message}
        </div>
      )}

      <DirectoryList profiles={profiles || []} />
    </div>
  )
}

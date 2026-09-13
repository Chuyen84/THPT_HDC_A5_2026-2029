import { createClient } from '@/utils/supabase/server'

export default async function DanhBaPage() {
  const supabase = await createClient()
  
  // Fetch profiles that are active
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('status', 'active')
    .order('role', { ascending: true }) // Assuming admin/gvcn will be at top, then hoc_sinh

  // Mapping roles for display
  const roleDisplay: Record<string, string> = {
    'admin': 'Quản trị viên',
    'gvcn': 'Giáo viên chủ nhiệm',
    'phu_huynh': 'Phụ huynh',
    'hoc_sinh': 'Học sinh'
  }

  // Color mapping based on roles
  const roleColor: Record<string, string> = {
    'admin': 'bg-red-100 text-red-700',
    'gvcn': 'bg-blue-100 text-blue-700',
    'phu_huynh': 'bg-orange-100 text-orange-700',
    'hoc_sinh': 'bg-green-100 text-green-700'
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 border-b pb-4">Danh bạ lớp 10A5</h1>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          Lỗi khi tải danh bạ: {error.message}
        </div>
      )}

      {!profiles || profiles.length === 0 ? (
        <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-xl">
          Chưa có thành viên nào trong danh bạ.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profiles.map((profile) => (
            <div key={profile.id} className="flex items-center gap-4 p-4 border border-slate-100 rounded-xl hover:shadow-md transition">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${roleColor[profile.role] || 'bg-slate-100 text-slate-700'}`}>
                {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : '?'}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800">{profile.full_name || 'Người dùng ẩn danh'}</h3>
                <div className="flex gap-2 items-center mt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${roleColor[profile.role] || 'bg-slate-100 text-slate-700'}`}>
                    {roleDisplay[profile.role] || profile.role}
                  </span>
                  <span className="text-xs text-slate-500 truncate max-w-[150px]">
                    {profile.email}
                  </span>
                </div>
              </div>
              
              {/* Optional: Call or message button */}
              {profile.phone_number && (
                <a href={`tel:${profile.phone_number}`} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-green-100 text-slate-600 hover:text-green-600 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { createClient } from '@/utils/supabase/server'
import SurveyList from './SurveyList'

export default async function KhaoSatPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  let canManage = false

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role === 'admin' || profile?.role === 'gvcn') {
      canManage = true
    }
  }

  const { data: surveys } = await supabase
    .from('surveys')
    .select('*, profiles(full_name), survey_options(*)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-slate-800">Khảo sát & Bình chọn</h1>
        <p className="text-xs text-slate-500 mt-1">Lấy ý kiến tập thể lớp về các hoạt động, kế hoạch chung</p>
      </div>

      <SurveyList
        surveys={surveys || []}
        canManage={canManage}
        isLoggedIn={!!user}
      />
    </div>
  )
}

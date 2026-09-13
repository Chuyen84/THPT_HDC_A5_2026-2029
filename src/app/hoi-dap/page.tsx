import { createClient } from '@/utils/supabase/server'
import QuestionList from './QuestionList'

export default async function HoiDapPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  let canManageAll = false

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role === 'admin' || profile?.role === 'gvcn') {
      canManageAll = true
    }
  }

  const { data: questions } = await supabase
    .from('questions')
    .select('*, profiles(full_name, role)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-slate-800">Hỏi đáp & Trao đổi</h1>
        <p className="text-xs text-slate-500 mt-1">Góc thảo luận, thắc mắc bài tập và trao đổi giữa học sinh, phụ huynh và giáo viên</p>
      </div>

      <QuestionList
        questions={questions || []}
        currentUserId={user?.id}
        canManageAll={canManageAll}
      />
    </div>
  )
}

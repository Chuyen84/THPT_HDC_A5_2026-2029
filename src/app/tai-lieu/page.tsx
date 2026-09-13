import { createClient } from '@/utils/supabase/server'
import DocumentManager from './DocumentManager'

export default async function TaiLieuPage() {
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

  const { data: documents } = await supabase
    .from('documents')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-slate-800">Kho tài liệu học tập</h1>
        <p className="text-xs text-slate-500 mt-1">Đề cương, bài giảng, đề thi tham khảo dành cho học sinh lớp 10A5</p>
      </div>

      <DocumentManager
        documents={documents || []}
        currentUserId={user?.id}
        canManageAll={canManageAll}
      />
    </div>
  )
}

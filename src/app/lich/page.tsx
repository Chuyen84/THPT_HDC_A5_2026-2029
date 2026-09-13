import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import EventList from './EventList'

export default async function LichPage() {
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
  
  const { data: events } = await supabase
    .from('events')
    .select('*, profiles(full_name)')
    .order('event_date', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Lịch học & Sự kiện</h1>
          <p className="text-xs text-slate-500 mt-1">Lịch thi cử, hoạt động ngoại khóa và sự kiện chung của lớp</p>
        </div>
        {canManage && (
          <Link href="/lich/tao-moi" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium shadow-sm">
            + Thêm sự kiện
          </Link>
        )}
      </div>
      
      <EventList events={events || []} canManage={canManage} />
    </div>
  )
}

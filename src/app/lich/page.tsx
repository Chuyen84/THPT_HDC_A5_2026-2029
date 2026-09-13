import { Calendar } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function LichPage() {
  const supabase = await createClient()
  
  const { data: events } = await supabase
    .from('events')
    .select('*, profiles(full_name)')
    .order('event_date', { ascending: true })
    .gte('event_date', new Date().toISOString())

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-2xl font-bold text-slate-800">Lịch học & Sự kiện</h1>
        <Link href="/lich/tao-moi" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm font-medium">
          + Thêm sự kiện
        </Link>
      </div>
      
      <div className="space-y-4">
        {!events || events.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p>Chưa có sự kiện nào sắp tới.</p>
          </div>
        ) : (
          events.map(event => (
            <div key={event.id} className="flex gap-4 p-4 border border-slate-100 rounded-xl bg-white shadow-sm">
              <div className="flex flex-col items-center justify-center bg-blue-50 text-blue-700 w-16 h-16 rounded-xl shrink-0">
                <span className="text-xs font-medium uppercase">{new Date(event.event_date).toLocaleDateString('vi-VN', { month: 'short' })}</span>
                <span className="text-2xl font-bold leading-none">{new Date(event.event_date).getDate()}</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{event.title}</h3>
                <p className="text-slate-600 text-sm mt-1">{event.description}</p>
                <div className="text-xs text-slate-400 mt-2">Tạo bởi: {event.profiles?.full_name}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

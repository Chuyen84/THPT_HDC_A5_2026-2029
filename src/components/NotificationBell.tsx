'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, Clock, ShieldAlert, BookOpen, DollarSign, List } from 'lucide-react'
import * as Popover from '@radix-ui/react-popover'
import * as Tabs from '@radix-ui/react-tabs'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

dayjs.extend(relativeTime)
dayjs.locale('vi')

export default function NotificationBell({ user }: { user: any }) {
  const [open, setOpen] = useState(false)
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [reads, setReads] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (!user) return
    const fetchAnns = async () => {
      const { data: anns } = await supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(20)
      const { data: readData } = await supabase.from('announcement_reads').select('announcement_id').eq('user_id', user.id)
      
      const readMap: Record<string, boolean> = {}
      readData?.forEach(r => { readMap[r.announcement_id] = true })
      
      setAnnouncements(anns || [])
      setReads(readMap)
      setLoading(false)
    }
    fetchAnns()
  }, [user, open]) // re-fetch when opened just in case

  const handleMarkAsRead = async (annId: string) => {
    if (!reads[annId]) {
      setReads(prev => ({ ...prev, [annId]: true }))
      await supabase.from('announcement_reads').insert({ user_id: user.id, announcement_id: annId })
    }
  }

  const handleMarkAll = async () => {
    const unreadIds = announcements.filter(a => !reads[a.id]).map(a => a.id)
    if (unreadIds.length === 0) return
    
    const newReads = { ...reads }
    const inserts = unreadIds.map(id => {
      newReads[id] = true
      return { user_id: user.id, announcement_id: id }
    })
    
    setReads(newReads)
    await supabase.from('announcement_reads').insert(inserts)
  }

  const unreadCount = announcements.filter(a => !reads[a.id]).length

  const getIcon = (cat: string) => {
    switch(cat) {
      case 'khan_cap': return <ShieldAlert className="w-4 h-4 text-red-500" />
      case 'hoc_tap': return <BookOpen className="w-4 h-4 text-blue-500" />
      case 'quy_lop': return <DollarSign className="w-4 h-4 text-emerald-500" />
      default: return <List className="w-4 h-4 text-slate-500" />
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
          )}
        </button>
      </Popover.Trigger>
      
      <Popover.Portal>
        <Popover.Content className="z-50 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 mr-4 sm:mr-6 animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95" sideOffset={8}>
          
          <Tabs.Root defaultValue="all" className="flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 dark:text-white">Thông báo</h3>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAll} className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
                    Đánh dấu đã đọc hết
                  </button>
                )}
              </div>
              
              <Tabs.List className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                <Tabs.Trigger value="all" className="px-3 py-1.5 text-xs font-semibold rounded-full data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=inactive]:bg-slate-100 data-[state=inactive]:text-slate-600 dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900 dark:data-[state=inactive]:bg-slate-800 dark:data-[state=inactive]:text-slate-400 whitespace-nowrap transition-colors">Tất cả</Tabs.Trigger>
                <Tabs.Trigger value="khan_cap" className="px-3 py-1.5 text-xs font-semibold rounded-full data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=inactive]:bg-red-50 data-[state=inactive]:text-red-600 dark:data-[state=inactive]:bg-red-950/50 whitespace-nowrap transition-colors">Khẩn cấp</Tabs.Trigger>
                <Tabs.Trigger value="hoc_tap" className="px-3 py-1.5 text-xs font-semibold rounded-full data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:bg-blue-50 data-[state=inactive]:text-blue-600 dark:data-[state=inactive]:bg-blue-950/50 whitespace-nowrap transition-colors">Học tập</Tabs.Trigger>
                <Tabs.Trigger value="quy_lop" className="px-3 py-1.5 text-xs font-semibold rounded-full data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=inactive]:bg-emerald-50 data-[state=inactive]:text-emerald-600 dark:data-[state=inactive]:bg-emerald-950/50 whitespace-nowrap transition-colors">Quỹ lớp</Tabs.Trigger>
              </Tabs.List>
            </div>

            <div className="flex-1 overflow-y-auto">
              {['all', 'khan_cap', 'hoc_tap', 'quy_lop'].map(tab => (
                <Tabs.Content key={tab} value={tab} className="p-0 m-0">
                  <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {announcements.filter(a => tab === 'all' || a.category === tab).length === 0 ? (
                      <div className="p-8 text-center text-sm text-slate-400">Không có thông báo nào</div>
                    ) : (
                      announcements.filter(a => tab === 'all' || a.category === tab).map(ann => {
                        const isRead = reads[ann.id]
                        return (
                          <div 
                            key={ann.id} 
                            onClick={() => handleMarkAsRead(ann.id)}
                            className={`p-4 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${isRead ? 'opacity-60' : ''}`}
                          >
                            <div className="mt-1 shrink-0 bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                              {getIcon(ann.category || 'chung')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-1 line-clamp-2 pr-4 relative">
                                {ann.title}
                                {!isRead && <span className="absolute right-0 top-1.5 w-2 h-2 bg-blue-500 rounded-full"></span>}
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">{ann.content}</p>
                              <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {dayjs(ann.created_at).fromNow()}
                              </span>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </Tabs.Content>
              ))}
            </div>
            
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl text-center">
              <Link href="/thong-bao" onClick={() => setOpen(false)} className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline">
                Xem tất cả thông báo
              </Link>
            </div>
          </Tabs.Root>
          
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

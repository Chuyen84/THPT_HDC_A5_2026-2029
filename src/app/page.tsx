'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Bell, Calendar, DollarSign, Activity, ChevronRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import Link from 'next/link'

dayjs.extend(relativeTime)
dayjs.locale('vi')

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(3) // Mock
  const [metrics, setMetrics] = useState({
    balance: 0,
    newAnnouncements: 0,
    upcomingEvents: 0,
    readRate: 85 // Mocked since announcement_reads table is missing
  })
  
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [chartData, setChartData] = useState<any[]>([])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        // 1. Fetch Funds for Balance & Chart
        const { data: funds } = await supabase.from('funds').select('amount, type, created_at')
        let total = 0
        const monthlyData: Record<string, number> = {}
        
        if (funds) {
          funds.forEach(f => {
            const isThu = f.type === 'thu'
            const amount = Number(f.amount)
            total += isThu ? amount : -amount
            
            const monthStr = dayjs(f.created_at).format('MM/YYYY')
            if (!monthlyData[monthStr]) monthlyData[monthStr] = 0
            monthlyData[monthStr] += isThu ? amount : -amount
          })
        }
        
        // Format chart data (last 4 months)
        const formattedChart = Object.keys(monthlyData)
          .sort((a, b) => dayjs(a, 'MM/YYYY').unix() - dayjs(b, 'MM/YYYY').unix())
          .slice(-4)
          .map(k => ({
            name: k,
            value: monthlyData[k]
          }))

        // 2. Fetch Announcements (Last 7 days count & Recent 3)
        const sevenDaysAgo = dayjs().subtract(7, 'day').toISOString()
        const { data: recentAnns } = await supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)
          
        const newAnnsCount = recentAnns?.filter(a => dayjs(a.created_at).isAfter(sevenDaysAgo)).length || 0

        // 3. Fetch Events (Next 7 days count & Recent 2)
        const now = new Date().toISOString()
        const next7Days = dayjs().add(7, 'day').toISOString()
        const { data: upEvents } = await supabase
          .from('events')
          .select('*')
          .gte('event_date', now)
          .order('event_date', { ascending: true })
        
        const next7EventsCount = upEvents?.filter(e => dayjs(e.event_date).isBefore(next7Days)).length || 0

        setMetrics({
          balance: total,
          newAnnouncements: newAnnsCount,
          upcomingEvents: next7EventsCount,
          readRate: 85 // Mocked
        })
        setChartData(formattedChart)
        setAnnouncements(recentAnns?.slice(0, 3) || [])
        setEvents(upEvents?.slice(0, 2) || [])

      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)

  const getCategoryStyle = (announcement: any) => {
    // Giả lập phân loại category vì schema chưa có cột category
    if (announcement.is_important) return 'bg-[#DC2626]' // danger
    if (announcement.title.toLowerCase().includes('quỹ') || announcement.title.toLowerCase().includes('tiền')) return 'bg-[#16A34A]' // success
    return 'bg-[#1E40AF]' // primary
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-slate-200 rounded-2xl w-full"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 rounded-2xl"></div>
          <div className="h-64 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* 1. Header */}
      <div className="flex items-center justify-between bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg hidden sm:flex">
            10A5
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Xin chào, Ban phụ huynh lớp 10A5</h1>
            <p className="text-sm text-slate-500">Tổng quan tình hình lớp học hôm nay</p>
          </div>
        </div>
        <div className="relative cursor-pointer hover:bg-slate-50 p-2 rounded-full transition">
          <Bell className="w-7 h-7 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1.5 w-3 h-3 bg-[#DC2626] rounded-full border-2 border-white"></span>
          )}
        </div>
      </div>

      {/* 2. Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Số dư quỹ lớp */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-green-50 text-[#16A34A] rounded-xl"><DollarSign className="w-5 h-5" /></div>
            <h3 className="text-sm font-semibold text-slate-600">Số dư quỹ lớp</h3>
          </div>
          <div className="text-xl md:text-2xl font-bold text-slate-800">{formatCurrency(metrics.balance)}</div>
        </div>

        {/* Thông báo mới */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-blue-50 text-[#1E40AF] rounded-xl"><Bell className="w-5 h-5" /></div>
            <h3 className="text-sm font-semibold text-slate-600">Thông báo mới (7 ngày)</h3>
          </div>
          <div className="text-xl md:text-2xl font-bold text-slate-800">{metrics.newAnnouncements} <span className="text-sm font-normal text-slate-500">tin</span></div>
        </div>

        {/* Sự kiện sắp tới */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-amber-50 text-[#F59E0B] rounded-xl"><Calendar className="w-5 h-5" /></div>
            <h3 className="text-sm font-semibold text-slate-600">Sự kiện (7 ngày tới)</h3>
          </div>
          <div className="text-xl md:text-2xl font-bold text-slate-800">{metrics.upcomingEvents} <span className="text-sm font-normal text-slate-500">sự kiện</span></div>
        </div>

        {/* Tỷ lệ đã đọc */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><Activity className="w-5 h-5" /></div>
            <h3 className="text-sm font-semibold text-slate-600">Tỷ lệ xem thông báo</h3>
          </div>
          <div className="flex items-end gap-2">
            <div className="text-xl md:text-2xl font-bold text-slate-800">{metrics.readRate}%</div>
            <div className="text-xs text-[#16A34A] font-medium mb-1">+5% so với tuần trước</div>
          </div>
        </div>
      </div>

      {/* 3. Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Cột Trái: Thông báo gần đây */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800">Thông báo gần đây</h2>
            <Link href="/thong-bao" className="text-sm font-medium text-[#1E40AF] hover:underline flex items-center">
              Xem tất cả <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {announcements.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">Chưa có thông báo nào</div>
            ) : (
              announcements.map(ann => (
                <Link href="/thong-bao" key={ann.id} className="block group">
                  <div className="relative pl-4 border-l-4 border-transparent hover:bg-slate-50 p-3 rounded-r-xl transition-colors" style={{ borderLeftColor: getCategoryStyle(ann).replace('bg-[', '').replace(']', '') }}>
                    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-md ${getCategoryStyle(ann)}`} />
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-slate-800 group-hover:text-[#1E40AF] transition-colors line-clamp-1 pr-4">{ann.title}</h3>
                      <span className="text-xs text-slate-400 whitespace-nowrap shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {dayjs(ann.created_at).fromNow()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-1">{ann.content}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Cột Phải: Sự kiện & Chart */}
        <div className="space-y-6">
          
          {/* Sự kiện sắp tới */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">Sự kiện sắp tới</h2>
              <Link href="/lich" className="text-sm font-medium text-[#1E40AF] hover:underline flex items-center">
                Xem lịch <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {events.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-sm">Chưa có sự kiện nào</div>
              ) : (
                events.map(ev => {
                  const d = dayjs(ev.event_date)
                  return (
                    <div key={ev.id} className="flex gap-4 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex flex-col items-center justify-center bg-white text-[#F59E0B] w-14 h-14 rounded-xl shrink-0 shadow-sm border border-amber-100">
                        <span className="text-[10px] font-bold uppercase">{d.format('MMM')}</span>
                        <span className="text-lg font-black leading-none">{d.format('DD')}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-800 text-sm truncate">{ev.title}</h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {d.format('HH:mm')}</span>
                          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" /> {Math.floor(Math.random() * 30 + 10)} đã ĐK</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Biểu đồ Quỹ */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-6">Thống kê Quỹ (4 tháng)</h2>
            <div className="h-48 w-full">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">Chưa có dữ liệu giao dịch</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(Math.abs(value))}
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.value >= 0 ? '#16A34A' : '#DC2626'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}

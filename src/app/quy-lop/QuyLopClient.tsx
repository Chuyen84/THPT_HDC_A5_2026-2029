'use client'

import { useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { Wallet, ArrowDownCircle, ArrowUpCircle, FileText, CheckCircle2, AlertCircle, Plus } from 'lucide-react'
import dayjs from 'dayjs'
import Link from 'next/link'

interface Props {
  canManage: boolean
  totalThu: number
  totalChi: number
  currentDue: any
  paidStudents: number
  totalStudents: number
  thuTransactions: any[]
  chiTransactions: any[]
  chiCategoryTotals: { category: string, total: number }[]
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

export default function QuyLopClient({
  canManage, totalThu, totalChi, currentDue, paidStudents, totalStudents,
  thuTransactions, chiTransactions, chiCategoryTotals
}: Props) {
  const balance = totalThu - totalChi
  const progressPercent = totalStudents > 0 ? Math.round((paidStudents / totalStudents) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Quỹ Lớp</h1>
          <p className="text-sm text-slate-500">Thu chi minh bạch, rõ ràng</p>
        </div>
        {canManage && (
          <Link href="/quy-lop/tao-moi" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition text-sm font-semibold shadow-sm">
            <Plus className="w-4 h-4" /> Thêm khoản Thu / Chi
          </Link>
        )}
      </div>

      <Tabs.Root defaultValue="tong_quan" className="flex flex-col">
        <Tabs.List className="flex gap-2 overflow-x-auto pb-4 scrollbar-none border-b border-slate-200 mb-6">
          <Tabs.Trigger value="tong_quan" className="px-5 py-2.5 text-sm font-semibold rounded-t-xl data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:border-t-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-sm data-[state=inactive]:text-slate-500 hover:data-[state=inactive]:bg-slate-100 transition-all border-b-0 border-t-2 border-transparent">
            Tổng quan
          </Tabs.Trigger>
          <Tabs.Trigger value="thu" className="px-5 py-2.5 text-sm font-semibold rounded-t-xl data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:border-t-2 data-[state=active]:border-emerald-600 data-[state=active]:shadow-sm data-[state=inactive]:text-slate-500 hover:data-[state=inactive]:bg-slate-100 transition-all border-b-0 border-t-2 border-transparent">
            Quản lý Thu
          </Tabs.Trigger>
          <Tabs.Trigger value="chi" className="px-5 py-2.5 text-sm font-semibold rounded-t-xl data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:border-t-2 data-[state=active]:border-amber-600 data-[state=active]:shadow-sm data-[state=inactive]:text-slate-500 hover:data-[state=inactive]:bg-slate-100 transition-all border-b-0 border-t-2 border-transparent">
            Quản lý Chi
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="tong_quan" className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><ArrowDownCircle className="w-6 h-6" /></div>
                <h3 className="font-bold text-slate-600">Tổng đã thu</h3>
              </div>
              <div className="text-3xl font-bold text-slate-800">{formatCurrency(totalThu)}</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><ArrowUpCircle className="w-6 h-6" /></div>
                <h3 className="font-bold text-slate-600">Tổng đã chi</h3>
              </div>
              <div className="text-3xl font-bold text-slate-800">{formatCurrency(totalChi)}</div>
            </div>
            <div className="bg-blue-600 p-6 rounded-2xl shadow-md text-white">
              <div className="flex items-center gap-3 mb-4 opacity-90">
                <div className="p-3 bg-white/20 rounded-xl"><Wallet className="w-6 h-6" /></div>
                <h3 className="font-bold">Số dư quỹ</h3>
              </div>
              <div className="text-3xl font-bold">{formatCurrency(balance)}</div>
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="thu" className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Tổng thu năm học</h3>
              <div className="text-4xl font-black text-emerald-600">{formatCurrency(totalThu)}</div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Đợt đang thu</h3>
                  <div className="text-xl font-bold text-slate-800">{currentDue?.title || 'Không có đợt thu nào'}</div>
                </div>
                {currentDue && <div className="text-lg font-bold text-blue-600">{formatCurrency(currentDue.amount_per_student)}/HS</div>}
              </div>
              
              {currentDue && (
                <div>
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="text-slate-600">Tiến độ đóng tiền</span>
                    <span className="text-emerald-600">{paidStudents} / {totalStudents} HS</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800">Lịch sử thu tiền</h3>
            </div>
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {thuTransactions.length === 0 ? (
                <div className="p-8 text-center text-slate-500">Chưa có giao dịch thu nào</div>
              ) : (
                thuTransactions.map(tx => (
                  <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-full shrink-0">
                        <ArrowDownCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{tx.students?.full_name || tx.description}</h4>
                        <div className="text-sm text-slate-500 mt-0.5">{tx.fund_dues?.title || tx.category} &bull; {dayjs(tx.date).format('DD/MM/YYYY')}</div>
                      </div>
                    </div>
                    <div className="font-bold text-emerald-600 text-lg text-right">
                      +{formatCurrency(tx.amount)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="chi" className="space-y-6 animate-in fade-in">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Tổng chi năm học</h3>
            <div className="text-4xl font-black text-amber-600 mb-6">{formatCurrency(totalChi)}</div>
            
            {totalChi > 0 && (
              <div className="space-y-3">
                <div className="w-full h-4 flex rounded-full overflow-hidden">
                  {chiCategoryTotals.map((cat, i) => {
                    const pct = (cat.total / totalChi) * 100
                    const colors = ['bg-blue-500', 'bg-amber-500', 'bg-purple-500', 'bg-emerald-500', 'bg-rose-500']
                    return <div key={cat.category} style={{ width: `${pct}%` }} className={`${colors[i % colors.length]} h-full`} title={`${cat.category}: ${formatCurrency(cat.total)}`}></div>
                  })}
                </div>
                <div className="flex flex-wrap gap-4 mt-3">
                  {chiCategoryTotals.map((cat, i) => {
                    const colors = ['text-blue-500', 'text-amber-500', 'text-purple-500', 'text-emerald-500', 'text-rose-500']
                    const bgColors = ['bg-blue-500', 'bg-amber-500', 'bg-purple-500', 'bg-emerald-500', 'bg-rose-500']
                    return (
                      <div key={cat.category} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <span className={`w-3 h-3 rounded-full ${bgColors[i % bgColors.length]}`}></span>
                        {cat.category === 'an_uong' ? 'Ăn uống' : cat.category === 'in_an' ? 'In ấn tài liệu' : cat.category === 'khen_thuong' ? 'Khen thưởng' : 'Khác'} 
                        <span className="text-slate-400 font-normal">({Math.round((cat.total / totalChi) * 100)}%)</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800">Lịch sử chi tiền</h3>
            </div>
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {chiTransactions.length === 0 ? (
                <div className="p-8 text-center text-slate-500">Chưa có giao dịch chi nào</div>
              ) : (
                chiTransactions.map(tx => (
                  <div key={tx.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 bg-slate-100 text-slate-500 rounded-full shrink-0 mt-1">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 line-clamp-2">{tx.description}</h4>
                        <div className="text-sm text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-semibold uppercase">{tx.category}</span>
                          <span>&bull;</span>
                          <span>{dayjs(tx.date).format('DD/MM/YYYY')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between shrink-0">
                      <div className="font-bold text-amber-600 text-lg">
                        -{formatCurrency(tx.amount)}
                      </div>
                      {tx.has_invoice ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 mt-1"><CheckCircle2 className="w-3.5 h-3.5" /> Có hóa đơn</span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-medium text-amber-600 mt-1"><AlertCircle className="w-3.5 h-3.5" /> Thiếu hóa đơn</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Check, X, Shield, Search, UserCheck, Clock, UserX } from 'lucide-react'
import { updateMemberStatus, updateMemberRole } from './actions'

interface Profile {
  id: string
  email: string
  full_name: string | null
  phone_number: string | null
  role: string
  status: string
  created_at: string
}

export default function MemberManagement({ profiles }: { profiles: Profile[] }) {
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'all' | 'pending' | 'active'>('all')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const roleDisplay: Record<string, string> = {
    admin: 'Quản trị viên',
    gvcn: 'GV Chủ nhiệm',
    phu_huynh: 'Phụ huynh',
    hoc_sinh: 'Học sinh',
  }

  const filtered = profiles.filter((p) => {
    const matchSearch =
      (p.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
    const matchTab = tab === 'all' || p.status === tab
    return matchSearch && matchTab
  })

  const handleStatusChange = async (id: string, status: 'active' | 'rejected') => {
    try {
      setLoadingId(id)
      await updateMemberStatus(id, status)
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Không thể cập nhật'))
    } finally {
      setLoadingId(null)
    }
  }

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      setLoadingId(id)
      await updateMemberRole(id, newRole)
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Không thể cập nhật vai trò'))
    } finally {
      setLoadingId(null)
    }
  }

  const pendingCount = profiles.filter((p) => p.status === 'pending').length

  return (
    <div className="space-y-4">
      {/* Header filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, email..."
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto text-xs">
          <button
            onClick={() => setTab('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              tab === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Tất cả ({profiles.length})
          </button>
          <button
            onClick={() => setTab('pending')}
            className={`relative px-3 py-1.5 rounded-lg font-medium transition ${
              tab === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
            }`}
          >
            Chờ duyệt ({pendingCount})
          </button>
          <button
            onClick={() => setTab('active')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              tab === 'active'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Đã duyệt
          </button>
        </div>
      </div>

      {/* Table list */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
            <tr>
              <th className="p-3.5 font-medium">Thành viên</th>
              <th className="p-3.5 font-medium">Vai trò</th>
              <th className="p-3.5 font-medium">Trạng thái</th>
              <th className="p-3.5 font-medium">Ngày đăng ký</th>
              <th className="p-3.5 font-medium text-right">Phê duyệt / Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  Không có thành viên nào trong danh sách.
                </td>
              </tr>
            ) : (
              filtered.map((user) => {
                const isPending = user.status === 'pending'
                const isActive = user.status === 'active'

                return (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800">
                        {user.full_name || 'Chưa đặt tên'}
                      </div>
                      <div className="text-xs text-slate-400">{user.email}</div>
                    </td>

                    <td className="p-3.5">
                      <select
                        value={user.role}
                        disabled={loadingId === user.id}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="text-xs font-medium px-2.5 py-1 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="hoc_sinh">Học sinh</option>
                        <option value="phu_huynh">Phụ huynh</option>
                        <option value="gvcn">GVCN</option>
                        <option value="admin">Quản trị viên</option>
                      </select>
                    </td>

                    <td className="p-3.5">
                      {isPending && (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" /> Chờ duyệt
                        </span>
                      )}
                      {isActive && (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <UserCheck className="w-3 h-3" /> Hoạt động
                        </span>
                      )}
                      {user.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-red-50 text-red-700 border border-red-200">
                          <UserX className="w-3 h-3" /> Từ chối
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(user.created_at).toLocaleDateString('vi-VN')}
                    </td>

                    <td className="p-3.5 text-right whitespace-nowrap">
                      {isPending ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleStatusChange(user.id, 'active')}
                            disabled={loadingId === user.id}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition"
                          >
                            <Check className="w-3.5 h-3.5" /> Duyệt
                          </button>
                          <button
                            onClick={() => handleStatusChange(user.id, 'rejected')}
                            disabled={loadingId === user.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-medium transition"
                          >
                            <X className="w-3.5 h-3.5" /> Từ chối
                          </button>
                        </div>
                      ) : isActive ? (
                        <button
                          onClick={() => handleStatusChange(user.id, 'rejected')}
                          disabled={loadingId === user.id}
                          className="text-xs text-slate-400 hover:text-red-600 transition"
                        >
                          Khóa tài khoản
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(user.id, 'active')}
                          disabled={loadingId === user.id}
                          className="text-xs text-blue-600 hover:underline transition"
                        >
                          Kích hoạt lại
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

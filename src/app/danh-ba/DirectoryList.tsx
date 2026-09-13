'use client'

import { useState } from 'react'
import { Search, Phone, Mail, UserCheck, Shield, GraduationCap, Users } from 'lucide-react'

interface Profile {
  id: string
  email: string
  full_name: string | null
  phone_number: string | null
  role: string
  status: string
}

export default function DirectoryList({ profiles }: { profiles: Profile[] }) {
  const [search, setSearch] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')

  const roleDisplay: Record<string, string> = {
    admin: 'Quản trị viên',
    gvcn: 'GV Chủ nhiệm',
    phu_huynh: 'Phụ huynh',
    hoc_sinh: 'Học sinh',
  }

  const roleColor: Record<string, string> = {
    admin: 'bg-red-50 text-red-700 border-red-200',
    gvcn: 'bg-blue-50 text-blue-700 border-blue-200',
    phu_huynh: 'bg-orange-50 text-orange-700 border-orange-200',
    hoc_sinh: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }

  const roleAvatarColor: Record<string, string> = {
    admin: 'bg-red-100 text-red-700',
    gvcn: 'bg-blue-100 text-blue-700',
    phu_huynh: 'bg-orange-100 text-orange-700',
    hoc_sinh: 'bg-emerald-100 text-emerald-700',
  }

  const filtered = profiles.filter((p) => {
    const matchSearch =
      (p.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      (p.phone_number || '').includes(search)
    const matchRole = selectedRole === 'all' || p.role === selectedRole
    return matchSearch && matchRole
  })

  return (
    <div className="space-y-4">
      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo họ tên, email, SĐT..."
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 text-xs">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'gvcn', label: 'GVCN' },
            { id: 'hoc_sinh', label: 'Học sinh' },
            { id: 'phu_huynh', label: 'Phụ huynh' },
            { id: 'admin', label: 'Ban QTV' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedRole(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
                selectedRole === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Directory items */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p>Không tìm thấy thành viên nào phù hợp.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((profile) => (
            <div
              key={profile.id}
              className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${
                  roleAvatarColor[profile.role] || 'bg-slate-100 text-slate-700'
                }`}
              >
                {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : '?'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800 text-base truncate">
                    {profile.full_name || 'Chưa cập nhật tên'}
                  </h3>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                      roleColor[profile.role] || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {roleDisplay[profile.role] || profile.role}
                  </span>
                  <span className="text-xs text-slate-400 truncate">{profile.email}</span>
                </div>

                {profile.phone_number && (
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1.5 font-medium">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{profile.phone_number}</span>
                  </div>
                )}
              </div>

              {profile.phone_number && (
                <a
                  href={`tel:${profile.phone_number}`}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 border border-slate-200 hover:border-emerald-200 transition shrink-0"
                  title="Gọi điện thoại"
                >
                  <Phone className="w-4 h-4" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

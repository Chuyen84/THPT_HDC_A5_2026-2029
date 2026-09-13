'use client'

import { useState } from 'react'
import {
  Check,
  X,
  Shield,
  Search,
  UserCheck,
  Clock,
  UserX,
  UserPlus,
  Phone,
  Mail,
  Key,
  Trash2,
  Lock,
  AlertCircle,
} from 'lucide-react'
import {
  updateMemberStatus,
  updateMemberRole,
  deleteMember,
  createAccountByAdmin,
} from './actions'

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

  // Modal tạo tài khoản mới & phân quyền
  const [showAddModal, setShowAddModal] = useState(false)
  const [addAccountType, setAddAccountType] = useState<'phone' | 'email'>('phone')
  const [identifier, setIdentifier] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'admin' | 'gvcn' | 'phu_huynh' | 'hoc_sinh'>('phu_huynh')
  const [customPassword, setCustomPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const roleDisplay: Record<string, string> = {
    admin: 'Quản trị viên (Admin)',
    gvcn: 'GV Chủ nhiệm',
    phu_huynh: 'Phụ huynh',
    hoc_sinh: 'Học sinh',
  }

  const roleBadgeStyle: Record<string, string> = {
    admin: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    gvcn: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-300 border-blue-200 dark:border-blue-800',
    phu_huynh: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    hoc_sinh: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  }

  const filtered = profiles.filter((p) => {
    const term = search.toLowerCase()
    const matchSearch =
      (p.full_name || '').toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term) ||
      (p.phone_number || '').includes(term)
    const matchTab = tab === 'all' || p.status === tab
    return matchSearch && matchTab
  })

  // Cập nhật trạng thái duyệt/khóa
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

  // Cập nhật phân quyền vai trò
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

  // Xóa thành viên
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xoá tài khoản "${name}" khỏi hệ thống không?`)) return
    try {
      setLoadingId(id)
      await deleteMember(id)
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Không thể xoá tài khoản'))
    } finally {
      setLoadingId(null)
    }
  }

  // Submit tạo tài khoản mới từ Admin
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError('')

    try {
      const res = await createAccountByAdmin({
        identifier: identifier.trim(),
        fullName: fullName.trim(),
        role,
        customPassword: customPassword.trim() || undefined,
      })

      alert(
        `Tạo tài khoản thành công!\n\n- Tài khoản đăng nhập: ${res.identifier}\n- Mật khẩu: ${res.password}\n- Vai trò phân quyền: ${roleDisplay[res.role]}`
      )

      setShowAddModal(false)
      setIdentifier('')
      setFullName('')
      setCustomPassword('')
      setRole('phu_huynh')
    } catch (err: any) {
      setFormError(err.message || 'Đã có lỗi xảy ra khi tạo tài khoản')
    } finally {
      setIsSubmitting(false)
    }
  }

  const pendingCount = profiles.filter((p) => p.status === 'pending').length
  const activeCount = profiles.filter((p) => p.status === 'active').length

  return (
    <div className="space-y-4">
      {/* Header controls: Search, Tabs & Nút Thêm Tài Khoản */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, SĐT, email..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setTab('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                tab === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Tất cả ({profiles.length})
            </button>
            <button
              onClick={() => setTab('pending')}
              className={`relative px-3 py-1.5 rounded-lg font-medium transition ${
                tab === 'pending'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 hover:bg-amber-50 dark:hover:bg-amber-950/40'
              }`}
            >
              Chờ duyệt ({pendingCount})
            </button>
            <button
              onClick={() => setTab('active')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                tab === 'active'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Đã duyệt ({activeCount})
            </button>
          </div>
        </div>

        {/* NÚT THÊM TÀI KHOẢN & PHÂN QUYỀN MỚI */}
        <button
          onClick={() => {
            setFormError('')
            setShowAddModal(true)
          }}
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-sm w-full sm:w-auto justify-center"
        >
          <UserPlus className="w-4 h-4" />
          <span>Thêm tài khoản mới</span>
        </button>
      </div>

      {/* Table list */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-sm transition-colors">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead className="bg-[#bfe6f7]/70 dark:bg-[#103459]/80 text-slate-900 dark:text-cyan-100 font-bold border-b border-blue-200 dark:border-blue-900/60">
            <tr>
              <th className="p-3.5 border-r border-blue-200 dark:border-blue-900/40">Họ tên & Tài khoản đăng nhập</th>
              <th className="p-3.5 border-r border-blue-200 dark:border-blue-900/40 min-w-[150px]">Phân quyền vai trò</th>
              <th className="p-3.5 border-r border-blue-200 dark:border-blue-900/40 text-center w-28">Trạng thái</th>
              <th className="p-3.5 border-r border-blue-200 dark:border-blue-900/40 text-center w-28 whitespace-nowrap">Ngày tạo</th>
              <th className="p-3.5 text-right whitespace-nowrap w-36">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-slate-400 dark:text-slate-500">
                  Không có thành viên nào trong danh sách.
                </td>
              </tr>
            ) : (
              filtered.map((user) => {
                const isPending = user.status === 'pending'
                const isActive = user.status === 'active'

                // Display identifier (Phone number or Email)
                const isInternalPhoneAccount = user.email?.includes('@phhs.a5.local')
                const displayPhone = user.phone_number || (isInternalPhoneAccount ? user.email.split('@')[0] : null)

                return (
                  <tr key={user.id} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/30 transition">
                    <td className="p-3.5 border-r border-slate-100 dark:border-slate-800">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {user.full_name || 'Chưa đặt tên'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                        {displayPhone ? (
                          <span className="inline-flex items-center gap-1 text-blue-600 dark:text-cyan-400 font-medium">
                            <Phone className="w-3 h-3 text-slate-400" /> SĐT: {displayPhone}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" /> {user.email}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3.5 border-r border-slate-100 dark:border-slate-800">
                      <select
                        value={user.role}
                        disabled={loadingId === user.id}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer ${
                          roleBadgeStyle[user.role] || 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <option value="hoc_sinh">Học sinh</option>
                        <option value="phu_huynh">Phụ huynh</option>
                        <option value="gvcn">GV Chủ nhiệm</option>
                        <option value="admin">Quản trị viên (Admin)</option>
                      </select>
                    </td>

                    <td className="p-3.5 border-r border-slate-100 dark:border-slate-800 text-center">
                      {isPending && (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <Clock className="w-3 h-3" /> Chờ duyệt
                        </span>
                      )}
                      {isActive && (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <UserCheck className="w-3 h-3" /> Hoạt động
                        </span>
                      )}
                      {user.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          <UserX className="w-3 h-3" /> Đã khoá
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 border-r border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 text-center whitespace-nowrap">
                      {new Date(user.created_at).toLocaleDateString('vi-VN')}
                    </td>

                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {isPending ? (
                          <>
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
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-medium transition"
                            >
                              <X className="w-3.5 h-3.5" /> Từ chối
                            </button>
                          </>
                        ) : isActive ? (
                          <button
                            onClick={() => handleStatusChange(user.id, 'rejected')}
                            disabled={loadingId === user.id}
                            className="text-xs px-2.5 py-1 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition border border-transparent hover:border-rose-200"
                          >
                            Khoá
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(user.id, 'active')}
                            disabled={loadingId === user.id}
                            className="text-xs px-2.5 py-1 rounded-lg text-blue-600 dark:text-cyan-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
                          >
                            Mở khoá
                          </button>
                        )}

                        {/* Nút xoá tài khoản */}
                        <button
                          onClick={() => handleDelete(user.id, user.full_name || user.email)}
                          disabled={loadingId === user.id}
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition"
                          title="Xoá tài khoản"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL THÊM TÀI KHOẢN MỚI & PHÂN QUYỀN */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-cyan-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                    Thêm tài khoản & Phân quyền
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cấp tài khoản mới cho Quản trị viên, GVCN, Phụ huynh hoặc Học sinh
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-900/60 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAccount} className="space-y-4 mt-4 text-xs">
              {/* Loại định danh: Số điện thoại hoặc Email */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phương thức đăng nhập <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAddAccountType('phone')
                      setIdentifier('')
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                      addAccountType === 'phone'
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-300 border-blue-300 dark:border-blue-700 shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Số điện thoại</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAddAccountType('email')
                      setIdentifier('')
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                      addAccountType === 'email'
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-300 border-blue-300 dark:border-blue-700 shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email (Quản trị/GVCN)</span>
                  </button>
                </div>
              </div>

              {/* Nhập SĐT hoặc Email */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {addAccountType === 'phone' ? 'Số điện thoại đăng nhập' : 'Địa chỉ Email đăng nhập'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type={addAccountType === 'phone' ? 'tel' : 'email'}
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={
                    addAccountType === 'phone'
                      ? 'VD: 0912345678'
                      : 'VD: gvcn.hoaiducc@gmail.com'
                  }
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                />
              </div>

              {/* Họ và tên */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Họ và tên người dùng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="VD: Thầy Nguyễn Văn Hưng (GVCN) hoặc Phụ huynh em Bảo"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Phân quyền vai trò (Role) */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phân quyền vai trò (Role) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold cursor-pointer"
                >
                  <option value="admin">Quản trị viên (Admin - Toàn quyền quản trị)</option>
                  <option value="gvcn">Giáo viên chủ nhiệm (GVCN - Quản lý lớp, quỹ, duyệt)</option>
                  <option value="phu_huynh">Phụ huynh (Xem thông tin, quỹ, khảo sát, hỏi đáp)</option>
                  <option value="hoc_sinh">Học sinh (Xem tài liệu, lịch học, thông báo)</option>
                </select>
              </div>

              {/* Mật khẩu khởi tạo */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Mật khẩu đăng nhập
                  </label>
                  {addAccountType === 'phone' && identifier && (
                    <span className="text-[11px] text-blue-600 dark:text-cyan-400">
                      Mặc định: {identifier.replace(/[^\d]/g, '')}_phhs
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  placeholder={
                    addAccountType === 'phone'
                      ? `Để trống sẽ lấy mặc định: ${identifier ? identifier.replace(/[^\d]/g, '') + '_phhs' : '<sdt>_phhs'}`
                      : 'Để trống sẽ lấy mặc định: 123456'
                  }
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition shadow-sm flex items-center gap-1.5"
                >
                  {isSubmitting ? 'Đang tạo...' : 'Tạo tài khoản & Cấp quyền'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

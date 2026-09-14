'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Check,
  X,
  Search,
  UserCheck,
  Clock,
  UserX,
  UserPlus,
  Phone,
  Mail,
  Trash2,
  AlertCircle,
  SlidersHorizontal,
  Edit3,
  Eye,
  PlusCircle,
  Edit2,
  Trash,
  CheckCircle2,
} from 'lucide-react'
import {
  updateMemberStatus,
  updateMemberRole,
  deleteMember,
  createAccountByAdmin,
  updateMemberDetailedPermissions,
  updateMemberAccount,
} from './actions'
import {
  ALL_MODULES,
  DEFAULT_ROLE_PERMISSIONS,
  parseRoleData,
  getAllUserPermissions,
  encodeRoleData,
  UserPermissions,
  ModuleKey,
} from '@/utils/permissions'

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
  const router = useRouter()
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())
  const [memberList, setMemberList] = useState<Profile[]>(profiles)

  useEffect(() => {
    setMemberList(profiles.filter((p) => !deletedIds.has(p.id)))
  }, [profiles, deletedIds])

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

  // State Modal Phân quyền chi tiết (Xem, Thêm, Sửa, Xoá)
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<Profile | null>(null)
  const [tempBaseRole, setTempBaseRole] = useState<'admin' | 'gvcn' | 'phu_huynh' | 'hoc_sinh'>('phu_huynh')
  const [tempPerms, setTempPerms] = useState<UserPermissions>({})
  const [isSavingPerms, setIsSavingPerms] = useState(false)

  // State Modal Chỉnh sửa thông tin tài khoản & phân quyền
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<Profile | null>(null)
  const [editFullName, setEditFullName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editRole, setEditRole] = useState<'admin' | 'gvcn' | 'phu_huynh' | 'hoc_sinh'>('phu_huynh')
  const [editPassword, setEditPassword] = useState('')
  const [editPerms, setEditPerms] = useState<UserPermissions>({})
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [editError, setEditError] = useState('')

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

  const filtered = memberList.filter((p) => {
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
      setMemberList((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)))
      await updateMemberStatus(id, status)
      router.refresh()
    } catch (err: any) {
      router.refresh()
      alert('Lỗi: ' + (err.message || 'Không thể cập nhật'))
    } finally {
      setLoadingId(null)
    }
  }

  // Cập nhật phân quyền vai trò nhanh qua dropdown
  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      setLoadingId(id)
      setMemberList((prev) => prev.map((u) => (u.id === id ? { ...u, role: newRole } : u)))
      await updateMemberRole(id, newRole)
      router.refresh()
    } catch (err: any) {
      router.refresh()
      alert('Lỗi: ' + (err.message || 'Không thể cập nhật vai trò'))
    } finally {
      setLoadingId(null)
    }
  }

  // Mở modal phân quyền chi tiết cho user
  const handleOpenPermsModal = (user: Profile) => {
    const roleData = parseRoleData(user.role)
    const currentAllPerms = getAllUserPermissions(user.role)
    setSelectedUserForPerms(user)
    setTempBaseRole(roleData.baseRole)
    setTempPerms(currentAllPerms)
  }

  // Mở modal sửa thông tin tài khoản & phân quyền
  const handleOpenEditModal = (user: Profile) => {
    const isInternalPhoneAccount = user.email?.includes('@phhs.a5.local')
    const phone = user.phone_number || (isInternalPhoneAccount ? user.email.split('@')[0] : '')
    const roleData = parseRoleData(user.role)
    const currentPerms = getAllUserPermissions(user.role)

    setSelectedUserForEdit(user)
    setEditFullName(user.full_name || '')
    setEditPhone(phone)
    setEditEmail(isInternalPhoneAccount ? '' : user.email)
    setEditRole(roleData.baseRole)
    setEditPassword('')
    setEditPerms(currentPerms)
    setEditError('')
  }

  // Bật/tắt 1 quyền cụ thể (view, add, edit, delete) trong modal phân quyền
  const handleTogglePerm = (modKey: ModuleKey, action: 'view' | 'add' | 'edit' | 'delete') => {
    setTempPerms((prev) => {
      const currentMod = prev[modKey] || { view: false, add: false, edit: false, delete: false }
      const nextVal = !currentMod[action]
      const updatedMod = { ...currentMod, [action]: nextVal }
      if (action === 'view' && !nextVal) {
        updatedMod.add = false
        updatedMod.edit = false
        updatedMod.delete = false
      }
      if (action !== 'view' && nextVal) {
        updatedMod.view = true
      }
      return {
        ...prev,
        [modKey]: updatedMod,
      }
    })
  }

  // Bật/tắt quyền trong modal Edit Account
  const handleToggleEditPerm = (modKey: ModuleKey, action: 'view' | 'add' | 'edit' | 'delete') => {
    setEditPerms((prev) => {
      const currentMod = prev[modKey] || { view: false, add: false, edit: false, delete: false }
      const nextVal = !currentMod[action]
      const updatedMod = { ...currentMod, [action]: nextVal }
      if (action === 'view' && !nextVal) {
        updatedMod.add = false
        updatedMod.edit = false
        updatedMod.delete = false
      }
      if (action !== 'view' && nextVal) {
        updatedMod.view = true
      }
      return {
        ...prev,
        [modKey]: updatedMod,
      }
    })
  }

  const handleToggleAllForModule = (modKey: ModuleKey) => {
    setTempPerms((prev) => {
      const cur = prev[modKey] || { view: false, add: false, edit: false, delete: false }
      const allChecked = cur.view && cur.add && cur.edit && cur.delete
      return {
        ...prev,
        [modKey]: {
          view: !allChecked,
          add: !allChecked,
          edit: !allChecked,
          delete: !allChecked,
        },
      }
    })
  }

  const handleApplyRolePreset = (presetRole: 'admin' | 'gvcn' | 'phu_huynh' | 'hoc_sinh') => {
    setTempBaseRole(presetRole)
    setTempPerms(JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS[presetRole])))
  }

  const handleApplyEditRolePreset = (presetRole: 'admin' | 'gvcn' | 'phu_huynh' | 'hoc_sinh') => {
    setEditRole(presetRole)
    setEditPerms(JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS[presetRole])))
  }

  // Lưu phân quyền chi tiết
  const handleSavePerms = async () => {
    if (!selectedUserForPerms) return
    setIsSavingPerms(true)
    try {
      const encodedRole = encodeRoleData(tempBaseRole, tempPerms)
      setMemberList((prev) =>
        prev.map((u) => (u.id === selectedUserForPerms.id ? { ...u, role: encodedRole } : u))
      )
      await updateMemberDetailedPermissions(selectedUserForPerms.id, tempBaseRole, tempPerms)
      router.refresh()
      alert('Đã cập nhật phân quyền chi tiết cho tài khoản!')
      setSelectedUserForPerms(null)
    } catch (err: any) {
      router.refresh()
      alert('Lỗi: ' + (err.message || 'Không thể lưu phân quyền'))
    } finally {
      setIsSavingPerms(false)
    }
  }

  // Lưu chỉnh sửa tài khoản & phân quyền
  const handleSaveAccountEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserForEdit) return
    setIsSavingEdit(true)
    setEditError('')

    try {
      const encodedRole = encodeRoleData(editRole, editPerms)
      const targetId = selectedUserForEdit.id

      // Optimistic update
      setMemberList((prev) =>
        prev.map((u) =>
          u.id === targetId
            ? {
                ...u,
                full_name: editFullName.trim(),
                phone_number: editPhone.trim() || u.phone_number,
                email: editEmail.trim() || u.email,
                role: encodedRole,
              }
            : u
        )
      )

      await updateMemberAccount({
        id: targetId,
        fullName: editFullName.trim(),
        phoneNumber: editPhone.trim() || undefined,
        email: editEmail.trim() || undefined,
        baseRole: editRole,
        customPerms: editPerms,
        newPassword: editPassword.trim() || undefined,
      })

      router.refresh()
      alert('Đã lưu cập nhật tài khoản và phân quyền thành công!')
      setSelectedUserForEdit(null)
    } catch (err: any) {
      router.refresh()
      setEditError(err.message || 'Không thể cập nhật tài khoản')
    } finally {
      setIsSavingEdit(false)
    }
  }

  // Xóa thành viên
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xoá tài khoản "${name}" khỏi hệ thống không?`)) return
    try {
      setLoadingId(id)
      // Optimistic delete & vĩnh viễn ẩn khỏi danh sách
      setDeletedIds((prev) => new Set([...prev, id]))
      setMemberList((prev) => prev.filter((u) => u.id !== id))
      await deleteMember(id)
      router.refresh()
      alert('Đã xoá tài khoản thành công!')
    } catch (err: any) {
      router.refresh()
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
      router.refresh()
    } catch (err: any) {
      setFormError(err.message || 'Đã có lỗi xảy ra khi tạo tài khoản')
    } finally {
      setIsSubmitting(false)
    }
  }

  const pendingCount = memberList.filter((p) => p.status === 'pending').length
  const activeCount = memberList.filter((p) => p.status === 'active').length

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
              Tất cả ({memberList.length})
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
              <th className="p-3 border-r border-blue-200 dark:border-blue-900/40 min-w-[180px]">Họ tên & Tài khoản</th>
              <th className="p-3 border-r border-blue-200 dark:border-blue-900/40 w-44">Vai trò cơ sở</th>
              <th className="p-3 border-r border-blue-200 dark:border-blue-900/40 min-w-[320px]">
                Checklist phân hệ Menu (Xem / Sửa / Xoá)
              </th>
              <th className="p-3 border-r border-blue-200 dark:border-blue-900/40 text-center w-24">Trạng thái</th>
              <th className="p-3 border-r border-blue-200 dark:border-blue-900/40 text-center w-24 whitespace-nowrap">Ngày tạo</th>
              <th className="p-3 text-right whitespace-nowrap w-36">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-slate-400 dark:text-slate-500">
                  Không có thành viên nào trong danh sách.
                </td>
              </tr>
            ) : (
              filtered.map((user) => {
                const isPending = user.status === 'pending'
                const isActive = user.status === 'active'

                const isInternalPhoneAccount = user.email?.includes('@phhs.a5.local')
                const displayPhone = user.phone_number || (isInternalPhoneAccount ? user.email.split('@')[0] : null)

                const roleData = parseRoleData(user.role)
                const isCustomized = Boolean(roleData.customPerms && Object.keys(roleData.customPerms).length > 0)
                const userPerms = getAllUserPermissions(user.role)

                // Đếm tổng số menu được xem
                const visibleCount = ALL_MODULES.filter((m) => userPerms[m.key]?.view).length

                return (
                  <tr key={user.id} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/30 transition">
                    {/* Họ tên & Tài khoản */}
                    <td className="p-3 border-r border-slate-100 dark:border-slate-800">
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

                    {/* Vai trò */}
                    <td className="p-3 border-r border-slate-100 dark:border-slate-800">
                      <div className="flex flex-col gap-1.5">
                        <select
                          value={roleData.baseRole}
                          disabled={loadingId === user.id}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer ${
                            roleBadgeStyle[roleData.baseRole] || 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <option value="hoc_sinh">Học sinh</option>
                          <option value="phu_huynh">Phụ huynh</option>
                          <option value="gvcn">GV Chủ nhiệm</option>
                          <option value="admin">Quản trị viên (Admin)</option>
                        </select>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          {isCustomized ? (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">● Đã tuỳ biến quyền</span>
                          ) : (
                            <span className="text-slate-400">Theo vai trò chuẩn</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Cột CHECKLIST CÁC MỤC, PHÂN HỆ MENU ĐƯỢC PHÂN QUYỀN XEM, SỬA, XOÁ */}
                    <td className="p-3 border-r border-slate-100 dark:border-slate-800">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-800">
                          <span>Được xem: <strong>{visibleCount}/{ALL_MODULES.length}</strong> menu</span>
                          <button
                            onClick={() => handleOpenPermsModal(user)}
                            className="text-blue-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1 font-medium"
                          >
                            <SlidersHorizontal className="w-3 h-3" /> Chỉnh sửa quyền
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                          {ALL_MODULES.map((mod) => {
                            const p = userPerms[mod.key] || { view: false, add: false, edit: false, delete: false }
                            return (
                              <div
                                key={mod.key}
                                className={`p-1.5 rounded-lg border text-[11px] flex items-center justify-between gap-1 transition ${
                                  p.view
                                    ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60 text-slate-800 dark:text-slate-200'
                                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 opacity-60'
                                }`}
                              >
                                <span className="font-semibold truncate" title={mod.label}>
                                  {mod.label}
                                </span>
                                <div className="flex items-center gap-1 shrink-0">
                                  {p.view ? (
                                    <span className="px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold" title="Được xem">
                                      Xem
                                    </span>
                                  ) : (
                                    <span className="text-[9px] text-slate-400">Ẩn</span>
                                  )}
                                  {p.edit && (
                                    <span className="px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[9px] font-bold" title="Được sửa">
                                      Sửa
                                    </span>
                                  )}
                                  {p.delete && (
                                    <span className="px-1 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[9px] font-bold" title="Được xoá">
                                      Xoá
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </td>

                    {/* Trạng thái */}
                    <td className="p-3 border-r border-slate-100 dark:border-slate-800 text-center">
                      {isPending && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <Clock className="w-3 h-3" /> Chờ duyệt
                        </span>
                      )}
                      {isActive && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <UserCheck className="w-3 h-3" /> Hoạt động
                        </span>
                      )}
                      {user.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          <UserX className="w-3 h-3" /> Đã khoá
                        </span>
                      )}
                    </td>

                    {/* Ngày tạo */}
                    <td className="p-3 border-r border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 text-center whitespace-nowrap">
                      {new Date(user.created_at).toLocaleDateString('vi-VN')}
                    </td>

                    {/* Thao tác */}
                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Nút sửa tài khoản & phân quyền */}
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          disabled={loadingId === user.id}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition font-medium"
                          title="Sửa thông tin tài khoản & phân quyền"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Sửa</span>
                        </button>

                        {isPending ? (
                          <>
                            <button
                              onClick={() => handleStatusChange(user.id, 'active')}
                              disabled={loadingId === user.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition"
                            >
                              <Check className="w-3.5 h-3.5" /> Duyệt
                            </button>
                            <button
                              onClick={() => handleStatusChange(user.id, 'rejected')}
                              disabled={loadingId === user.id}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-800 hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-medium transition"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : isActive ? (
                          <button
                            onClick={() => handleStatusChange(user.id, 'rejected')}
                            disabled={loadingId === user.id}
                            className="text-xs px-2 py-1 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-200"
                          >
                            Khoá
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(user.id, 'active')}
                            disabled={loadingId === user.id}
                            className="text-xs px-2 py-1 rounded-lg text-blue-600 dark:text-cyan-400 hover:bg-blue-50 transition"
                          >
                            Mở
                          </button>
                        )}

                        {/* Nút xoá tài khoản */}
                        <button
                          onClick={() => handleDelete(user.id, user.full_name || user.email)}
                          disabled={loadingId === user.id}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
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

      {/* MODAL SỬA TÀI KHOẢN VÀ PHÂN QUYỀN */}
      {selectedUserForEdit && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-cyan-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                    Sửa tài khoản & Cập nhật phân quyền
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Hiệu chỉnh thông tin đăng nhập, vai trò và checklist quyền xem, sửa, xoá theo menu
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForEdit(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs border border-rose-200 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAccountEdit} className="flex-1 overflow-y-auto space-y-4 mt-3 text-xs pr-1">
              {/* Thông tin cơ bản */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Họ và tên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Số điện thoại đăng nhập
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="VD: 0912345678"
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Địa chỉ Email (tuỳ chọn)
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="VD: email@gmail.com"
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Đổi mật khẩu mới (bỏ trống nếu không đổi)
                  </label>
                  <input
                    type="text"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới..."
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Vai trò cơ sở */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Vai trò cơ sở (Role)
                  </label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleApplyEditRolePreset('admin')}
                      className="text-[10px] px-2 py-0.5 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-medium"
                    >
                      Mẫu Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyEditRolePreset('gvcn')}
                      className="text-[10px] px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-medium"
                    >
                      Mẫu GVCN
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyEditRolePreset('phu_huynh')}
                      className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium"
                    >
                      Mẫu Phụ huynh
                    </button>
                  </div>
                </div>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold cursor-pointer"
                >
                  <option value="admin">Quản trị viên (Admin)</option>
                  <option value="gvcn">Giáo viên chủ nhiệm (GVCN)</option>
                  <option value="phu_huynh">Phụ huynh</option>
                  <option value="hoc_sinh">Học sinh</option>
                </select>
              </div>

              {/* Checklist Phân hệ menu: Xem, Sửa, Xoá, Thêm */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Checklist phân quyền các mục, phân hệ menu:
                </label>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-2">Phân hệ Menu</th>
                        <th className="p-2 text-center w-16">Xem</th>
                        <th className="p-2 text-center w-16">Thêm</th>
                        <th className="p-2 text-center w-16">Sửa</th>
                        <th className="p-2 text-center w-16">Xoá</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {ALL_MODULES.map((mod) => {
                        const perm = editPerms[mod.key] || { view: false, add: false, edit: false, delete: false }
                        return (
                          <tr key={mod.key} className="hover:bg-blue-50/30 dark:hover:bg-blue-950/20">
                            <td className="p-2 font-medium text-slate-800 dark:text-slate-200">
                              {mod.label}
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="checkbox"
                                checked={perm.view}
                                onChange={() => handleToggleEditPerm(mod.key, 'view')}
                                className="w-4 h-4 text-blue-600 rounded cursor-pointer accent-blue-600"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="checkbox"
                                checked={perm.add}
                                onChange={() => handleToggleEditPerm(mod.key, 'add')}
                                className="w-4 h-4 text-blue-600 rounded cursor-pointer accent-blue-600"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="checkbox"
                                checked={perm.edit}
                                onChange={() => handleToggleEditPerm(mod.key, 'edit')}
                                className="w-4 h-4 text-blue-600 rounded cursor-pointer accent-blue-600"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="checkbox"
                                checked={perm.delete}
                                onChange={() => handleToggleEditPerm(mod.key, 'delete')}
                                className="w-4 h-4 text-rose-600 rounded cursor-pointer accent-rose-600"
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedUserForEdit(null)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition shadow-sm flex items-center gap-1.5"
                >
                  {isSavingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PHÂN QUYỀN MENU CHI TIẾT NHANH */}
      {selectedUserForPerms && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-cyan-400">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                    Phân quyền hiển thị & thao tác theo Menu
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tài khoản:{' '}
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedUserForPerms.full_name || selectedUserForPerms.email}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForPerms(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Khung chọn nhanh mẫu quyền cơ sở */}
            <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Áp dụng nhanh mẫu quyền:
              </span>
              <div className="flex flex-wrap gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleApplyRolePreset('admin')}
                  className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition font-medium"
                >
                  Admin (Toàn quyền)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyRolePreset('gvcn')}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition font-medium"
                >
                  GVCN
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyRolePreset('phu_huynh')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition font-medium"
                >
                  Phụ huynh
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyRolePreset('hoc_sinh')}
                  className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 border border-slate-300 transition font-medium"
                >
                  Học sinh
                </button>
              </div>
            </div>

            {/* Bảng ma trận phân quyền: Xem, Thêm, Sửa, Xoá */}
            <div className="mt-3 flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-2.5">Menu / Phân hệ</th>
                    <th className="p-2.5 text-center w-20">Xem</th>
                    <th className="p-2.5 text-center w-20">Thêm</th>
                    <th className="p-2.5 text-center w-20">Sửa</th>
                    <th className="p-2.5 text-center w-20">Xoá</th>
                    <th className="p-2.5 text-center w-24">Chọn nhanh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {ALL_MODULES.map((mod) => {
                    const perm = tempPerms[mod.key] || { view: false, add: false, edit: false, delete: false }
                    const isAll = perm.view && perm.add && perm.edit && perm.delete
                    return (
                      <tr key={mod.key} className="hover:bg-blue-50/30 dark:hover:bg-blue-950/20">
                        <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">
                          <span className="font-semibold">{mod.label}</span>
                          <span className="ml-1.5 text-[10px] text-slate-400 font-mono">({mod.href})</span>
                        </td>
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={perm.view}
                            onChange={() => handleTogglePerm(mod.key, 'view')}
                            className="w-4 h-4 text-blue-600 rounded cursor-pointer accent-blue-600"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={perm.add}
                            onChange={() => handleTogglePerm(mod.key, 'add')}
                            className="w-4 h-4 text-blue-600 rounded cursor-pointer accent-blue-600"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={perm.edit}
                            onChange={() => handleTogglePerm(mod.key, 'edit')}
                            className="w-4 h-4 text-blue-600 rounded cursor-pointer accent-blue-600"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={perm.delete}
                            onChange={() => handleTogglePerm(mod.key, 'delete')}
                            className="w-4 h-4 text-rose-600 rounded cursor-pointer accent-rose-600"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleAllForModule(mod.key)}
                            className="text-[11px] px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                          >
                            {isAll ? 'Bỏ chọn' : 'Tất cả'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer buttons */}
            <div className="pt-4 mt-3 flex justify-between items-center border-t border-slate-100 dark:border-slate-800 shrink-0">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                * Menu bị bỏ "Xem" sẽ tự động ẩn khỏi thanh điều hướng bên trái của người dùng này.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForPerms(null)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSavePerms}
                  disabled={isSavingPerms}
                  className="px-5 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition shadow-sm flex items-center gap-1.5"
                >
                  {isSavingPerms ? 'Đang lưu...' : 'Lưu phân quyền'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

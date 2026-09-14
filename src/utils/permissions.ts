// Định nghĩa danh sách các phân hệ (menu modules)
export interface MenuPermission {
  view: boolean
  add: boolean
  edit: boolean
  delete: boolean
}

export type ModuleKey =
  | 'hoc-sinh'
  | 'thong-bao'
  | 'thoi-khoa-bieu'
  | 'danh-ba'
  | 'quy-lop'
  | 'lich'
  | 'tai-lieu'
  | 'khao-sat'
  | 'hoi-dap'

export interface UserPermissions {
  [moduleKey: string]: MenuPermission
}

export interface RoleData {
  baseRole: 'admin' | 'gvcn' | 'phu_huynh' | 'hoc_sinh'
  customPerms?: UserPermissions
}

export const ALL_MODULES: { key: ModuleKey; label: string; href: string }[] = [
  { key: 'hoc-sinh', label: 'Học sinh', href: '/hoc-sinh' },
  { key: 'thong-bao', label: 'Thông báo', href: '/thong-bao' },
  { key: 'thoi-khoa-bieu', label: 'Thời khóa biểu', href: '/thoi-khoa-bieu' },
  { key: 'danh-ba', label: 'Danh bạ', href: '/danh-ba' },
  { key: 'quy-lop', label: 'Quỹ lớp', href: '/quy-lop' },
  { key: 'lich', label: 'Lịch', href: '/lich' },
  { key: 'tai-lieu', label: 'Tài liệu', href: '/tai-lieu' },
  { key: 'khao-sat', label: 'Khảo sát', href: '/khao-sat' },
  { key: 'hoi-dap', label: 'Hỏi đáp', href: '/hoi-dap' },
]

// Quyền mặc định theo từng vai trò cơ sở
export const DEFAULT_ROLE_PERMISSIONS: Record<'admin' | 'gvcn' | 'phu_huynh' | 'hoc_sinh', UserPermissions> = {
  admin: {
    'hoc-sinh': { view: true, add: true, edit: true, delete: true },
    'thong-bao': { view: true, add: true, edit: true, delete: true },
    'thoi-khoa-bieu': { view: true, add: true, edit: true, delete: true },
    'danh-ba': { view: true, add: true, edit: true, delete: true },
    'quy-lop': { view: true, add: true, edit: true, delete: true },
    'lich': { view: true, add: true, edit: true, delete: true },
    'tai-lieu': { view: true, add: true, edit: true, delete: true },
    'khao-sat': { view: true, add: true, edit: true, delete: true },
    'hoi-dap': { view: true, add: true, edit: true, delete: true },
  },
  gvcn: {
    'hoc-sinh': { view: true, add: true, edit: true, delete: true },
    'thong-bao': { view: true, add: true, edit: true, delete: true },
    'thoi-khoa-bieu': { view: true, add: true, edit: true, delete: true },
    'danh-ba': { view: true, add: true, edit: true, delete: true },
    'quy-lop': { view: true, add: true, edit: true, delete: true },
    'lich': { view: true, add: true, edit: true, delete: true },
    'tai-lieu': { view: true, add: true, edit: true, delete: true },
    'khao-sat': { view: true, add: true, edit: true, delete: true },
    'hoi-dap': { view: true, add: true, edit: true, delete: true },
  },
  phu_huynh: {
    'hoc-sinh': { view: true, add: false, edit: false, delete: false },
    'thong-bao': { view: true, add: false, edit: false, delete: false },
    'thoi-khoa-bieu': { view: true, add: false, edit: false, delete: false },
    'danh-ba': { view: true, add: false, edit: false, delete: false },
    'quy-lop': { view: true, add: false, edit: false, delete: false },
    'lich': { view: true, add: false, edit: false, delete: false },
    'tai-lieu': { view: true, add: false, edit: false, delete: false },
    'khao-sat': { view: true, add: true, edit: false, delete: false },
    'hoi-dap': { view: true, add: true, edit: false, delete: false },
  },
  hoc_sinh: {
    'hoc-sinh': { view: false, add: false, edit: false, delete: false },
    'thong-bao': { view: true, add: false, edit: false, delete: false },
    'thoi-khoa-bieu': { view: true, add: false, edit: false, delete: false },
    'danh-ba': { view: true, add: false, edit: false, delete: false },
    'quy-lop': { view: false, add: false, edit: false, delete: false },
    'lich': { view: true, add: false, edit: false, delete: false },
    'tai-lieu': { view: true, add: false, edit: false, delete: false },
    'khao-sat': { view: true, add: true, edit: false, delete: false },
    'hoi-dap': { view: true, add: true, edit: false, delete: false },
  },
}

// Hàm parse chuỗi role (hỗ trợ cả role đơn giản 'admin' và role dạng JSON mã hoá)
export function parseRoleData(rawRole: string | null | undefined): RoleData {
  if (!rawRole) {
    return { baseRole: 'phu_huynh' }
  }

  // Thử parse JSON
  if (rawRole.startsWith('{')) {
    try {
      const parsed = JSON.parse(rawRole)
      if (parsed && parsed.baseRole) {
        return {
          baseRole: parsed.baseRole,
          customPerms: parsed.customPerms || {},
        }
      }
    } catch {
      // Fallback
    }
  }

  // Role đơn giản thông thường
  const base = rawRole as 'admin' | 'gvcn' | 'phu_huynh' | 'hoc_sinh'
  return {
    baseRole: ['admin', 'gvcn', 'phu_huynh', 'hoc_sinh'].includes(base) ? base : 'phu_huynh',
  }
}

// Hàm mã hoá role và quyền thành chuỗi lưu vào database
export function encodeRoleData(baseRole: 'admin' | 'gvcn' | 'phu_huynh' | 'hoc_sinh', customPerms?: UserPermissions): string {
  // Nếu có customPerms thì mã hoá JSON
  if (customPerms && Object.keys(customPerms).length > 0) {
    return JSON.stringify({ baseRole, customPerms })
  }
  return baseRole
}

// Kiểm tra quyền của người dùng đối với 1 module cụ thể
export function getModulePermission(
  rawRole: string | null | undefined,
  moduleKey: ModuleKey
): MenuPermission {
  const roleData = parseRoleData(rawRole)
  const defaultPerms = DEFAULT_ROLE_PERMISSIONS[roleData.baseRole] || DEFAULT_ROLE_PERMISSIONS.phu_huynh

  if (roleData.customPerms && roleData.customPerms[moduleKey]) {
    return roleData.customPerms[moduleKey]
  }

  return defaultPerms[moduleKey] || { view: false, add: false, edit: false, delete: false }
}

// Lấy danh sách toàn bộ quyền của user cho tất cả modules
export function getAllUserPermissions(rawRole: string | null | undefined): UserPermissions {
  const roleData = parseRoleData(rawRole)
  const defaultPerms = DEFAULT_ROLE_PERMISSIONS[roleData.baseRole] || DEFAULT_ROLE_PERMISSIONS.phu_huynh

  const result: UserPermissions = {}
  ALL_MODULES.forEach((mod) => {
    if (roleData.customPerms && roleData.customPerms[mod.key]) {
      result[mod.key] = roleData.customPerms[mod.key]
    } else {
      result[mod.key] = defaultPerms[mod.key] || { view: false, add: false, edit: false, delete: false }
    }
  })

  return result
}

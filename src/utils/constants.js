export const APP_NAME = 'Check A Review'

export const REVIEW_STATUS = {
  PENDING: 'pending',
  PUBLISHED: 'published',
  REJECTED: 'rejected',
  REPORTED: 'reported',
}

export const CRM_ROLES = ['super_admin', 'admin', 'viewer']

export function isCrmRole(role) {
  return CRM_ROLES.includes(role)
}

export function isSuperAdmin(role) {
  return role === 'super_admin'
}

export function isViewer(role) {
  return role === 'viewer'
}

export function crmRoleLabel(role) {
  if (role === 'super_admin') return 'Super Admin'
  if (role === 'admin') return 'Admin'
  if (role === 'viewer') return 'Viewer'
  return role
}

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const LOGO_UPLOAD_HINT =
  'PNG, JPG, or WEBP · max 2MB · wide logos work best for emails (crop is 3:1, or use full image)'

export function resolveMediaUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path) || path.startsWith('blob:') || path.startsWith('data:')) {
    return path
  }
  const normalized = path.startsWith('/') ? path : `/${path}`
  try {
    if (/^https?:\/\//i.test(API_BASE_URL)) {
      return `${new URL(API_BASE_URL).origin}${normalized}`
    }
  } catch {
    // fall through
  }
  return normalized
}

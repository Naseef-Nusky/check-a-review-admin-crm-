import { API_BASE_URL } from '../utils/constants'

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('admin_token')
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData

  const config = {
    ...options,
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
  const json = await response.json().catch(() => ({ message: 'Request failed' }))

  if (!response.ok) {
    throw new ApiError(json.message || 'Request failed', response.status)
  }

  return json.data
}

export const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, data) => request(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint, data) => request(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (endpoint, data) => request(endpoint, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
  upload: (endpoint, formData) => request(endpoint, { method: 'POST', body: formData }),
}

export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: () => api.get('/admin/users'),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getStaff: () => api.get('/admin/staff'),
  createStaff: (data) => api.post('/admin/staff', data),
  updateStaff: (id, data) => api.patch(`/admin/staff/${id}`, data),
  deleteStaff: (id) => api.delete(`/admin/staff/${id}`),
  getBusinesses: () => api.get('/admin/businesses'),
  getBusiness: (id) => api.get(`/admin/businesses/${id}`),
  deleteBusiness: (id) => api.delete(`/admin/businesses/${id}`),
  getBusinessCategories: () => api.get('/admin/categories'),
  createMainCategory: (name) => api.post('/admin/categories/main', { name }),
  createSubCategory: (mainCategoryId, name) =>
    api.post('/admin/categories/sub', { mainCategoryId, name }),
  updateMainCategory: (id, name) => api.patch(`/admin/categories/main/${id}`, { name }),
  updateSubCategory: (id, data) => api.patch(`/admin/categories/sub/${id}`, data),
  deleteMainCategory: (id) => api.delete(`/admin/categories/main/${id}`),
  deleteSubCategory: (id) => api.delete(`/admin/categories/sub/${id}`),
  seedCategories: () => api.post('/admin/categories/seed'),
  createCategory: (name) => api.post('/admin/categories/main', { name }),
  createBusiness: (data) => api.post('/admin/businesses', data),
  getReviews: () => api.get('/admin/reviews'),
  getReview: (id) => api.get(`/admin/reviews/${id}`),
  getFlaggedReviews: () => api.get('/admin/reviews/flagged'),
  moderateReview: (id, status) => api.patch(`/admin/reviews/${id}/moderate`, { status }),
  getPendingBusinesses: () => api.get('/admin/businesses-pending'),
  moderateBusiness: (id, status) => api.patch(`/admin/businesses/${id}/moderate`, { status }),
  getSubscriptions: () => api.get('/admin/subscriptions'),
  getPayments: () => api.get('/admin/payments'),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
  uploadSiteLogo: (file) => {
    const formData = new FormData()
    formData.append('logo', file)
    return api.upload('/admin/settings/logo', formData)
  },
  removeSiteLogo: () => api.delete('/admin/settings/logo'),
  getPricing: () => api.get('/admin/pricing'),
  updatePricing: (data) => api.put('/admin/pricing', data),
  getNotifications: () => api.get('/notifications'),
  getUnreadNotificationCount: () => api.get('/notifications/unread-count'),
  markNotificationRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllNotificationsRead: () => api.patch('/notifications/read-all'),
  login: (email, password) => api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
}

export { ApiError }

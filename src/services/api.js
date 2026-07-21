import { API_BASE_URL } from '../utils/constants'

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('admin_token')

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
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
}

export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: () => api.get('/admin/users'),
  getBusinesses: () => api.get('/admin/businesses'),
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
  getFlaggedReviews: () => api.get('/admin/reviews/flagged'),
  moderateReview: (id, status) => api.patch(`/admin/reviews/${id}/moderate`, { status }),
  getSubscriptions: () => api.get('/admin/subscriptions'),
  getPayments: () => api.get('/admin/payments'),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
  login: (email, password) => api.post('/auth/login', { email, password }),
}

export { ApiError }

export const APP_NAME = 'Check A Review'

export const REVIEW_STATUS = {
  PENDING: 'pending',
  PUBLISHED: 'published',
  REJECTED: 'rejected',
  REPORTED: 'reported',
}

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

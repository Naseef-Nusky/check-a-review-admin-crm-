import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AdminLayout from '../layouts/AdminLayout'
import ProtectedRoute from './ProtectedRoute'
import LoginPage from '../pages/LoginPage'
import DashboardPage from '../pages/DashboardPage'
import UsersPage from '../pages/UsersPage'
import BusinessesPage from '../pages/BusinessesPage'
import ReviewsPage from '../pages/ReviewsPage'
import FlaggedReviewsPage from '../pages/FlaggedReviewsPage'
import SubscriptionsPage from '../pages/SubscriptionsPage'
import PaymentsPage from '../pages/PaymentsPage'
import SettingsPage from '../pages/SettingsPage'

function LoginRedirect() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRedirect />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="businesses" element={<BusinessesPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="flagged" element={<FlaggedReviewsPage />} />
          <Route path="subscriptions" element={<SubscriptionsPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

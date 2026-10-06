import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { businessAreaHomePath } from '../utils/constants'
import AdminLayout from '../layouts/AdminLayout'
import ProtectedRoute from './ProtectedRoute'
import LoginPage from '../pages/LoginPage'
import DashboardPage from '../pages/DashboardPage'
import StaffPage from '../pages/StaffPage'
import UsersPage from '../pages/UsersPage'
import BusinessesPage from '../pages/BusinessesPage'
import BusinessDetailPage from '../pages/BusinessDetailPage'
import CategoriesPage from '../pages/CategoriesPage'
import ReviewsPage from '../pages/ReviewsPage'
import ReviewDetailPage from '../pages/ReviewDetailPage'
import BusinessReviewsPage from '../pages/BusinessReviewsPage'
import FlaggedReviewsPage from '../pages/FlaggedReviewsPage'
import PendingBusinessesPage from '../pages/PendingBusinessesPage'
import SubscriptionsPage from '../pages/SubscriptionsPage'
import PaymentsPage from '../pages/PaymentsPage'
import SettingsPage from '../pages/SettingsPage'
import PricingPage from '../pages/PricingPage'
import BillingPlansPage from '../pages/BillingPlansPage'
import WidgetDesignsPage from '../pages/WidgetDesignsPage'
import ReportsPage from '../pages/ReportsPage'
import ClaimsPage from '../pages/ClaimsPage'

function LoginRedirect() {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <LoginPage />
  return <Navigate to={businessAreaHomePath(user?.role)} replace />
}

function BusinessEditRedirect() {
  const { id } = useParams()
  return <Navigate to={`/businesses/${id}`} replace />
}

function DefaultRedirect() {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Navigate to={businessAreaHomePath(user?.role)} replace />
}

function BusinessesOnlyGuard({ children }) {
  const { isBusinessesOnly } = useAuth()
  if (isBusinessesOnly) return <Navigate to="/businesses" replace />
  return children
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRedirect />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route
            index
            element={
              <BusinessesOnlyGuard>
                <DashboardPage />
              </BusinessesOnlyGuard>
            }
          />
          <Route
            path="users"
            element={
              <BusinessesOnlyGuard>
                <UsersPage />
              </BusinessesOnlyGuard>
            }
          />
          <Route
            path="staff"
            element={
              <BusinessesOnlyGuard>
                <StaffPage />
              </BusinessesOnlyGuard>
            }
          />
          <Route path="businesses" element={<BusinessesPage />} />
          <Route path="businesses/:id" element={<BusinessDetailPage />} />
          <Route path="businesses/:id/edit" element={<BusinessEditRedirect />} />
          <Route path="businesses/:id/reviews" element={<BusinessReviewsPage />} />
          <Route
            path="categories"
            element={
              <BusinessesOnlyGuard>
                <CategoriesPage />
              </BusinessesOnlyGuard>
            }
          />
          <Route
            path="reviews"
            element={
              <BusinessesOnlyGuard>
                <ReviewsPage />
              </BusinessesOnlyGuard>
            }
          />
          <Route
            path="reviews/:id"
            element={
              <BusinessesOnlyGuard>
                <ReviewDetailPage />
              </BusinessesOnlyGuard>
            }
          />
          <Route
            path="flagged"
            element={
              <BusinessesOnlyGuard>
                <FlaggedReviewsPage />
              </BusinessesOnlyGuard>
            }
          />
          <Route
            path="reports"
            element={
              <BusinessesOnlyGuard>
                <ReportsPage />
              </BusinessesOnlyGuard>
            }
          />
          <Route
            path="pending-businesses"
            element={
              <BusinessesOnlyGuard>
                <PendingBusinessesPage />
              </BusinessesOnlyGuard>
            }
          />
          <Route
            path="claims"
            element={
              <BusinessesOnlyGuard>
                <ClaimsPage />
              </BusinessesOnlyGuard>
            }
          />
          <Route
            path="subscriptions"
            element={
              <BusinessesOnlyGuard>
                <SubscriptionsPage />
              </BusinessesOnlyGuard>
            }
          />
          <Route
            path="payments"
            element={
              <BusinessesOnlyGuard>
                <PaymentsPage />
              </BusinessesOnlyGuard>
            }
          />
          <Route
            path="pricing"
            element={
              <BusinessesOnlyGuard>
                <PricingPage />
              </BusinessesOnlyGuard>
            }
          />
          <Route
            path="billing-plans"
            element={
              <BusinessesOnlyGuard>
                <BillingPlansPage />
              </BusinessesOnlyGuard>
            }
          />
          <Route
            path="widget-designs"
            element={
              <BusinessesOnlyGuard>
                <WidgetDesignsPage />
              </BusinessesOnlyGuard>
            }
          />
          <Route
            path="settings"
            element={
              <BusinessesOnlyGuard>
                <SettingsPage />
              </BusinessesOnlyGuard>
            }
          />
        </Route>
      </Route>
      <Route path="*" element={<DefaultRedirect />} />
    </Routes>
  )
}

import { Navigate, useParams } from 'react-router-dom'

/** Legacy route — reviews now live on the business detail Reviews tab */
export default function BusinessReviewsPage() {
  const { id } = useParams()
  return <Navigate to={`/businesses/${id}?tab=reviews`} replace />
}

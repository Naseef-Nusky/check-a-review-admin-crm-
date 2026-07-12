import { StatIcon } from './AppIcon'

export default function StatCard({ label, value, hint, icon }) {
  return (
    <div className="stat-card">
      <StatIcon icon={icon} />
      <p className="stat-value">{value}</p>
      <p className="stat-label">{label}</p>
      {hint && <p className="mt-3 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

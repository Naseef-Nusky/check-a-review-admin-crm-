import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { adminApi } from '../services/api'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import LogoUploader from '../components/LogoUploader'
import BusinessSearchSelect from '../components/BusinessSearchSelect'
import { resolveMediaUrl } from '../utils/constants'

const FEATURED_SLOTS = 4

function padFeaturedIds(ids = []) {
  const slots = ids.slice(0, FEATURED_SLOTS).map(String)
  while (slots.length < FEATURED_SLOTS) slots.push('')
  return slots
}

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    siteName: '',
    supportEmail: '',
    aiModeration: true,
    autoPublishThreshold: '85',
    domainDnsCheck: true,
    emailProvider: 'sendgrid',
    logoUrl: '',
  })
  const [featuredIds, setFeaturedIds] = useState(padFeaturedIds())
  const [featuredSearch, setFeaturedSearch] = useState('')
  const [publishedBusinesses, setPublishedBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [error, setError] = useState('')
  const [logoError, setLogoError] = useState('')
  const [message, setMessage] = useState('')

  const applySettings = (data) => {
    if (!data) return
    setSettings({
      siteName: data.site_name || '',
      supportEmail: data.support_email || '',
      aiModeration: data.ai_moderation_enabled ?? true,
      autoPublishThreshold: String(data.auto_publish_threshold ?? 85),
      domainDnsCheck: data.domain_dns_check_enabled ?? true,
      emailProvider: data.email_provider || 'sendgrid',
      logoUrl: data.logo_url || '',
    })
    setFeaturedIds(padFeaturedIds(data.featured_business_ids))
  }

  const load = () => {
    setLoading(true)
    setError('')
    Promise.all([adminApi.getSettings(), adminApi.getBusinesses()])
      .then(([settingsData, businesses]) => {
        applySettings(settingsData)
        setPublishedBusinesses(
          (businesses || [])
            .filter((b) => b.status === 'published')
            .sort((a, b) => a.name.localeCompare(b.name)),
        )
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const featuredSearchCount = useMemo(() => {
    const query = featuredSearch.trim().toLowerCase()
    if (!query) return publishedBusinesses.length
    return publishedBusinesses.filter((business) => {
      const haystack = [
        business.name,
        business.slug,
        business.category,
        business.website,
        business.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    }).length
  }, [featuredSearch, publishedBusinesses])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    try {
      const updated = await adminApi.updateSettings({
        siteName: settings.siteName,
        supportEmail: settings.supportEmail,
        aiModeration: settings.aiModeration,
        autoPublishThreshold: parseInt(settings.autoPublishThreshold, 10),
        domainDnsCheck: settings.domainDnsCheck,
        emailProvider: settings.emailProvider,
        featuredBusinessIds: featuredIds.filter(Boolean),
      })
      applySettings(updated)
      setMessage('Settings saved successfully')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleLogoChange = async (file) => {
    setLogoError('')
    setMessage('')
    setError('')

    if (!file) {
      if (!settings.logoUrl) return
      if (!window.confirm('Remove the site logo from emails?')) return
      setUploadingLogo(true)
      try {
        const updated = await adminApi.removeSiteLogo()
        applySettings(updated)
        setMessage('Logo removed. Emails will use the default brand logo.')
      } catch (err) {
        setLogoError(err.message || 'Failed to remove logo')
      } finally {
        setUploadingLogo(false)
      }
      return
    }

    setUploadingLogo(true)
    try {
      const updated = await adminApi.uploadSiteLogo(file)
      applySettings(updated)
      setMessage('Logo uploaded. It will appear in emails.')
    } catch (err) {
      setLogoError(err.message || 'Failed to upload logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader title="Website Settings" description="Configure platform settings and email branding" />
      {error && <ErrorMessage message={error} onRetry={load} />}
      <form onSubmit={handleSubmit} className="card max-w-xl space-y-5 p-4 sm:p-6 lg:p-8">
        {message && (
          <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{message}</div>
        )}

        <div>
          <label className="label-text text-slate-700">Email / site logo</label>
          <p className="mt-1 text-sm text-slate-500">
            This logo appears at the top of transactional emails (verification, reviews, invitations, and more).
          </p>
          <LogoUploader
            previewUrl={settings.logoUrl ? resolveMediaUrl(settings.logoUrl) : ''}
            onChange={handleLogoChange}
            onError={setLogoError}
            disabled={uploadingLogo || saving}
          />
          {logoError ? <p className="mt-2 text-sm text-red-600">{logoError}</p> : null}
          {uploadingLogo ? <p className="mt-2 text-sm text-slate-500">Uploading logo...</p> : null}
        </div>

        <div>
          <label htmlFor="siteName" className="label-text text-slate-700">Site Name</label>
          <input id="siteName" type="text" value={settings.siteName} onChange={(e) => setSettings({ ...settings, siteName: e.target.value })} className="input-field" />
        </div>
        <div>
          <label htmlFor="supportEmail" className="label-text text-slate-700">Support Email</label>
          <input id="supportEmail" type="email" value={settings.supportEmail} onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })} className="input-field" />
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <input
            id="domainDnsCheck"
            type="checkbox"
            checked={settings.domainDnsCheck}
            onChange={(e) => setSettings({ ...settings, domainDnsCheck: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <div>
            <label htmlFor="domainDnsCheck" className="text-sm font-medium text-slate-700">
              Require live domain (DNS check)
            </label>
            <p className="mt-1 text-xs text-slate-500">
              When on, new websites must resolve in DNS. Turn this off while testing with unused or fake domains, then turn it back on for production.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input id="aiModeration" type="checkbox" checked={settings.aiModeration} onChange={(e) => setSettings({ ...settings, aiModeration: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
          <label htmlFor="aiModeration" className="text-sm font-medium text-slate-700">Enable AI review moderation</label>
        </div>
        <p className="text-xs text-slate-500 -mt-2">
          Reviews always start as pending. Automated checks for spam, personal info, duplicates, and policy still run even if AI is off.
          When AI is on, Gemini also screens content. Passing reviews auto-publish; flagged ones stay pending for admin.
        </p>
        <div>
          <label htmlFor="autoPublishThreshold" className="label-text text-slate-700">Auto-publish risk threshold (0–100)</label>
          <input id="autoPublishThreshold" type="number" min="0" max="100" value={settings.autoPublishThreshold} onChange={(e) => setSettings({ ...settings, autoPublishThreshold: e.target.value })} className="input-field" />
          <p className="mt-1.5 text-xs text-slate-500">
            Reviews with a risk score at or below this value can auto-publish when checks recommend publish. Lower = stricter.
          </p>
        </div>
        <div>
          <label htmlFor="emailProvider" className="label-text text-slate-700">Email Provider</label>
          <input id="emailProvider" className="input-field bg-slate-50 text-slate-600" value="SendGrid" readOnly />
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-800">Homepage featured businesses</h3>
          <p className="mt-1 text-xs text-slate-500">
            Choose up to 4 published businesses to show in the &quot;Top-rated businesses&quot; section on the public homepage.
            Leave slots empty to show fewer. If none are selected, the site falls back to the highest-rated listings.
          </p>

          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={featuredSearch}
              onChange={(e) => setFeaturedSearch(e.target.value)}
              placeholder="Search businesses by name, category, website…"
              className="input-field pl-9"
              aria-label="Search featured businesses"
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            {featuredSearch.trim()
              ? `${featuredSearchCount} matching ${featuredSearchCount === 1 ? 'business' : 'businesses'}`
              : `${publishedBusinesses.length} published businesses available`}
          </p>

          <div className="mt-4 space-y-3">
            {featuredIds.map((selectedId, index) => {
              const takenElsewhere = featuredIds
                .map((id, slotIndex) => (slotIndex !== index && id ? String(id) : null))
                .filter(Boolean)
              return (
                <div key={index}>
                  <label htmlFor={`featured-${index}`} className="label-text text-slate-700">
                    Slot {index + 1}
                  </label>
                  <BusinessSearchSelect
                    id={`featured-${index}`}
                    businesses={publishedBusinesses}
                    value={selectedId}
                    filterQuery={featuredSearch}
                    excludeIds={takenElsewhere}
                    onChange={(nextId) => {
                      const next = [...featuredIds]
                      next[index] = nextId
                      setFeaturedIds(next)
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </form>
    </div>
  )
}

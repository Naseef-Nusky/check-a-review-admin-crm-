import { useEffect, useState } from 'react'
import { adminApi } from '../services/api'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import LogoUploader from '../components/LogoUploader'
import { resolveMediaUrl } from '../utils/constants'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    siteName: '',
    supportEmail: '',
    aiModeration: true,
    autoPublishThreshold: '85',
    emailProvider: 'sendgrid',
    logoUrl: '',
  })
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
      emailProvider: data.email_provider || 'sendgrid',
      logoUrl: data.logo_url || '',
    })
  }

  const load = () => {
    setLoading(true)
    setError('')
    adminApi
      .getSettings()
      .then(applySettings)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

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
        emailProvider: settings.emailProvider,
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
      <form onSubmit={handleSubmit} className="card max-w-xl space-y-5 p-6 sm:p-8">
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
          <select id="emailProvider" value={settings.emailProvider} onChange={(e) => setSettings({ ...settings, emailProvider: e.target.value })} className="input-field">
            <option value="sendgrid">SendGrid</option>
            <option value="resend">Resend</option>
          </select>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </form>
    </div>
  )
}

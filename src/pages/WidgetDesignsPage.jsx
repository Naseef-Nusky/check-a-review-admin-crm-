import PageHeader from '../components/PageHeader'

const WIDGET_CATALOG = [
  { id: 'trust-badge', name: 'TrustScore badge', description: 'Compact score mark for headers and ads.', tone: 'light' },
  { id: 'mini-stars', name: 'Mini ratings bar', description: 'Star rating strip for product pages.', tone: 'light' },
  { id: 'classic', name: 'Classic reviews', description: 'Business summary and recent reviews.', tone: 'light' },
  { id: 'compact', name: 'Compact header', description: 'Short rating bar for headers and footers.', tone: 'light' },
  { id: 'dark', name: 'Dark testimonial', description: 'Full review card for dark website sections.', tone: 'dark' },
  { id: 'product-stars', name: 'Product page stars', description: 'Inline stars for product detail pages.', tone: 'light' },
  { id: 'sidebar', name: 'Sidebar reviews', description: 'Vertical review list for blog or account pages.', tone: 'light' },
  { id: 'marquee', name: 'Horizontal trust bar', description: 'Wide rating bar for landing pages.', tone: 'light' },
  { id: 'quote-cards', name: 'Quote cards', description: 'Highlighted customer quotes with TrustScore.', tone: 'light' },
  { id: 'trust-bar', name: 'Trust bar', description: 'Showcase TrustScore next to conversion CTAs.', tone: 'light' },
  { id: 'grid', name: 'Review grid', description: 'Multi-review grid for home pages.', tone: 'light' },
  { id: 'hero', name: 'Hero banner', description: 'Large TrustScore block for campaign pages.', tone: 'brand' },
  { id: 'floating-badge', name: 'Floating badge', description: 'Corner badge style for persistent social proof.', tone: 'light' },
  { id: 'email-signature', name: 'Email signature', description: 'Slim rating mark for outbound email.', tone: 'light' },
  { id: 'checkout-trust', name: 'Checkout trust', description: 'Reassurance unit for cart and checkout.', tone: 'light' },
  { id: 'social-strip', name: 'Social proof strip', description: 'Horizontal proof strip for ads and landers.', tone: 'brand' },
  { id: 'location-snapshot', name: 'Location snapshot', description: 'Score snapshot for location landing pages.', tone: 'light' },
  { id: 'detailed-list', name: 'Detailed review list', description: 'Longer recent-review list for TrustScore pages.', tone: 'light' },
  { id: 'quote-spotlight', name: 'Quote spotlight', description: 'Single large testimonial with score.', tone: 'light' },
  { id: 'premium-carousel', name: 'Premium carousel', description: 'Rich TrustScore and testimonial layout.', tone: 'dark' },
  { id: 'insights-teaser', name: 'Insights teaser', description: 'Score plus trend-style summary for dashboards.', tone: 'brand' },
  { id: 'enterprise-wall', name: 'Enterprise review wall', description: 'Largest testimonial wall for brand sites.', tone: 'dark' },
]

function PreviewShell({ tone = 'light', children }) {
  const toneClass =
    tone === 'dark'
      ? 'border-slate-800 bg-slate-950 text-white'
      : tone === 'brand'
        ? 'border-primary-200 bg-linear-to-br from-primary-50 via-white to-primary-100 text-slate-900'
        : 'border-slate-200 bg-white text-slate-900'

  return <div className={`rounded-2xl border p-4 shadow-sm ${toneClass}`}>{children}</div>
}

function Stars({ dark = false }) {
  return (
    <div className={`text-sm tracking-[0.2em] ${dark ? 'text-primary-300' : 'text-primary-500'}`}>★★★★★</div>
  )
}

function CompactPreview({ widget }) {
  const dark = widget.tone === 'dark'
  return (
    <PreviewShell tone={widget.tone}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${dark ? 'text-slate-400' : 'text-slate-400'}`}>
            Check A Review
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`text-2xl font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>4.9</span>
            <Stars dark={dark} />
          </div>
        </div>
        <div className={`rounded-full px-3 py-1 text-xs font-medium ${dark ? 'bg-white/10 text-white' : 'bg-primary-50 text-primary-700'}`}>
          2,431 reviews
        </div>
      </div>
      <div className={`mt-4 h-2 rounded-full ${dark ? 'bg-white/10' : 'bg-slate-100'}`}>
        <div className="h-2 w-4/5 rounded-full bg-primary-500" />
      </div>
    </PreviewShell>
  )
}

function ClassicPreview({ widget }) {
  return (
    <PreviewShell tone={widget.tone}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Check A Review</p>
          <div className="mt-1 flex items-center gap-2">
            <Stars />
            <span className="text-xs text-slate-500">Rated excellent</span>
          </div>
        </div>
        <div className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">4.9 / 5</div>
      </div>
      <div className="mt-4 space-y-3">
        {[1, 2].map((item) => (
          <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-900">Amazing support and easy setup</p>
              <span className="text-[11px] text-slate-400">2d ago</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Customers can see fresh proof points, ratings, and review snippets in a clean testimonial layout.
            </p>
          </div>
        ))}
      </div>
    </PreviewShell>
  )
}

function SpotlightPreview({ widget }) {
  return (
    <PreviewShell tone={widget.tone}>
      <div className="rounded-2xl bg-slate-950/90 p-5 text-white">
        <p className="text-sm font-medium text-primary-300">Featured customer quote</p>
        <p className="mt-3 text-lg font-semibold leading-snug">
          “This review widget made our trust score visible right where conversions happen.”
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <Stars dark />
            <p className="mt-2 text-xs text-slate-400">Growth team, London</p>
          </div>
          <div className="rounded-full bg-white/10 px-3 py-1 text-xs">TrustScore 4.9</div>
        </div>
      </div>
    </PreviewShell>
  )
}

function GridPreview({ widget }) {
  return (
    <PreviewShell tone={widget.tone}>
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <Stars />
            <p className="mt-2 text-xs font-medium text-slate-900">Fast onboarding</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">Short testimonial cards laid out in a conversion-friendly grid.</p>
          </div>
        ))}
      </div>
    </PreviewShell>
  )
}

function HeroPreview({ widget }) {
  return (
    <PreviewShell tone={widget.tone}>
      <div className="rounded-2xl bg-linear-to-r from-slate-950 via-slate-900 to-primary-700 p-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-200">Hero design</p>
        <h3 className="mt-3 text-xl font-semibold">Turn trust into more sales</h3>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-3xl font-semibold">4.9</span>
          <Stars dark />
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs">2.4k verified reviews</span>
        </div>
      </div>
    </PreviewShell>
  )
}

function PreviewByWidget({ widget }) {
  if (['quote-cards', 'quote-spotlight', 'dark', 'premium-carousel', 'enterprise-wall'].includes(widget.id)) {
    return <SpotlightPreview widget={widget} />
  }
  if (['grid', 'detailed-list', 'sidebar', 'location-snapshot'].includes(widget.id)) {
    return <GridPreview widget={widget} />
  }
  if (['hero', 'insights-teaser', 'social-strip'].includes(widget.id)) {
    return <HeroPreview widget={widget} />
  }
  if (['classic'].includes(widget.id)) {
    return <ClassicPreview widget={widget} />
  }
  return <CompactPreview widget={widget} />
}

export default function WidgetDesignsPage() {
  return (
    <div>
      <PageHeader
        kicker="Design library"
        title="Widget designs"
        description="Browse all widget styles available across the platform."
      />

      <div className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-5">
        <p className="text-sm text-slate-500">All {WIDGET_CATALOG.length} widget styles currently available.</p>

        <div className="mt-5 grid gap-4 sm:gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {WIDGET_CATALOG.map((widget, index) => (
            <div key={widget.id} className="overflow-hidden rounded-3xl border border-border bg-slate-50 p-3 shadow-sm sm:p-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Widget {index + 1}</p>
                  <h2 className="mt-1 text-sm font-semibold text-slate-900">{widget.name}</h2>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200">
                  {widget.tone}
                </span>
              </div>
              <PreviewByWidget widget={widget} />
              <p className="mt-4 text-xs leading-relaxed text-slate-500">{widget.description}</p>
              <p className="mt-2 text-[11px] font-mono text-slate-400">{widget.id}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://mallanproject-production.up.railway.app'

// ─── Step config ──────────────────────────────────────────────────────────────

const STEPS = [
  { number: 1, label: 'Your Website' },
  { number: 2, label: 'Your Goal' },
  { number: 3, label: 'Your Platforms' },
]

// ─── Goal options ─────────────────────────────────────────────────────────────

const GOAL_OPTIONS = [
  { emoji: '📢', label: 'Brand Awareness', description: 'Grow visibility and reach', value: 'brand_awareness' },
  { emoji: '💬', label: 'Engagement', description: 'Drive interaction and community', value: 'engagement' },
  { emoji: '🎯', label: 'Lead Generation', description: 'Capture leads and signups', value: 'lead_generation' },
  { emoji: '💰', label: 'Drive Sales', description: 'Maximise revenue and ROAS', value: 'drive_sales' },
]

// ─── Platform options ─────────────────────────────────────────────────────────

const PLATFORM_GROUPS = [
  {
    label: 'Ads',
    platforms: [
      { label: 'Google Ads', value: 'google_ads' },
      { label: 'Meta Ads', value: 'meta_ads' },
      { label: 'LinkedIn Ads', value: 'linkedin_ads' },
    ],
  },
  {
    label: 'Social',
    platforms: [
      { label: 'Facebook', value: 'facebook' },
      { label: 'Instagram', value: 'instagram' },
      { label: 'LinkedIn Pages', value: 'linkedin_pages' },
    ],
  },
  {
    label: 'Website',
    platforms: [
      { label: 'Google Analytics 4', value: 'ga4' },
    ],
  },
  {
    label: 'Brand',
    platforms: [
      { label: 'Google Search Console', value: 'google_search_console' },
    ],
  },
]

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  page: {
    minHeight: '100vh',
    background: '#F5F5DC',
    padding: '32px 16px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  } as React.CSSProperties,

  container: {
    maxWidth: 600,
    margin: '0 auto',
  } as React.CSSProperties,

  header: {
    textAlign: 'center' as const,
    marginBottom: 32,
  },

  heading: {
    fontFamily: 'Comfortaa, system-ui, sans-serif',
    fontSize: 28,
    fontWeight: 700,
    color: '#4A2C2A',
    margin: 0,
  },

  subtext: {
    fontSize: 15,
    color: '#8B7355',
    marginTop: 8,
  },

  card: {
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    padding: '32px 36px',
    marginTop: 24,
  } as React.CSSProperties,

  label: {
    display: 'block',
    fontSize: 17,
    fontWeight: 600,
    color: '#4A2C2A',
    marginBottom: 6,
  } as React.CSSProperties,

  helper: {
    fontSize: 13,
    color: '#8B7355',
    marginBottom: 20,
    marginTop: 0,
  },

  input: (focused: boolean) => ({
    width: '100%',
    padding: '10px 14px',
    fontSize: 15,
    border: `1px solid ${focused ? '#8B4513' : '#D2B48C'}`,
    borderRadius: 8,
    outline: 'none',
    background: '#fff',
    color: '#4A2C2A',
    boxSizing: 'border-box' as const,
  }),

  btnRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 28,
  } as React.CSSProperties,

  btnBack: {
    padding: '10px 22px',
    borderRadius: 8,
    border: '1px solid #D2B48C',
    background: '#fff',
    color: '#8B7355',
    fontSize: 15,
    cursor: 'pointer',
  } as React.CSSProperties,

  btnNext: (disabled: boolean) => ({
    padding: '10px 22px',
    borderRadius: 8,
    border: 'none',
    background: disabled ? '#D2B48C' : '#FF8C00',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    marginLeft: 'auto',
  } as React.CSSProperties),

  goalGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  } as React.CSSProperties,

  goalCard: (selected: boolean) => ({
    background: '#fff',
    border: selected ? '2px solid #8B4513' : '2px solid #e5e5e5',
    borderRadius: 10,
    padding: '16px 14px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'border-color 0.15s',
  }),

  goalEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },

  goalLabel: {
    fontWeight: 600,
    fontSize: 14,
    color: '#4A2C2A',
    marginBottom: 2,
  },

  goalDesc: {
    fontSize: 12,
    color: '#8B7355',
  },

  pillarLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: '#8B7355',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
  },

  chip: (selected: boolean) => ({
    display: 'inline-block',
    padding: '7px 14px',
    borderRadius: 20,
    background: selected ? '#8B4513' : '#D2B48C',
    color: selected ? '#fff' : '#4A2C2A',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    margin: '0 6px 8px 0',
    border: 'none',
    transition: 'background 0.15s, color 0.15s',
  } as React.CSSProperties),

  errorText: {
    fontSize: 12,
    color: '#c0392b',
    marginTop: 6,
  },
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
      {STEPS.map((step, i) => {
        const done = step.number < current
        const active = step.number === current
        const circleColor = done ? '#228B22' : active ? '#8B4513' : '#D2B48C'
        const textColor = done || active ? '#fff' : '#8B7355'

        return (
          <div key={step.number} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: circleColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: textColor,
                fontWeight: 700,
                fontSize: 14,
              }}>
                {done ? <Check size={16} strokeWidth={3} /> : step.number}
              </div>
              <span style={{ fontSize: 11, color: active ? '#8B4513' : '#8B7355', marginTop: 4, whiteSpace: 'nowrap' }}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                width: 60,
                height: 2,
                background: done ? '#228B22' : '#D2B48C',
                margin: '0 8px',
                marginBottom: 18,
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Onboarding() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Tenant ID — same approach as Dashboard.tsx
  const tenantId = searchParams.get('tenant') || undefined
  console.log('tenant_id:', tenantId)

  const [step, setStep] = useState(1)
  const [brandUrl, setBrandUrl] = useState('')
  const [urlFocused, setUrlFocused] = useState(false)
  const [urlError, setUrlError] = useState('')

  const [goal, setGoal] = useState('lead_generation')

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [platformError, setPlatformError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  if (!tenantId) {
    return (
      <div style={S.page}>
        <div style={{ ...S.container, textAlign: 'center', paddingTop: 80 }}>
          <p style={{ color: '#8B7355', fontSize: 16 }}>Loading...</p>
        </div>
      </div>
    )
  }

  // ── Step 1 handlers ──

  function handleNextStep1() {
    if (!brandUrl.trim()) {
      setUrlError('Please enter your website URL')
      return
    }
    setUrlError('')
    setStep(2)
  }

  // ── Step 2 handlers ──

  function handleNextStep2() {
    setStep(3)
  }

  // ── Step 3 handlers ──

  function togglePlatform(value: string) {
    setSelectedPlatforms(prev =>
      prev.includes(value) ? prev.filter(p => p !== value) : [...prev, value]
    )
    setPlatformError('')
  }

  async function handleLaunch() {
    if (selectedPlatforms.length === 0) {
      setPlatformError('Please select at least one platform')
      return
    }

    setSubmitting(true)
    setSubmitError('')

    try {
      const res = await fetch(`${API_BASE_URL}/api/onboarding/get-started`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          brand_url: brandUrl.trim(),
          north_star_focus: goal,
          selected_platforms: selectedPlatforms,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to save preferences')
      }

      navigate(`/?tenant=${tenantId}`)
    } catch (err: any) {
      setSubmitError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ──

  return (
    <div style={S.page}>
      <div style={S.container}>
        <div style={S.header}>
          <h1 style={S.heading}>Let's set up your dashboard</h1>
          <p style={S.subtext}>Three quick questions and you're in.</p>
        </div>

        <StepIndicator current={step} />

        {/* ── Step 1: Your Website ── */}
        {step === 1 && (
          <div style={S.card}>
            <label style={S.label}>What's your website?</label>
            <p style={S.helper}>We'll use this to identify your brand across platforms</p>
            <input
              type="url"
              placeholder="https://yourcompany.com"
              value={brandUrl}
              onChange={e => { setBrandUrl(e.target.value); setUrlError('') }}
              onFocus={() => setUrlFocused(true)}
              onBlur={() => setUrlFocused(false)}
              style={S.input(urlFocused)}
            />
            {urlError && <p style={S.errorText}>{urlError}</p>}
            <div style={S.btnRow}>
              <button
                onClick={handleNextStep1}
                disabled={!brandUrl.trim()}
                style={{ ...S.btnNext(!brandUrl.trim()), marginLeft: 'auto' }}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Your Goal ── */}
        {step === 2 && (
          <div style={S.card}>
            <label style={S.label}>What's your main marketing goal?</label>
            <p style={S.helper}>This sets your headline metric on the dashboard. You can change it anytime.</p>
            <div style={S.goalGrid}>
              {GOAL_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setGoal(opt.value)}
                  style={S.goalCard(goal === opt.value)}
                >
                  <div style={S.goalEmoji}>{opt.emoji}</div>
                  <div style={S.goalLabel}>{opt.label}</div>
                  <div style={S.goalDesc}>{opt.description}</div>
                </button>
              ))}
            </div>
            <div style={S.btnRow}>
              <button onClick={() => setStep(1)} style={S.btnBack}>Back</button>
              <button onClick={handleNextStep2} style={S.btnNext(false)}>Next →</button>
            </div>
          </div>
        )}

        {/* ── Step 3: Your Platforms ── */}
        {step === 3 && (
          <div style={S.card}>
            <label style={S.label}>Which platforms do you use?</label>
            <p style={S.helper}>Select everything you want to track. You'll connect them from the dashboard.</p>

            {PLATFORM_GROUPS.map(group => (
              <div key={group.label}>
                <p style={S.pillarLabel}>{group.label}</p>
                <div>
                  {group.platforms.map(p => (
                    <button
                      key={p.value}
                      onClick={() => togglePlatform(p.value)}
                      style={S.chip(selectedPlatforms.includes(p.value))}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {platformError && <p style={S.errorText}>{platformError}</p>}
            {submitError && <p style={S.errorText}>{submitError}</p>}

            <div style={S.btnRow}>
              <button onClick={() => setStep(2)} style={S.btnBack}>Back</button>
              <button
                onClick={handleLaunch}
                disabled={submitting}
                style={{
                  ...S.btnNext(false),
                  background: submitting ? '#D2B48C' : '#FF8C00',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Saving...' : 'Launch Dashboard →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

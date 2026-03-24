import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { Check, Loader2 } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://mallanproject-production.up.railway.app'

const STEPS = [
  { number: 1, label: 'Get Started' },
  { number: 2, label: 'Connect' },
  { number: 3, label: 'Stakeholders' },
  { number: 4, label: 'Schedule' },
]

const NORTH_STAR_OPTIONS = [
  { emoji: '📢', label: 'Brand Awareness', description: 'Grow visibility and reach', value: 'brand_awareness' },
  { emoji: '💬', label: 'Engagement', description: 'Drive interaction and community', value: 'engagement' },
  { emoji: '🎯', label: 'Lead Generation', description: 'Capture leads and signups', value: 'lead_generation' },
  { emoji: '💰', label: 'Drive Sales', description: 'Maximise revenue and ROAS', value: 'drive_sales' },
]

const VIEW_TYPE_DESCRIPTIONS: Record<string, string> = {
  finance: 'Spend, budget %, CPA, conversions',
  management: 'ROAS, leads, CAC trend, top channel',
  internal: 'Everything — full dashboard access',
}

interface Stakeholder {
  id: number
  name: string
  email: string
  view_type: string
}

interface ConnectionStatus {
  google: boolean
  meta: boolean
  linkedin: boolean
}

// ─── Shared styles ──────────────────────────────────────────────────────────

const styles = {
  page: {
    minHeight: '100vh',
    background: '#F5F5DC',
    padding: '32px 16px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  } as React.CSSProperties,
  container: {
    maxWidth: '700px',
    margin: '0 auto',
  } as React.CSSProperties,
  heading: {
    fontFamily: 'Comfortaa, cursive',
    color: '#4A2C2A',
    fontSize: '28px',
    fontWeight: 700,
    margin: 0,
  } as React.CSSProperties,
  subtext: {
    color: '#8B7355',
    fontSize: '14px',
    marginTop: '6px',
    lineHeight: 1.5,
  } as React.CSSProperties,
  card: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    padding: '28px',
  } as React.CSSProperties,
  label: {
    display: 'block',
    fontWeight: 600,
    color: '#4A2C2A',
    fontSize: '14px',
    marginBottom: '4px',
  } as React.CSSProperties,
  helperText: {
    color: '#8B7355',
    fontSize: '12px',
    marginBottom: '8px',
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #D2B48C',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#4A2C2A',
    background: 'white',
    outline: 'none',
    boxSizing: 'border-box',
  } as React.CSSProperties,
  btnPrimary: {
    background: '#FF8C00',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 24px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,
  btnPrimaryDisabled: {
    background: '#D2B48C',
    color: '#8B7355',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 24px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'not-allowed',
  } as React.CSSProperties,
  btnBack: {
    background: 'none',
    border: 'none',
    color: '#8B7355',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '8px 0',
  } as React.CSSProperties,
}

// ─── Step Indicator ─────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '28px' }}>
      {STEPS.map((step, idx) => {
        const isCompleted = current > step.number
        const isActive = current === step.number
        return (
          <div key={step.number} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '14px',
                background: isCompleted ? '#228B22' : isActive ? '#8B4513' : '#D2B48C',
                color: (isCompleted || isActive) ? 'white' : '#8B7355',
              }}>
                {isCompleted ? <Check size={16} strokeWidth={3} /> : step.number}
              </div>
              <span style={{
                fontSize: '11px',
                marginTop: '4px',
                fontWeight: isActive ? 700 : 400,
                color: isActive ? '#8B4513' : isCompleted ? '#228B22' : '#8B7355',
                whiteSpace: 'nowrap',
              }}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div style={{
                width: '60px',
                height: '2px',
                margin: '0 8px',
                marginBottom: '20px',
                background: current > step.number ? '#228B22' : '#D2B48C',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 1: Get Started ────────────────────────────────────────────────────

function Step1({
  brandUrl, setBrandUrl,
  northStar, setNorthStar,
}: {
  brandUrl: string; setBrandUrl: (v: string) => void
  northStar: string; setNorthStar: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <label style={styles.label}>What's your website?</label>
        <p style={styles.helperText}>We'll use this to identify your brand across platforms</p>
        <input
          type="text"
          value={brandUrl}
          onChange={e => setBrandUrl(e.target.value)}
          placeholder="https://yourcompany.com"
          style={styles.input}
          onFocus={e => (e.target.style.borderColor = '#8B4513')}
          onBlur={e => (e.target.style.borderColor = '#D2B48C')}
        />
      </div>

      <div>
        <label style={styles.label}>What's your main marketing goal?</label>
        <p style={styles.helperText}>This sets your headline metric on the dashboard. You can change it anytime.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {NORTH_STAR_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setNorthStar(opt.value)}
              style={{
                background: 'white',
                border: `2px solid ${northStar === opt.value ? '#8B4513' : '#D2B48C'}`,
                borderRadius: '10px',
                padding: '14px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: '22px', marginBottom: '6px' }}>{opt.emoji}</div>
              <div style={{ fontWeight: 700, color: '#4A2C2A', fontSize: '13px', marginBottom: '2px' }}>
                {opt.label}
              </div>
              <div style={{ color: '#8B7355', fontSize: '12px' }}>{opt.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Step 2: Connect Platforms ──────────────────────────────────────────────

interface PlatformCardProps {
  icon: React.ReactNode
  title: string
  subtitle: string
  badges: string[]
  connected: boolean
  tenantLoaded: boolean
  onConnect: () => void
}

function PlatformCard({ icon, title, subtitle, badges, connected, tenantLoaded, onConnect }: PlatformCardProps) {
  const isDisabled = connected || !tenantLoaded
  return (
    <div style={{ ...styles.card, display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
      <div>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, color: '#4A2C2A', fontSize: '16px', marginBottom: '4px' }}>{title}</div>
        <div style={{ color: '#8B7355', fontSize: '13px', marginBottom: '10px' }}>{subtitle}</div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {badges.map(b => (
            <span key={b} style={{
              background: '#D2B48C',
              color: '#4A2C2A',
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '999px',
            }}>{b}</span>
          ))}
        </div>
        <button
          type="button"
          onClick={onConnect}
          disabled={isDisabled}
          style={{
            background: connected ? '#228B22' : isDisabled ? '#D2B48C' : '#FF8C00',
            color: connected || !isDisabled ? 'white' : '#8B7355',
            border: 'none',
            borderRadius: '8px',
            padding: '7px 16px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
          }}
        >
          {connected ? 'Connected ✓' : 'Connect'}
        </button>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <div style={{
      width: '40px', height: '40px', borderRadius: '50%',
      background: 'linear-gradient(135deg, #4285F4, #34A853)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontWeight: 900, fontSize: '16px', flexShrink: 0,
    }}>G</div>
  )
}

function MetaIcon() {
  return (
    <div style={{
      width: '40px', height: '40px', borderRadius: '50%',
      background: 'linear-gradient(135deg, #1877F2, #42B72A)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontWeight: 900, fontSize: '16px', flexShrink: 0,
    }}>M</div>
  )
}

function LinkedInIcon() {
  return (
    <div style={{
      width: '40px', height: '40px', borderRadius: '50%',
      background: '#0A66C2',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontWeight: 900, fontSize: '13px', flexShrink: 0,
    }}>in</div>
  )
}

function Step2({
  connections,
  tenantId,
}: {
  connections: ConnectionStatus
  tenantId: string
}) {
  const tenantLoaded = !!tenantId

  const handleConnect = (platform: string) => {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/connect/${platform}?tenant_id=${tenantId}`
  }

  const anyConnected = connections.google || connections.meta || connections.linkedin

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <PlatformCard
        icon={<GoogleIcon />}
        title="Google"
        subtitle="Connects Google Ads, Analytics, and Search Console"
        badges={['Ads', 'Website', 'Brand']}
        connected={connections.google}
        tenantLoaded={tenantLoaded}
        onConnect={() => handleConnect('google')}
      />
      <PlatformCard
        icon={<MetaIcon />}
        title="Meta"
        subtitle="Connects Meta Ads, Facebook, and Instagram"
        badges={['Ads', 'Social']}
        connected={connections.meta}
        tenantLoaded={tenantLoaded}
        onConnect={() => handleConnect('meta')}
      />
      <PlatformCard
        icon={<LinkedInIcon />}
        title="LinkedIn"
        subtitle="Connects LinkedIn Ads and LinkedIn Pages"
        badges={['Ads', 'Social']}
        connected={connections.linkedin}
        tenantLoaded={tenantLoaded}
        onConnect={() => handleConnect('linkedin')}
      />
      {!anyConnected && (
        <p style={{ color: '#8B7355', fontSize: '13px', textAlign: 'center', marginTop: '4px' }}>
          Connect at least one platform to continue. You can always add more later.
        </p>
      )}
    </div>
  )
}

// ─── Step 3: Stakeholders ───────────────────────────────────────────────────

function Step3({
  stakeholders,
  setStakeholders,
}: {
  stakeholders: Stakeholder[]
  setStakeholders: (s: Stakeholder[]) => void
}) {
  const update = (id: number, field: keyof Stakeholder, value: string) => {
    setStakeholders(stakeholders.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  const remove = (id: number) => {
    if (stakeholders.length > 1) {
      setStakeholders(stakeholders.filter(s => s.id !== id))
    }
  }

  const add = () => {
    if (stakeholders.length < 3) {
      setStakeholders([...stakeholders, { id: Date.now(), name: '', email: '', view_type: 'internal' }])
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {stakeholders.map((s, idx) => (
        <div key={s.id} style={{ ...styles.card, padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontWeight: 700, color: '#4A2C2A', fontSize: '14px' }}>Stakeholder {idx + 1}</span>
            {stakeholders.length > 1 && (
              <button
                type="button"
                onClick={() => remove(s.id)}
                style={{ background: 'none', border: 'none', color: '#8B7355', cursor: 'pointer', fontSize: '12px' }}
              >
                Remove
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="text"
              value={s.name}
              onChange={e => update(s.id, 'name', e.target.value)}
              placeholder="Name (e.g. Finance Director)"
              style={styles.input}
              onFocus={e => (e.target.style.borderColor = '#8B4513')}
              onBlur={e => (e.target.style.borderColor = '#D2B48C')}
            />
            <input
              type="email"
              value={s.email}
              onChange={e => update(s.id, 'email', e.target.value)}
              placeholder="email@company.com"
              style={styles.input}
              onFocus={e => (e.target.style.borderColor = '#8B4513')}
              onBlur={e => (e.target.style.borderColor = '#D2B48C')}
            />
            <select
              value={s.view_type}
              onChange={e => update(s.id, 'view_type', e.target.value)}
              style={{ ...styles.input, cursor: 'pointer' }}
              onFocus={e => (e.target.style.borderColor = '#8B4513')}
              onBlur={e => (e.target.style.borderColor = '#D2B48C')}
            >
              <option value="finance">Finance</option>
              <option value="management">Management</option>
              <option value="internal">Internal</option>
            </select>
            <p style={{ color: '#8B7355', fontSize: '12px', margin: 0 }}>
              {VIEW_TYPE_DESCRIPTIONS[s.view_type]}
            </p>
          </div>
        </div>
      ))}
      {stakeholders.length < 3 && (
        <button
          type="button"
          onClick={add}
          style={{
            background: 'none',
            border: '2px dashed #D2B48C',
            borderRadius: '10px',
            padding: '12px',
            color: '#8B7355',
            fontSize: '13px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          + Add stakeholder
        </button>
      )}
    </div>
  )
}

// ─── Step 4: Schedule ───────────────────────────────────────────────────────

const WEEKLY_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const MONTHLY_DAYS = ['1st of the month', '15th of the month']
const TIME_OPTIONS = [
  { label: 'Morning (8am)', value: '08:00' },
  { label: 'Midday (12pm)', value: '12:00' },
  { label: 'Afternoon (5pm)', value: '17:00' },
]

function Step4({
  frequency, setFrequency,
  day, setDay,
  time, setTime,
}: {
  frequency: string; setFrequency: (v: string) => void
  day: string; setDay: (v: string) => void
  time: string; setTime: (v: string) => void
}) {
  const days = frequency === 'weekly' ? WEEKLY_DAYS : MONTHLY_DAYS

  const timeLabel = TIME_OPTIONS.find(t => t.value === time)?.label ?? ''
  const dayDisplay = frequency === 'weekly' ? `every ${day}` : `on the ${day}`
  const timeDisplay = time === '08:00' ? '8:00 AM' : time === '12:00' ? '12:00 PM' : '5:00 PM'
  const preview = `Your reports will be delivered ${dayDisplay} at ${timeDisplay}`

  const optionBtn = (label: string, current: string, onClick: () => void) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 18px',
        borderRadius: '8px',
        border: `2px solid ${current === label.toLowerCase() || current === label ? '#8B4513' : '#D2B48C'}`,
        background: (current === label.toLowerCase() || current === label) ? '#8B4513' : 'white',
        color: (current === label.toLowerCase() || current === label) ? 'white' : '#4A2C2A',
        fontWeight: 600,
        fontSize: '13px',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <label style={styles.label}>Frequency</label>
        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          {optionBtn('Weekly', frequency, () => { setFrequency('weekly'); setDay('Monday') })}
          {optionBtn('Monthly', frequency, () => { setFrequency('monthly'); setDay('1st of the month') })}
        </div>
      </div>

      <div>
        <label style={styles.label}>Delivery Day</label>
        <select
          value={day}
          onChange={e => setDay(e.target.value)}
          style={{ ...styles.input, marginTop: '8px', cursor: 'pointer' }}
          onFocus={e => (e.target.style.borderColor = '#8B4513')}
          onBlur={e => (e.target.style.borderColor = '#D2B48C')}
        >
          {days.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div>
        <label style={styles.label}>Time</label>
        <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
          {TIME_OPTIONS.map(t => optionBtn(t.label, timeLabel, () => setTime(t.value)))}
        </div>
      </div>

      <div style={{
        background: '#FFF8F0',
        border: '1px solid #D2B48C',
        borderRadius: '10px',
        padding: '14px 16px',
        color: '#4A2C2A',
        fontSize: '14px',
        fontWeight: 500,
      }}>
        📅 {preview}
      </div>
    </div>
  )
}

// ─── Main Onboarding Component ───────────────────────────────────────────────

export function Onboarding() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, isLoaded: userLoaded } = useUser()
  const tenantId = searchParams.get('tenant') || (user?.publicMetadata?.tenant_id as string) || ''

  useEffect(() => {
    console.log('tenant_id:', tenantId)
  }, [tenantId])

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState(true)

  // Step 1 state
  const [brandUrl, setBrandUrl] = useState('')
  const [northStar, setNorthStar] = useState('lead_generation')

  // Step 2 state
  const [connections, setConnections] = useState<ConnectionStatus>({ google: false, meta: false, linkedin: false })

  // Step 3 state
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([
    { id: 1, name: 'Finance Director', email: '', view_type: 'finance' },
    { id: 2, name: 'CEO / Management', email: '', view_type: 'management' },
    { id: 3, name: 'Marketing (Self)', email: '', view_type: 'internal' },
  ])

  // Step 4 state
  const [frequency, setFrequency] = useState('weekly')
  const [day, setDay] = useState('Monday')
  const [time, setTime] = useState('08:00')

  const fetchStatus = useCallback(async () => {
    if (!tenantId) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/onboarding/status?tenant_id=${tenantId}`)
      if (res.ok) {
        const data = await res.json()
        setConnections(data.connections || { google: false, meta: false, linkedin: false })
      }
    } catch (_) {}
  }, [tenantId])

  // Load saved progress on mount
  useEffect(() => {
    if (!tenantId) { setLoadingStatus(false); return }

    const loadProgress = async () => {
      try {
        const [statusRes, getStartedRes, stakeholdersRes, scheduleRes] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/api/onboarding/status?tenant_id=${tenantId}`),
          fetch(`${API_BASE_URL}/api/onboarding/get-started?tenant_id=${tenantId}`),
          fetch(`${API_BASE_URL}/api/onboarding/stakeholders?tenant_id=${tenantId}`),
          fetch(`${API_BASE_URL}/api/onboarding/schedule?tenant_id=${tenantId}`),
        ])

        if (statusRes.status === 'fulfilled' && statusRes.value.ok) {
          const data = await statusRes.value.json()
          setConnections(data.connections || { google: false, meta: false, linkedin: false })
        }

        if (getStartedRes.status === 'fulfilled' && getStartedRes.value.ok) {
          const data = await getStartedRes.value.json()
          if (data.brand_url) setBrandUrl(data.brand_url)
          if (data.north_star_focus) setNorthStar(data.north_star_focus)
        }

        if (stakeholdersRes.status === 'fulfilled' && stakeholdersRes.value.ok) {
          const data = await stakeholdersRes.value.json()
          if (Array.isArray(data) && data.length > 0) {
            setStakeholders(data.map((s: any, i: number) => ({
              id: s.id || i + 1,
              name: s.name || '',
              email: s.email || '',
              view_type: s.view_type || 'internal',
            })))
          } else {
            // Load smart defaults
            const defaultsRes = await fetch(`${API_BASE_URL}/api/onboarding/defaults`)
            if (defaultsRes.ok) {
              const defaults = await defaultsRes.json()
              if (defaults.stakeholder_templates) {
                setStakeholders(defaults.stakeholder_templates.map((t: any, i: number) => ({
                  id: i + 1,
                  name: t.name,
                  email: '',
                  view_type: t.view_type,
                })))
              }
            }
          }
        }

        if (scheduleRes.status === 'fulfilled' && scheduleRes.value.ok) {
          const data = await scheduleRes.value.json()
          if (data.report_frequency) setFrequency(data.report_frequency)
          if (data.report_day) setDay(data.report_day)
          if (data.report_time) setTime(data.report_time)
        }
      } finally {
        setLoadingStatus(false)
      }
    }

    loadProgress()
  }, [tenantId])

  // Re-fetch connection status when tab regains focus (user returns from OAuth)
  useEffect(() => {
    window.addEventListener('focus', fetchStatus)
    return () => window.removeEventListener('focus', fetchStatus)
  }, [fetchStatus])

  const canProceed = () => {
    if (step === 1) return brandUrl.trim().length > 0
    if (step === 2) return connections.google || connections.meta || connections.linkedin
    if (step === 3) return stakeholders.some(s => s.name.trim().length > 0)
    return true
  }

  const handleNext = async () => {
    if (!canProceed()) return
    setSaving(true)
    try {
      if (step === 1) {
        let url = brandUrl.trim()
        if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url
          setBrandUrl(url)
        }
        await fetch(`${API_BASE_URL}/api/onboarding/get-started`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenant_id: tenantId, brand_url: url, north_star_focus: northStar }),
        })
        setStep(2)
      } else if (step === 2) {
        setStep(3)
      } else if (step === 3) {
        const validStakeholders = stakeholders.filter(s => s.name.trim())
        await fetch(`${API_BASE_URL}/api/onboarding/stakeholders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenant_id: tenantId,
            stakeholders: validStakeholders.map(s => ({
              name: s.name,
              email: s.email || null,
              view_type: s.view_type,
              metrics_visible: [],
            })),
          }),
        })
        setStep(4)
      } else if (step === 4) {
        await fetch(`${API_BASE_URL}/api/onboarding/schedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenant_id: tenantId,
            report_frequency: frequency,
            report_day: day,
            report_time: time,
          }),
        })
        navigate(`/?tenant=${tenantId}`)
      }
    } finally {
      setSaving(false)
    }
  }

  if (!userLoaded || loadingStatus) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} style={{ color: '#8B4513', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={styles.heading}>Let's set up your dashboard</h1>
          <p style={styles.subtext}>
            This takes about 2 minutes. Tell us about your business, connect your platforms, and you're ready to go.
          </p>
        </div>

        <StepIndicator current={step} />

        {/* Step content card */}
        <div style={styles.card}>
          {step === 1 && (
            <Step1
              brandUrl={brandUrl} setBrandUrl={setBrandUrl}
              northStar={northStar} setNorthStar={setNorthStar}
            />
          )}
          {step === 2 && (
            <Step2 connections={connections} tenantId={tenantId} />
          )}
          {step === 3 && (
            <Step3 stakeholders={stakeholders} setStakeholders={setStakeholders} />
          )}
          {step === 4 && (
            <Step4
              frequency={frequency} setFrequency={setFrequency}
              day={day} setDay={setDay}
              time={time} setTime={setTime}
            />
          )}

          {/* Navigation */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid #F0E8D8',
          }}>
            {step > 1 ? (
              <button type="button" onClick={() => setStep(step - 1)} style={styles.btnBack}>
                ← Back
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed() || saving}
              style={canProceed() && !saving ? styles.btnPrimary : styles.btnPrimaryDisabled}
            >
              {saving ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Saving...
                </span>
              ) : step === 4 ? (
                'Launch Dashboard →'
              ) : (
                'Next →'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

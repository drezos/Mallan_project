import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompanyData {
  companyName: string
  website: string
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

const STEPS = ['Your Company', 'Your Platforms', 'Your Goal']

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 0,
      marginBottom: 40,
    }}>
      {STEPS.map((label, idx) => {
        const stepNum = idx + 1
        const isCompleted = stepNum < currentStep
        const isActive = stepNum === currentStep

        const circleStyle: React.CSSProperties = {
          width: 28,
          height: 28,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 600,
          flexShrink: 0,
          ...(isCompleted
            ? { background: '#228B22', color: '#fff', border: 'none' }
            : isActive
            ? { background: '#8B4513', color: '#fff', border: 'none' }
            : { background: 'transparent', color: '#D2B48C', border: '2px solid #D2B48C' }),
        }

        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: idx < STEPS.length - 1 ? 1 : undefined }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={circleStyle}>
                {isCompleted ? '✓' : stepNum}
              </div>
              <span style={{
                fontSize: 11,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#4A2C2A' : '#B8A898',
                whiteSpace: 'nowrap',
              }}>
                {label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div style={{
                flex: 1,
                height: 2,
                background: isCompleted ? '#228B22' : '#D2B48C',
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

// ─── Step 1: Your Company ─────────────────────────────────────────────────────

function Step1Form({
  data,
  onNext,
}: {
  data: CompanyData
  onNext: (data: CompanyData) => void
}) {
  const [companyName, setCompanyName] = useState(data.companyName)
  const [website, setWebsite] = useState(data.website)
  const [websiteError, setWebsiteError] = useState('')

  const isUrlValid = (url: string) =>
    url === '' || url.startsWith('http://') || url.startsWith('https://')

  const canSubmit =
    companyName.trim() !== '' &&
    website.trim() !== '' &&
    isUrlValid(website)

  function handleWebsiteBlur() {
    if (website && !isUrlValid(website)) {
      setWebsiteError('URL must start with http:// or https://')
    } else {
      setWebsiteError('')
    }
  }

  function handleNext() {
    if (!canSubmit) return
    onNext({ companyName: companyName.trim(), website: website.trim() })
  }

  return (
    <div>
      <h2 style={{
        fontFamily: 'Comfortaa, system-ui, sans-serif',
        fontSize: 26,
        fontWeight: 700,
        color: '#4A2C2A',
        margin: '0 0 8px',
      }}>
        Tell us about your company
      </h2>
      <p style={{
        fontSize: 15,
        color: '#8B7355',
        margin: '0 0 32px',
        fontFamily: 'system-ui, sans-serif',
      }}>
        We'll use this to personalise your dashboard.
      </p>

      {/* Company Name */}
      <div style={{ marginBottom: 24 }}>
        <label style={{
          display: 'block',
          fontSize: 13,
          fontWeight: 600,
          color: '#4A2C2A',
          marginBottom: 6,
          fontFamily: 'system-ui, sans-serif',
        }}>
          Company name
        </label>
        <input
          type="text"
          value={companyName}
          onChange={e => setCompanyName(e.target.value)}
          placeholder="e.g. Acme Corp"
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '1.5px solid #D2B48C',
            borderRadius: 8,
            fontSize: 15,
            fontFamily: 'system-ui, sans-serif',
            color: '#4A2C2A',
            background: '#fff',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => { e.target.style.borderColor = '#8B4513' }}
          onBlur={e => { e.target.style.borderColor = '#D2B48C' }}
        />
      </div>

      {/* Website */}
      <div style={{ marginBottom: 32 }}>
        <label style={{
          display: 'block',
          fontSize: 13,
          fontWeight: 600,
          color: '#4A2C2A',
          marginBottom: 6,
          fontFamily: 'system-ui, sans-serif',
        }}>
          Your website
        </label>
        <input
          type="text"
          value={website}
          onChange={e => { setWebsite(e.target.value); setWebsiteError('') }}
          onBlur={handleWebsiteBlur}
          placeholder="e.g. https://acme.com"
          style={{
            width: '100%',
            padding: '10px 14px',
            border: `1.5px solid ${websiteError ? '#cc3300' : '#D2B48C'}`,
            borderRadius: 8,
            fontSize: 15,
            fontFamily: 'system-ui, sans-serif',
            color: '#4A2C2A',
            background: '#fff',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => { e.target.style.borderColor = '#8B4513' }}
        />
        {websiteError && (
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#cc3300', fontFamily: 'system-ui, sans-serif' }}>
            {websiteError}
          </p>
        )}
      </div>

      {/* Next button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleNext}
          disabled={!canSubmit}
          style={{
            padding: '11px 32px',
            borderRadius: 8,
            border: 'none',
            fontFamily: 'Comfortaa, system-ui, sans-serif',
            fontWeight: 600,
            fontSize: 15,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            background: canSubmit ? '#FF8C00' : '#D2B48C',
            color: canSubmit ? '#fff' : '#4A2C2A',
            transition: 'background 0.15s',
          }}
        >
          Next
        </button>
      </div>
    </div>
  )
}

// ─── Step 2 placeholder ───────────────────────────────────────────────────────

function Step2Placeholder({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '16px 0' }}>
      <h2 style={{
        fontFamily: 'Comfortaa, system-ui, sans-serif',
        fontSize: 24,
        fontWeight: 700,
        color: '#4A2C2A',
        margin: '0 0 16px',
      }}>
        Step 2 coming soon
      </h2>
      <p style={{ color: '#8B7355', fontSize: 15, margin: '0 0 32px', fontFamily: 'system-ui, sans-serif' }}>
        We're still building this step. Check back soon!
      </p>
      <button
        onClick={onBack}
        style={{
          padding: '10px 28px',
          borderRadius: 8,
          border: '1.5px solid #8B4513',
          background: 'transparent',
          color: '#8B4513',
          fontFamily: 'Comfortaa, system-ui, sans-serif',
          fontWeight: 600,
          fontSize: 15,
          cursor: 'pointer',
        }}
      >
        Back
      </button>
    </div>
  )
}

// ─── Hero panel copy per step ─────────────────────────────────────────────────

const HERO_HEADLINES: Record<number, string> = {
  1: 'All your marketing data. One dashboard.',
  2: 'Connect the tools you already use.',
  3: 'Set a goal. Track what matters.',
}

// ─── Main Onboarding component ────────────────────────────────────────────────

export function Onboarding() {
  const { user } = useUser()
  const clerkId = user?.id

  const [tenantId, setTenantId] = useState<string | null>(null)
  const [tenantLoading, setTenantLoading] = useState(true)

  const [currentStep, setCurrentStep] = useState(1)
  const [companyData, setCompanyData] = useState<CompanyData>({ companyName: '', website: '' })

  // Resolve tenant_id from Clerk user ID
  useEffect(() => {
    if (!clerkId) return

    const apiUrl = import.meta.env.VITE_API_URL as string
    fetch(`${apiUrl}/api/onboarding/tenant?clerk_id=${clerkId}`)
      .then(res => res.json())
      .then(data => {
        const id: string = data.tenant_id ?? null
        setTenantId(id)
        console.log('clerk_id:', clerkId, 'tenant_id:', id)
      })
      .catch(err => {
        console.error('Failed to resolve tenant_id:', err)
        setTenantId(null)
      })
      .finally(() => setTenantLoading(false))
  }, [clerkId])

  console.log('tenant_id:', tenantId)

  // ── Loading spinner (while resolving tenant_id) ──────────────────────────
  if (tenantLoading || !clerkId) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#F5F5DC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '4px solid #D2B48C',
          borderTopColor: '#8B4513',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ── Layout ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }

        .onboarding-root {
          min-height: 100vh;
          display: flex;
        }

        .onboarding-hero {
          width: 50%;
          background: #8B4513;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 40px;
        }

        .onboarding-form-panel {
          width: 50%;
          background: #F5F5DC;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 56px;
        }

        .onboarding-form-inner {
          width: 100%;
          max-width: 420px;
        }

        @media (max-width: 767px) {
          .onboarding-root { flex-direction: column; }
          .onboarding-hero { display: none; }
          .onboarding-form-panel { width: 100%; padding: 40px 24px; }
        }
      `}</style>

      <div className="onboarding-root">
        {/* ── Left: Hero panel ── */}
        <div className="onboarding-hero">
          <p style={{
            fontFamily: 'Comfortaa, system-ui, sans-serif',
            fontSize: 34,
            fontWeight: 700,
            color: '#fff',
            textAlign: 'center',
            lineHeight: 1.35,
            margin: '0 0 32px',
          }}>
            {HERO_HEADLINES[currentStep] ?? HERO_HEADLINES[1]}
          </p>
          {/* WeeklyBrew wordmark */}
          <p style={{
            fontFamily: 'Comfortaa, system-ui, sans-serif',
            fontSize: 18,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.65)',
            margin: 0,
            letterSpacing: '0.04em',
          }}>
            ☕ WeeklyBrew
          </p>
        </div>

        {/* ── Right: Form panel ── */}
        <div className="onboarding-form-panel">
          <div className="onboarding-form-inner">
            <StepIndicator currentStep={currentStep} />

            {currentStep === 1 && (
              <Step1Form
                data={companyData}
                onNext={data => {
                  setCompanyData(data)
                  setCurrentStep(2)
                }}
              />
            )}

            {currentStep === 2 && (
              <Step2Placeholder onBack={() => setCurrentStep(1)} />
            )}
          </div>
        </div>
      </div>
    </>
  )
}

import { Link } from 'react-router-dom'

export function Onboarding() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F5DC',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontFamily: 'Comfortaa, system-ui, sans-serif',
          fontSize: 28,
          fontWeight: 700,
          color: '#4A2C2A',
          margin: '0 0 12px',
        }}>
          Onboarding coming soon
        </h1>
        <p style={{ color: '#8B7355', fontSize: 15, margin: '0 0 28px' }}>
          We're still building this. Head to your dashboard for now.
        </p>
        <Link
          to="/dashboard"
          style={{
            display: 'inline-block',
            padding: '10px 24px',
            borderRadius: 8,
            background: '#FF8C00',
            color: '#fff',
            fontWeight: 600,
            fontSize: 15,
            textDecoration: 'none',
          }}
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}

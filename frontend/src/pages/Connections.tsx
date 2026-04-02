import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

interface ConnectionStatus {
  google: boolean;
  meta: boolean;
  linkedin: boolean;
}

const GoogleIcon = () => (
  <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M35.44 24.28c0-.9-.08-1.76-.22-2.6H24v4.92h6.4a5.46 5.46 0 0 1-2.37 3.58v2.97h3.84c2.25-2.07 3.57-5.12 3.57-8.87z" fill="#4285F4" />
    <path d="M24 36c3.24 0 5.95-1.07 7.93-2.9l-3.84-2.98c-1.07.72-2.44 1.14-4.09 1.14-3.14 0-5.8-2.12-6.75-4.97H13.3v3.07A11.98 11.98 0 0 0 24 36z" fill="#34A853" />
    <path d="M17.25 26.29a7.18 7.18 0 0 1 0-4.58V18.64H13.3a11.98 11.98 0 0 0 0 10.72l3.95-3.07z" fill="#FBBC05" />
    <path d="M24 16.74c1.77 0 3.36.61 4.61 1.8l3.46-3.46A11.95 11.95 0 0 0 24 12a11.98 11.98 0 0 0-10.7 6.64l3.95 3.07c.95-2.85 3.61-4.97 6.75-4.97z" fill="#EA4335" />
  </svg>
);

const MetaIcon = () => (
  <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M24 10C16.27 10 10 16.27 10 24c0 6.99 5.12 12.77 11.82 13.82V28.2h-3.56V24h3.56v-3.09c0-3.51 2.09-5.45 5.29-5.45 1.53 0 3.13.27 3.13.27v3.45h-1.76c-1.74 0-2.28 1.08-2.28 2.18V24h3.88l-.62 4.2h-3.26v9.62C32.88 36.77 38 30.99 38 24c0-7.73-6.27-14-14-14z" fill="#1877F2" />
  </svg>
);

const LinkedInIcon = () => (
  <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M16.5 20h3v12h-3V20zm1.5-4.75a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5zM22 20h2.88v1.64h.04c.4-.76 1.38-1.56 2.84-1.56C30.88 20.08 32 21.6 32 24.56V32h-3v-6.96c0-1.66-.03-3.8-2.32-3.8-2.32 0-2.68 1.81-2.68 3.68V32H22V20z" fill="#0A66C2" />
  </svg>
);

const PlugIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M20 8v16M44 8v16" stroke="#D2B48C" strokeWidth="4" strokeLinecap="round" />
    <rect x="12" y="24" width="40" height="16" rx="6" fill="#D2B48C" fillOpacity="0.3" stroke="#D2B48C" strokeWidth="3" />
    <path d="M32 40v8M26 48h12" stroke="#D2B48C" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const platforms = [
  {
    key: 'google',
    title: 'Google',
    description: 'Google Analytics, Google Ads, Search Console',
    Icon: GoogleIcon,
  },
  {
    key: 'meta',
    title: 'Meta',
    description: 'Meta Ads, Facebook Page, Instagram',
    Icon: MetaIcon,
  },
  {
    key: 'linkedin',
    title: 'LinkedIn',
    description: 'LinkedIn Ads, LinkedIn Page',
    Icon: LinkedInIcon,
  },
];

export function Connections() {
  const [searchParams] = useSearchParams();
  const tenantId = searchParams.get('tenant') || undefined;

  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  void showModal; // consumed by next PR's modal

  const fetchStatus = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/onboarding/status?tenant_id=${tenantId}`
      );
      if (res.ok) {
        const data = await res.json();
        setStatus(data.connections ?? data);
      }
    } catch {
      // silently fail — status stays null
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    window.addEventListener('focus', fetchStatus);
    return () => window.removeEventListener('focus', fetchStatus);
  }, [fetchStatus]);

  const handleConnect = (platform: string) => {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/connect/${platform}?tenant_id=${tenantId}`;
  };

  // Suppress unused warning — modal wiring comes in next PR
  void handleConnect;

  const connectedPlatforms = platforms.filter((p) => status?.[p.key]);
  const anyConnected = connectedPlatforms.length > 0;
  const allConnected = status !== null && status.google && status.meta && status.linkedin;

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
      >
        <span style={{ color: '#6B5B5B', fontFamily: 'system-ui, sans-serif', fontSize: '0.95rem' }}>
          Loading…
        </span>
      </div>
    );
  }

  /* ── Empty state ── */
  if (!anyConnected) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
          padding: '40px 20px',
        }}
      >
        <PlugIcon />
        <h1
          style={{
            fontFamily: "'Comfortaa', sans-serif",
            fontWeight: 600,
            color: '#4A2C2A',
            fontSize: '1.5rem',
            marginTop: '24px',
            marginBottom: '12px',
          }}
        >
          No active connections yet
        </h1>
        <p
          style={{
            fontFamily: 'system-ui, sans-serif',
            color: '#6B5B5B',
            fontSize: '1rem',
            marginBottom: '36px',
            maxWidth: '400px',
            lineHeight: 1.6,
          }}
        >
          Connect your marketing platforms to start seeing real data.
        </p>
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: '#FF8C00',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '14px 32px',
            fontSize: '1rem',
            fontFamily: "'Comfortaa', sans-serif",
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#e07a00';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#FF8C00';
          }}
        >
          + Connect new source
        </button>
      </div>
    );
  }

  /* ── Active connections list ── */
  return (
    <div>
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}
      >
        <h1
          style={{
            fontFamily: "'Comfortaa', sans-serif",
            fontWeight: 700,
            color: '#4A2C2A',
            fontSize: '1.75rem',
            margin: 0,
          }}
        >
          Connections
        </h1>
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: '#FF8C00',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '0.875rem',
            fontFamily: "'Comfortaa', sans-serif",
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#e07a00';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#FF8C00';
          }}
        >
          + Connect new source
        </button>
      </div>

      {/* Connected platforms card */}
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          maxWidth: '680px',
          overflow: 'hidden',
        }}
      >
        {connectedPlatforms.map((platform, index) => (
          <div
            key={platform.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: index < connectedPlatforms.length - 1 ? '1px solid #E8DCC8' : 'none',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = '#FAFAF5';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = '#fff';
            }}
          >
            {/* Left: icon + text */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ flexShrink: 0 }}>
                <platform.Icon />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: 'system-ui, sans-serif',
                    fontWeight: 700,
                    color: '#4A2C2A',
                    fontSize: '0.95rem',
                    marginBottom: '2px',
                  }}
                >
                  {platform.title}
                </div>
                <div
                  style={{
                    fontFamily: 'system-ui, sans-serif',
                    color: '#6B5B5B',
                    fontSize: '0.85rem',
                  }}
                >
                  {platform.description}
                </div>
              </div>
            </div>

            {/* Right: green dot + Connected */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#228B22',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: 'system-ui, sans-serif',
                  color: '#228B22',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                Connected
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Prompt to connect more if not all are connected */}
      {!allConnected && (
        <p
          style={{
            fontFamily: 'system-ui, sans-serif',
            color: '#6B5B5B',
            fontSize: '0.85rem',
            fontStyle: 'italic',
            marginTop: '16px',
            maxWidth: '680px',
          }}
        >
          Connect more platforms to see all your data in one place.
        </p>
      )}
    </div>
  );
}

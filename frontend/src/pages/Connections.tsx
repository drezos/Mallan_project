import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

interface ConnectionStatus {
  google: boolean;
  meta: boolean;
  linkedin: boolean;
}

const platforms = [
  {
    key: 'google' as const,
    title: 'Google',
    description: 'Google Analytics, Google Ads, Search Console',
    badges: ['Website', 'Ads', 'Brand'],
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="48" height="48" rx="10" fill="#F8F8F8" />
        <path d="M35.44 24.28c0-.9-.08-1.76-.22-2.6H24v4.92h6.4a5.46 5.46 0 0 1-2.37 3.58v2.97h3.84c2.25-2.07 3.57-5.12 3.57-8.87z" fill="#4285F4" />
        <path d="M24 36c3.24 0 5.95-1.07 7.93-2.9l-3.84-2.98c-1.07.72-2.44 1.14-4.09 1.14-3.14 0-5.8-2.12-6.75-4.97H13.3v3.07A11.98 11.98 0 0 0 24 36z" fill="#34A853" />
        <path d="M17.25 26.29a7.18 7.18 0 0 1 0-4.58V18.64H13.3a11.98 11.98 0 0 0 0 10.72l3.95-3.07z" fill="#FBBC05" />
        <path d="M24 16.74c1.77 0 3.36.61 4.61 1.8l3.46-3.46A11.95 11.95 0 0 0 24 12a11.98 11.98 0 0 0-10.7 6.64l3.95 3.07c.95-2.85 3.61-4.97 6.75-4.97z" fill="#EA4335" />
      </svg>
    ),
  },
  {
    key: 'meta' as const,
    title: 'Meta',
    description: 'Meta Ads, Facebook Page, Instagram',
    badges: ['Ads', 'Social', 'Social'],
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="48" height="48" rx="10" fill="#F0F4FF" />
        <path d="M24 10C16.27 10 10 16.27 10 24c0 6.99 5.12 12.77 11.82 13.82V28.2h-3.56V24h3.56v-3.09c0-3.51 2.09-5.45 5.29-5.45 1.53 0 3.13.27 3.13.27v3.45h-1.76c-1.74 0-2.28 1.08-2.28 2.18V24h3.88l-.62 4.2h-3.26v9.62C32.88 36.77 38 30.99 38 24c0-7.73-6.27-14-14-14z" fill="#0081FB" />
      </svg>
    ),
  },
  {
    key: 'linkedin' as const,
    title: 'LinkedIn',
    description: 'LinkedIn Ads, LinkedIn Page',
    badges: ['Ads', 'Social'],
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="48" height="48" rx="10" fill="#E8F0F9" />
        <path d="M16.5 20h3v12h-3V20zm1.5-4.75a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5zM22 20h2.88v1.64h.04c.4-.76 1.38-1.56 2.84-1.56C30.88 20.08 32 21.6 32 24.56V32h-3v-6.96c0-1.66-.03-3.8-2.32-3.8-2.32 0-2.68 1.81-2.68 3.68V32H22V20z" fill="#0A66C2" />
      </svg>
    ),
  },
];

export function Connections() {
  const [searchParams] = useSearchParams();
  const tenantId = searchParams.get('tenant') || undefined;

  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);

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
      // silently fail — buttons will stay in loading/unknown state
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

  return (
    <div>
      <h1
        style={{
          fontFamily: "'Comfortaa', sans-serif",
          fontWeight: 700,
          color: '#4A2C2A',
          fontSize: '1.75rem',
          marginBottom: '0.5rem',
        }}
      >
        Connections
      </h1>
      <p
        style={{
          color: '#6B5B5B',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '0.95rem',
          marginBottom: '1.75rem',
        }}
      >
        Connect your platforms to start seeing real data in your dashboard.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '680px' }}>
        {platforms.map((platform) => {
          const connected = status ? status[platform.key] : false;

          return (
            <div
              key={platform.key}
              style={{
                background: '#fff',
                border: '1px solid #E8DCC8',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
              }}
            >
              {/* Left: icon + info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ flexShrink: 0 }}>{platform.icon}</div>
                <div>
                  <div
                    style={{
                      fontFamily: 'system-ui, sans-serif',
                      fontWeight: 600,
                      color: '#4A2C2A',
                      fontSize: '1rem',
                      marginBottom: '2px',
                    }}
                  >
                    {platform.title}
                  </div>
                  <div
                    style={{
                      color: '#6B5B5B',
                      fontFamily: 'system-ui, sans-serif',
                      fontSize: '0.875rem',
                      marginBottom: '8px',
                    }}
                  >
                    {platform.description}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {platform.badges.map((badge, i) => (
                      <span
                        key={i}
                        style={{
                          background: '#D2B48C',
                          color: '#4A2C2A',
                          fontSize: '12px',
                          fontFamily: 'system-ui, sans-serif',
                          fontWeight: 500,
                          borderRadius: '999px',
                          padding: '2px 10px',
                        }}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: button */}
              <div style={{ flexShrink: 0 }}>
                {loading ? (
                  <button
                    disabled
                    style={{
                      background: '#D2B48C',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 24px',
                      fontSize: '0.875rem',
                      fontFamily: 'system-ui, sans-serif',
                      fontWeight: 600,
                      cursor: 'not-allowed',
                      opacity: 0.7,
                    }}
                  >
                    Checking...
                  </button>
                ) : connected ? (
                  <button
                    disabled
                    style={{
                      background: '#228B22',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 24px',
                      fontSize: '0.875rem',
                      fontFamily: 'system-ui, sans-serif',
                      fontWeight: 600,
                      cursor: 'not-allowed',
                    }}
                  >
                    Connected ✓
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(platform.key)}
                    style={{
                      background: '#FF8C00',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 24px',
                      fontSize: '0.875rem',
                      fontFamily: 'system-ui, sans-serif',
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
                    Connect
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

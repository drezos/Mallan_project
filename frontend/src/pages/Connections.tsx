import { useState, useEffect, useCallback, useRef } from 'react';
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
  const prevStatusRef = useRef<ConnectionStatus | null>(null);

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

  // Auto-close modal when a new platform gets connected (e.g. after OAuth redirect)
  useEffect(() => {
    if (showModal && prevStatusRef.current && status) {
      const prev = prevStatusRef.current;
      if (
        (!prev.google && status.google) ||
        (!prev.meta && status.meta) ||
        (!prev.linkedin && status.linkedin)
      ) {
        setShowModal(false);
      }
    }
    prevStatusRef.current = status;
  }, [status, showModal]);

  const connectedPlatforms = platforms.filter((p) => status?.[p.key as keyof ConnectionStatus]);
  const anyConnected = connectedPlatforms.length > 0;
  const allConnected = status !== null && status.google && status.meta && status.linkedin;

  // Individual platform cards for the modal
  const modalPlatforms: { key: string; label: string; color: string; icon: JSX.Element }[] = [];

  if (!status?.google) {
    modalPlatforms.push(
      {
        key: 'google', label: 'Google Analytics', color: '#E37400',
        icon: (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="2" y="13" width="5" height="7" rx="1" fill="#E37400" />
            <rect x="9.5" y="8" width="5" height="12" rx="1" fill="#E37400" />
            <rect x="17" y="4" width="5" height="16" rx="1" fill="#E37400" />
          </svg>
        ),
      },
      {
        key: 'google', label: 'Google Ads', color: '#4285F4',
        icon: (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <polygon points="5,3 21,12 5,21" fill="#4285F4" />
          </svg>
        ),
      },
      {
        key: 'google', label: 'Google Search Console', color: '#4285F4',
        icon: (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="10" cy="10" r="6" stroke="#4285F4" strokeWidth="2.5" fill="none" />
            <line x1="14.8" y1="14.8" x2="21" y2="21" stroke="#4285F4" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        ),
      },
    );
  }

  if (!status?.meta) {
    modalPlatforms.push(
      {
        key: 'meta', label: 'Meta Ads', color: '#0081FB',
        icon: (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M12 12C11 9.5 9 7.5 6.5 7.5C4 7.5 2 9.5 2 12C2 14.5 4 16.5 6.5 16.5C9 16.5 11 14.5 12 12Z" stroke="#0081FB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 12C13 14.5 15 16.5 17.5 16.5C20 16.5 22 14.5 22 12C22 9.5 20 7.5 17.5 7.5C15 7.5 13 9.5 12 12Z" stroke="#0081FB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        key: 'meta', label: 'Facebook', color: '#1877F2',
        icon: (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M13 21v-8h2.6l.4-3H13V8.5C13 7.7 13.3 7 14.5 7H16V4.2C15.2 4.1 14.3 4 13.2 4 10.8 4 9.5 5.4 9.5 8.3V10H7v3h2.5v8H13z" fill="#1877F2" />
          </svg>
        ),
      },
      {
        key: 'meta', label: 'Instagram', color: '#E4405F',
        icon: (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" stroke="#E4405F" strokeWidth="2" />
            <circle cx="12" cy="12" r="4" stroke="#E4405F" strokeWidth="2" />
            <circle cx="17.5" cy="6.5" r="1.2" fill="#E4405F" />
          </svg>
        ),
      },
    );
  }

  if (!status?.linkedin) {
    modalPlatforms.push(
      {
        key: 'linkedin', label: 'LinkedIn Ads', color: '#0A66C2',
        icon: (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="3" y="9" width="4" height="12" fill="#0A66C2" />
            <circle cx="5" cy="5" r="2.5" fill="#0A66C2" />
            <path d="M11 9h3.5v1.6C15 9.6 16.3 9 17.8 9 20.5 9 21 10.8 21 13.5V21h-3.5v-6.5c0-1.6-.5-2.5-1.8-2.5-1.5 0-2.2 1-2.2 2.7V21H11V9z" fill="#0A66C2" />
          </svg>
        ),
      },
      {
        key: 'linkedin', label: 'LinkedIn', color: '#0A66C2',
        icon: (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="3" y="9" width="4" height="12" fill="#0A66C2" />
            <circle cx="5" cy="5" r="2.5" fill="#0A66C2" />
            <path d="M11 9h3.5v1.6C15 9.6 16.3 9 17.8 9 20.5 9 21 10.8 21 13.5V21h-3.5v-6.5c0-1.6-.5-2.5-1.8-2.5-1.5 0-2.2 1-2.2 2.7V21H11V9z" fill="#0A66C2" />
          </svg>
        ),
      },
    );
  }

  const modalContent = showModal ? (
    <div
      onClick={() => setShowModal(false)}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          maxWidth: '560px',
          width: '90%',
          padding: '32px',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={() => setShowModal(false)}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: '#6B5B5B',
            lineHeight: 1,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#4A2C2A'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#6B5B5B'; }}
          aria-label="Close modal"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <line x1="4" y1="4" x2="16" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="16" y1="4" x2="4" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Header */}
        <h2 style={{
          fontFamily: "'Comfortaa', sans-serif",
          fontWeight: 600,
          color: '#4A2C2A',
          fontSize: '1.25rem',
          margin: '0 0 4px 0',
        }}>
          Connect new source
        </h2>
        <p style={{
          fontFamily: 'system-ui, sans-serif',
          color: '#6B5B5B',
          fontSize: '0.9rem',
          margin: '0 0 24px 0',
        }}>
          Select a platform to connect
        </p>

        {/* All connected state */}
        {allConnected ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="24" cy="24" r="20" fill="none" stroke="#228B22" strokeWidth="3" />
              <path d="M15 24l6 6 12-12" stroke="#228B22" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            <p style={{
              fontFamily: "'Comfortaa', sans-serif",
              fontWeight: 600,
              color: '#228B22',
              fontSize: '1.1rem',
              margin: '16px 0 20px 0',
            }}>
              All platforms connected!
            </p>
            <button
              onClick={() => setShowModal(false)}
              style={{
                background: 'none',
                border: '1px solid #D2B48C',
                borderRadius: '8px',
                padding: '10px 28px',
                fontFamily: 'system-ui, sans-serif',
                color: '#4A2C2A',
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        ) : (
          /* Platform grid */
          <div className="modal-platform-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
          }}>
            <style>{`
              @media (max-width: 600px) {
                .modal-platform-grid { grid-template-columns: repeat(2, 1fr) !important; }
              }
            `}</style>
            {modalPlatforms.map((p, i) => (
              <div
                key={`${p.key}-${i}`}
                onClick={() => {
                  setShowModal(false);
                  handleConnect(p.key);
                }}
                className="modal-platform-card"
                style={{
                  background: '#fff',
                  border: '1px solid #E8DCC8',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#8B4513';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#E8DCC8';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }}
              >
                {p.icon}
                <span style={{
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: '14px',
                  color: '#4A2C2A',
                  marginTop: '8px',
                  textAlign: 'center',
                  lineHeight: 1.3,
                }}>
                  {p.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  ) : null;

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
        {modalContent}
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
      {modalContent}
    </div>
  );
}

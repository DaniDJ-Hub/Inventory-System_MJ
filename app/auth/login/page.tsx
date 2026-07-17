'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Mail, Lock, Eye, EyeOff, ArrowRight,
  Package, Activity, Monitor, User, Loader2,
} from 'lucide-react'
import { signupSchema, firstZodError } from '@/lib/validations/schemas'


type Tab   = 'login' | 'signup'
type Field = 'email' | 'password' | 'firstName' | 'signupEmail' | 'signupPassword' | null

const FEATURES = [
  { icon: <Package  size={14} />, label: 'Inventario en tiempo real',       bg: 'rgba(129,140,248,.18)', color: '#818CF8' },
  { icon: <Activity size={14} />, label: 'Analytics y reportes avanzados',  bg: 'rgba(52,211,153,.16)',  color: '#34D399' },
  { icon: <Monitor  size={14} />, label: 'POS moderno multi-caja',          bg: 'rgba(251,191,36,.14)',  color: '#FBBF24' },
]
const STATS = [
  { value: '',   label: ''  },
  { value: '', label: '' },
]

export default function LoginPage() {
  const router = useRouter()

  /* ── UI state ── */
  const [tab,     setTab]     = useState<Tab>('login')
  const [mounted, setMounted] = useState(false)
  const [focused, setFocused] = useState<Field>(null)

  /* ── Login ── */
  const [loginEmail,    setLoginEmail]    = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPwd,  setShowLoginPwd]  = useState(false)
  const [loginLoading,  setLoginLoading]  = useState(false)

  /* ── Signup ── */
  const [firstName,      setFirstName]      = useState('')
  const [lastName,       setLastName]       = useState('')
  const [signupEmail,    setSignupEmail]    = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [showSignupPwd,  setShowSignupPwd]  = useState(false)
  const [signupLoading,  setSignupLoading]  = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60)
    return () => clearTimeout(t)
  }, [])

  /* ── Handlers ── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword })
      if (error) { toast.error(error.message); return }
      toast.success('Bienvenido de vuelta')
      router.push('/dashboard')
      router.refresh()
    } catch {
      toast.error('Error al iniciar sesión')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    // FIX (Alto #6): antes no había ninguna validación de contraseña en el
    // registro (Supabase Auth podía aceptar cualquier valor, dependiendo de
    // su configuración de proyecto). `signupSchema` aplica la misma política
    // de 10+ caracteres / mayúscula / minúscula / número usada en el resto
    // de la app.
    const parsed = signupSchema.safeParse({
      firstName,
      lastName,
      email: signupEmail,
      password: signupPassword,
    })
    if (!parsed.success) {
      toast.error(firstZodError(parsed))
      return
    }

    setSignupLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`,
          data: { first_name: parsed.data.firstName, last_name: parsed.data.lastName },
        },
      })
      if (error) { toast.error(error.message); return }
      toast.success('Revisa tu correo para confirmar tu cuenta')
    } catch {
      toast.error('Error al crear cuenta')
    } finally {
      setSignupLoading(false)
    }
  }

  /* ── Style helpers ── */
  const fieldStyle = (f: Field): React.CSSProperties => ({
    width: '100%', height: '46px',
    background: focused === f ? '#FFFFFF' : '#F8F7FF',
    border: `1.5px solid ${focused === f ? '#7C3AED' : '#E4E0F6'}`,
    borderRadius: '11px',
    color: '#1E1B3A', fontSize: '14px',
    fontFamily: "'DM Sans', -apple-system, sans-serif",
    padding: '0 44px 0 40px', outline: 'none',
    transition: 'border-color .2s ease, background .2s ease, box-shadow .2s ease',
    boxShadow: focused === f ? '0 0 0 3px rgba(124,58,237,.1)' : 'none',
    WebkitTextFillColor: '#1E1B3A',
  })
  const fieldStyleNoIcon = (f: Field): React.CSSProperties => ({
    ...fieldStyle(f),
    padding: '0 44px 0 13px',
  })
  const iconCol = (f: Field) => focused === f ? '#7C3AED' : '#B8B4D4'
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: 500,
    color: '#7B78A8', marginBottom: '7px', letterSpacing: '.02em',
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 40px #F8F7FF inset !important;
          -webkit-text-fill-color: #1E1B3A !important;
          caret-color: #1E1B3A;
        }
        input::placeholder { color: #BDB9D8 !important; }

        @keyframes orb-drift {
          0%,100% { transform: translate(0,0) scale(1); }
          35%      { transform: translate(18px,-12px) scale(1.04); }
          70%      { transform: translate(-12px,9px) scale(.97); }
        }
        @keyframes pf-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          from { left: -100%; }
          to   { left: 160%; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-dot {
          0%,100% { opacity: 1; }
          50%      { opacity: .45; }
        }
        @keyframes tab-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: .01ms !important; transition-duration: .01ms !important; }
        }
        @media (max-width: 680px) {
          .pf-left  { display: none !important; }
          .pf-right { width: 100% !important; border-left: none !important; }
        }
        .pf-tab-content { animation: tab-in .25s cubic-bezier(.2,.8,.3,1) both; }

        .pf-seg-btn {
          flex: 1; border: none; background: transparent;
          color: #9D96C8; font-family: inherit;
          font-size: 13px; font-weight: 500;
          padding: 7px 12px; border-radius: 8px;
          cursor: pointer; transition: all .18s ease;
        }
        .pf-seg-btn.active {
          background: #FFFFFF;
          color: #1E1B3A;
          box-shadow: 0 1px 6px rgba(79,70,229,.14), 0 1px 2px rgba(0,0,0,.06);
          font-weight: 600;
        }
        .pf-seg-btn:hover:not(.active) { color: #5B21B6; background: rgba(124,58,237,.05); }

        .pf-feature-row {
          display: flex; align-items: center; gap: 11px;
          padding: 10px 13px;
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 10px; cursor: default;
          transition: border-color .2s, background .2s;
        }
        .pf-feature-row:hover {
          background: rgba(255,255,255,.08) !important;
          border-color: rgba(167,139,250,.3) !important;
        }
      `}</style>

      {/* ── PAGE ─────────────────────────────────────────────── */}
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#F0EEFF',
        fontFamily: "'DM Sans', -apple-system, sans-serif",
        padding: '1.5rem',
      }}>

        {/* ── CARD ─────────────────────────────────────────── */}
        <div style={{
          display: 'flex', width: '100%', maxWidth: '680px',
          borderRadius: '22px', overflow: 'hidden',
          border: '1px solid rgba(109,40,217,.12)',
          boxShadow: '0 32px 80px rgba(79,70,229,.14), 0 8px 24px rgba(0,0,0,.07)',
          opacity: mounted ? 1 : 0,
          animation: mounted ? 'pf-fade-up .65s cubic-bezier(.16,1,.3,1) forwards' : 'none',
        }}>

          {/* ══ LEFT PANEL ══════════════════════════════════ */}
          <div className="pf-left" style={{
            flex: 1, minWidth: 0,
            background: 'linear-gradient(148deg,#1A0E3A 0%,#150B30 45%,#1C1140 100%)',
            padding: '44px 38px', display: 'flex', flexDirection: 'column',
            justifyContent: 'space-between', position: 'relative', overflow: 'hidden',
          }}>
            {/* Grid overlay */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),' +
                'linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)',
              backgroundSize: '48px 48px',
            }} />

            {/* Ambient orbs */}
            {[
              { w:320, h:320, bg:'#5B21B6', top:'-90px',   left:'-90px', delay:'0s',  op:.28 },
              { w:230, h:230, bg:'#4F46E5', top:'auto',     left:'auto',  bottom:'-70px', right:'0px', delay:'-4s', op:.22 },
              { w:150, h:150, bg:'#06B6D4', top:'42%',      left:'48%',   delay:'-2s', op:.14 },
            ].map((o, i) => (
              <div key={i} style={{
                position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
                width: o.w, height: o.h, background: o.bg,
                top: o.top, left: o.left,
                ...(o.bottom ? { bottom: o.bottom } : {}),
                ...(o.right  ? { right:  o.right  } : {}),
                filter: 'blur(72px)', opacity: o.op,
                animation: `orb-drift ${8 + i * 1.5}s ease-in-out infinite`,
                animationDelay: o.delay,
              }} />
            ))}

            {/* Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 2 }}>
              <div style={{
                width: '42px', height: '42px', flexShrink: 0,
                background: 'linear-gradient(145deg,#7C3AED,#4F46E5)',
                borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 6px 20px rgba(79,70,229,.5), 0 0 0 1px rgba(255,255,255,.15) inset',
                position: 'relative', overflow: 'hidden',
              }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                  <rect x="3" y="5" width="10" height="13" rx="2" fill="rgba(255,255,255,.22)" />
                  <rect x="6" y="3" width="10" height="13" rx="2" fill="rgba(255,255,255,.45)" />
                  <rect x="9" y="1" width="10" height="13" rx="2" fill="white" />
                  <line x1="12" y1="5.5"  x2="16.5" y2="5.5"  stroke="rgba(79,70,229,.6)" strokeWidth="1.3" strokeLinecap="round" />
                  <line x1="12" y1="8"    x2="16.5" y2="8"    stroke="rgba(79,70,229,.6)" strokeWidth="1.3" strokeLinecap="round" />
                  <line x1="12" y1="10.5" x2="15"   y2="10.5" stroke="rgba(79,70,229,.6)" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(180deg,rgba(255,255,255,.18),transparent)' }} />
              </div>
              <div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '24px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-.4px', lineHeight: 1 }}>
                  PaperFlow
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.46)', marginTop: '2px' }}>
                  Sistema de Inventario
                </div>
              </div>
            </div>

            {/* Hero copy */}
            <div style={{ position: 'relative', zIndex: 2, marginTop: '28px' }}>
              <h1 style={{
                fontFamily: "'Outfit',sans-serif", fontSize: '30px', fontWeight: 900,
                color: '#F8FAFC', letterSpacing: '-.7px', lineHeight: 1.18, marginBottom: '12px',
              }}>
                Control total<br />de tu{' '}
                <span style={{
                  background: 'linear-gradient(90deg,#A78BFA,#C4B5FD)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>papelería</span>
              </h1>

              {/* Feature rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginTop: '20px' }}>
                {FEATURES.map((f, i) => (
                  <div key={i} className="pf-feature-row">
                    <div style={{
                      width: '30px', height: '30px', borderRadius: '8px',
                      background: f.bg, color: f.color, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }} aria-hidden="true">{f.icon}</div>
                    <span style={{ fontSize: '12.5px', fontWeight: 500, color: 'rgba(255,255,255,.65)' }}>{f.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '20px', position: 'relative', zIndex: 2, marginTop: '24px' }}>
              {STATS.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  {i > 0 && <div style={{ width: '1px', background: 'rgba(255,255,255,.1)', alignSelf: 'stretch' }} />}
                  <div>
                    <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '20px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-.5px' }}>{s.value}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.3)', marginTop: '1px' }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ══ RIGHT PANEL ═════════════════════════════════ */}
          <div className="pf-right" style={{
            width: '360px', flexShrink: 0,
            background: '#FFFFFF',
            borderLeft: '1px solid rgba(109,40,217,.08)',
            padding: '40px 34px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            position: 'relative',
          }}>
            {/* Dot pattern */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', opacity: .4,
              backgroundImage: 'radial-gradient(circle, #DDD8F7 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }} />

            <div style={{ position: 'relative', zIndex: 2 }}>

              {/* Secure badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '5px 11px', marginBottom: '20px',
                background: '#F0EEFF', border: '1px solid #DDD8F7',
                borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                color: '#5B21B6', letterSpacing: '.04em', textTransform: 'uppercase',
              }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7C3AED' }} />
                Acceso seguro
              </div>

              {/* Title */}
              <h2 style={{
                fontFamily: "'Outfit',sans-serif", fontSize: '26px', fontWeight: 800,
                color: '#1E1B3A', letterSpacing: '-.6px', marginBottom: '18px',
              }}>
                {tab === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </h2>

              {/* ── TAB SWITCHER ── */}
              <div style={{
                display: 'flex', padding: '4px', gap: '3px',
                background: '#F0EEFF', border: '1px solid #E4E0F6',
                borderRadius: '11px', marginBottom: '22px',
              }}>
                <button className={`pf-seg-btn ${tab === 'login'  ? 'active' : ''}`} onClick={() => setTab('login')}  type="button">Iniciar sesión</button>
                {/* <button className={`pf-seg-btn ${tab === 'signup' ? 'active' : ''}`} onClick={() => setTab('signup')} type="button">Registrarse</button> */}
              </div>

              {/* ════ LOGIN FORM ════ */}
              {tab === 'login' && (
                <form key="login" className="pf-tab-content" onSubmit={handleLogin}
                  style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                  {/* Email */}
                  <div>
                    <label htmlFor="pf-email" style={labelStyle}>Correo electrónico</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', display: 'flex', pointerEvents: 'none', color: iconCol('email'), transition: 'color .2s' }} aria-hidden="true">
                        <Mail size={15} />
                      </span>
                      <input
                        id="pf-email" type="email" placeholder="tu@correo.com"
                        value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                        onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                        required disabled={loginLoading} autoComplete="email"
                        style={fieldStyle('email')}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="pf-password" style={labelStyle}>Contraseña</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', display: 'flex', pointerEvents: 'none', color: iconCol('password'), transition: 'color .2s' }} aria-hidden="true">
                        <Lock size={15} />
                      </span>
                      <input
                        id="pf-password" type={showLoginPwd ? 'text' : 'password'} placeholder="••••••••"
                        value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                        onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                        required disabled={loginLoading} autoComplete="current-password"
                        style={fieldStyle('password')}
                      />
                      <button type="button" onClick={() => setShowLoginPwd(v => !v)} aria-label={showLoginPwd ? 'Ocultar' : 'Mostrar'}
                        style={{ position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#B8B4D4', padding: '5px', borderRadius: '7px', display: 'flex', transition: 'color .2s, background .2s' }}
                        onMouseEnter={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.color = '#7C3AED'; el.style.background = '#F0EEFF' }}
                        onMouseLeave={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.color = '#B8B4D4'; el.style.background = 'transparent' }}
                      >
                        {showLoginPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Forgot */}
                  <div style={{ textAlign: 'right', marginTop: '-6px' }}>
                    <button type="button" onClick={() => router.push('/auth/reset-password')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#7C3AED', fontWeight: 500, fontFamily: 'inherit', transition: 'color .2s', padding: '2px 0' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#5B21B6' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#7C3AED' }}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>

                  {/* Submit */}
                  <SubmitBtn loading={loginLoading} label="Iniciar sesión" />
                </form>
              )}



              {/* Footer trust line */}
              <div style={{ marginTop: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ flex: 1, height: '1px', background: '#EDE9F8' }} />
                  <span style={{ fontSize: '11px', color: '#C4C0DC', padding: '0 10px' }}>cifrado extremo a extremo</span>
                  <div style={{ flex: 1, height: '1px', background: '#EDE9F8' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', flexShrink: 0, animation: 'pulse-dot 2.2s ease-in-out infinite' }} aria-hidden="true" />
                  <span style={{ fontSize: '11px', color: '#BDB9D8' }}>Conexión segura · TLS 1.3 · Datos protegidos</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ── Shared submit button ── */
function SubmitBtn({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit" disabled={loading}
      style={{
        marginTop: '4px',
        width: '100%', height: '47px',
        background: loading ? 'rgba(124,58,237,.6)' : 'linear-gradient(135deg,#7C3AED 0%,#4F46E5 100%)',
        border: 'none', borderRadius: '12px',
        color: 'white', fontSize: '14px', fontWeight: 600,
        fontFamily: "'DM Sans', -apple-system, sans-serif",
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
        position: 'relative', overflow: 'hidden',
        transition: 'transform .15s ease, box-shadow .2s ease',
        boxShadow: loading ? 'none' : '0 6px 20px rgba(79,70,229,.38), 0 2px 6px rgba(79,70,229,.2), 0 0 0 1px rgba(255,255,255,.1) inset',
      }}
      onMouseEnter={(e) => { if (!loading) { const el = e.currentTarget as HTMLButtonElement; el.style.transform = 'translateY(-1px)'; el.style.boxShadow = '0 10px 28px rgba(79,70,229,.48), 0 4px 10px rgba(79,70,229,.22), 0 0 0 1px rgba(255,255,255,.12) inset' } }}
      onMouseLeave={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = '0 6px 20px rgba(79,70,229,.38), 0 2px 6px rgba(79,70,229,.2), 0 0 0 1px rgba(255,255,255,.1) inset' }}
      onMouseDown={(e)  => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0) scale(.99)' }}
    >
      {!loading && (
        <span style={{ position: 'absolute', top: 0, bottom: 0, width: '65%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.14),transparent)', animation: 'shimmer 2.8s ease-in-out infinite', pointerEvents: 'none' }} aria-hidden="true" />
      )}
      {loading
        ? <><span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,.25)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin .75s linear infinite', flexShrink: 0 }} aria-hidden="true" />Verificando...</>
        : <>{label} <ArrowRight size={16} aria-hidden="true" /></>
      }
    </button>
  )
}
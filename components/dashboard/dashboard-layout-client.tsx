'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarInset, SidebarTrigger, SidebarSeparator,
} from '@/components/ui/sidebar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  LayoutDashboard, Package, ShoppingCart, Receipt, Truck,
  Users, BarChart3, Settings, LogOut, ChevronUp, Layers,
  Calculator, Tags, Plus, Bell, Search, X, AlertTriangle,
  ArrowRight, CheckCheck,
} from 'lucide-react'

const NAV_GROUPS = [
  {
    label: 'Principal',
    items: [
      { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
      { title: 'Punto de Venta', url: '/dashboard/pos', icon: ShoppingCart },
    ],
  },
  {
    label: 'Inventario',
    items: [
      { title: 'Productos', url: '/dashboard/productos', icon: Package },
      { title: 'Categorías', url: '/dashboard/categorias', icon: Tags },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { title: 'Ventas', url: '/dashboard/ventas', icon: Receipt },
      { title: 'Compras', url: '/dashboard/compras', icon: Truck },
      { title: 'Corte de Caja', url: '/dashboard/caja', icon: Calculator },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { title: 'Clientes', url: '/dashboard/clientes', icon: Users },
      { title: 'Proveedores', url: '/dashboard/proveedores', icon: Truck },
      { title: 'Reportes', url: '/dashboard/reportes', icon: BarChart3 },
    ],
  },
]

// Todas las páginas para buscar
const ALL_PAGES = NAV_GROUPS.flatMap(g => g.items)

interface AppSidebarProps {
  user: { email: string; firstName: string; lastName: string; role?: string | null }
}

function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Sesión cerrada')
    router.push('/auth/login')
    router.refresh()
  }

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div style={{
                  width: 36, height: 36, borderRadius: 11, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(150deg, var(--blue-bright), var(--blue-deep))',
                  boxShadow: '0 6px 18px -4px var(--blue-glow), inset 0 1px 0 rgba(255,255,255,0.35)',
                  color: '#fff',
                }}>
                  <Layers className="size-[18px]" />
                </div>
                <div style={{ lineHeight: 1.15 }}>
                  <span style={{ display: 'block', fontWeight: 680, fontSize: 15.5, letterSpacing: '-0.02em', color: 'var(--text)' }}>
                    PaperFlow
                  </span>
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.02em' }}>
                    Inventario · POS
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label}>
            {gi > 0 && <SidebarSeparator />}
            <SidebarGroup>
              <SidebarGroupLabel style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const active = pathname === item.url || (item.url !== '/dashboard' && pathname.startsWith(item.url))
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                          <Link href={item.url}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {/* FIX: se oculta para no-admins por UX — evita que un cajero vea
              un enlace que de todas formas le rebotará por requireRole().
              Esto NO es la protección de seguridad, solo evita confusión. */}
          {user.role === 'admin' && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Configuración">
                <Link href="/dashboard/configuracion">
                  <Settings />
                  <span>Configuración</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback style={{ borderRadius: 9, background: 'linear-gradient(150deg, var(--blue-bright), var(--blue-deep))', color: '#fff', fontSize: 12.5, fontWeight: 640 }}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold" style={{ color: 'var(--text)' }}>{user.firstName} {user.lastName}</span>
                    <span className="truncate text-xs" style={{ color: 'var(--text-faint)' }}>{user.email}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4" style={{ color: 'var(--text-faint)' }} />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg" side="top" align="start" sideOffset={4}
                style={{ background: 'var(--ink-800)', border: '1px solid var(--line-strong)', boxShadow: 'var(--sh-lg)' }}>
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback style={{ borderRadius: 9, background: 'linear-gradient(150deg, var(--blue-bright), var(--blue-deep))', color: '#fff', fontSize: 12.5, fontWeight: 640 }}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold" style={{ color: 'var(--text)' }}>{user.firstName} {user.lastName}</span>
                      <span className="truncate text-xs" style={{ color: 'var(--text-faint)' }}>{user.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator style={{ background: 'var(--line)' }} />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

/* ─────────────────────────────────────────────
   Search Modal
─────────────────────────────────────────────── */
function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const filtered = query.trim() === ''
    ? ALL_PAGES
    : ALL_PAGES.filter(p => p.title.toLowerCase().includes(query.toLowerCase()))

  const [selected, setSelected] = useState(0)

  useEffect(() => { setSelected(0) }, [query])
  useEffect(() => { if (open) setQuery('') }, [open])

  const handleSelect = useCallback((url: string) => {
    router.push(url)
    onClose()
  }, [router, onClose])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') setSelected(s => Math.min(s + 1, filtered.length - 1))
      if (e.key === 'ArrowUp') setSelected(s => Math.max(s - 1, 0))
      if (e.key === 'Enter' && filtered[selected]) handleSelect(filtered[selected].url)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, filtered, selected, handleSelect, onClose])

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '15vh',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxWidth: 520,
          background: 'var(--ink-800)',
          border: '1px solid var(--line-strong)',
          borderRadius: 14,
          boxShadow: 'var(--sh-lg)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar página..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text)', fontSize: 15, fontFamily: 'var(--font)',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
              <X size={14} />
            </button>
          )}
          <span className="kbd" style={{ fontSize: 10, flexShrink: 0 }}>ESC</span>
        </div>

        {/* Resultados */}
        <div style={{ maxHeight: 320, overflowY: 'auto', padding: '6px 8px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
              Sin resultados para &quot;{query}&quot;
            </div>
          ) : (
            filtered.map((page, i) => {
              const Icon = page.icon
              const isSelected = i === selected
              return (
                <button
                  key={page.url}
                  onClick={() => handleSelect(page.url)}
                  onMouseEnter={() => setSelected(i)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: isSelected ? 'rgba(47,107,255,0.15)' : 'transparent',
                    color: isSelected ? 'var(--text)' : 'var(--text-2)',
                    fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500,
                    textAlign: 'left', transition: 'background .1s',
                  }}
                >
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: isSelected ? 'rgba(47,107,255,0.2)' : 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={14} style={{ color: isSelected ? 'var(--blue-bright)' : 'var(--text-muted)' }} />
                  </div>
                  <span style={{ flex: 1 }}>{page.title}</span>
                  {isSelected && <ArrowRight size={13} style={{ color: 'var(--blue-bright)' }} />}
                </button>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--line)', display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-faint)' }}>
          <span><span className="kbd">↑↓</span> navegar</span>
          <span><span className="kbd">↵</span> abrir</span>
          <span><span className="kbd">ESC</span> cerrar</span>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Notifications Panel
─────────────────────────────────────────────── */
interface Notification {
  id: string
  type: 'stock_low' | 'stock_out'
  title: string
  description: string
  url: string
  read: boolean
}

function NotificationsPanel({
  open,
  onClose,
  notifications,
  onMarkAllRead,
}: {
  open: boolean
  onClose: () => void
  notifications: Notification[]
  onMarkAllRead: () => void
}) {
  const router = useRouter()
  if (!open) return null

  const unread = notifications.filter(n => !n.read).length

  return (
    <>
      {/* Overlay invisible para cerrar */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={onClose} />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 64, right: 18, zIndex: 999,
        width: 340,
        background: 'var(--ink-800)',
        border: '1px solid var(--line-strong)',
        borderRadius: 12,
        boxShadow: 'var(--sh-lg)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={15} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Notificaciones</span>
            {unread > 0 && (
              <span style={{
                background: 'var(--blue-bright)', color: '#fff',
                fontSize: 10, fontWeight: 700, borderRadius: 999,
                padding: '1px 6px',
              }}>
                {unread}
              </span>
            )}
          </div>
          {unread > 0 && (
            <button
              onClick={onMarkAllRead}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--blue-bright)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <CheckCheck size={12} />
              Marcar todas
            </button>
          )}
        </div>

        {/* Lista */}
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
              <Bell size={24} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
              <p>Sin notificaciones pendientes</p>
            </div>
          ) : (
            notifications.map((n, i) => (
              <button
                key={n.id}
                onClick={() => { router.push(n.url); onClose() }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '11px 16px',
                  borderBottom: i < notifications.length - 1 ? '1px solid var(--line-soft)' : 'none',
                  background: n.read ? 'transparent' : 'rgba(47,107,255,0.06)',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  transition: 'background .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(47,107,255,0.06)')}
              >
                {/* Ícono */}
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: n.type === 'stock_out' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <AlertTriangle size={14} style={{ color: n.type === 'stock_out' ? '#ef4444' : '#f59e0b' }} />
                </div>

                {/* Texto */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', margin: '0 0 2px', lineHeight: 1.3 }}>
                    {n.title}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                    {n.description}
                  </p>
                </div>

                {/* Punto sin leer */}
                {!n.read && (
                  <div style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--blue-bright)', flexShrink: 0, marginTop: 4 }} />
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--line)' }}>
            <button
              onClick={() => { router.push('/dashboard/productos?filter=low-stock'); onClose() }}
              style={{
                width: '100%', padding: '7px', borderRadius: 7, border: '1px solid var(--line)',
                background: 'transparent', color: 'var(--text-muted)', fontSize: 12,
                cursor: 'pointer', fontFamily: 'var(--font)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              Ver todos los productos con stock bajo
              <ArrowRight size={12} />
            </button>
          </div>
        )}
      </div>
    </>
  )
}

/* ─────────────────────────────────────────────
   Topbar
─────────────────────────────────────────────── */
const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/pos': 'Punto de Venta',
  '/dashboard/productos': 'Productos',
  '/dashboard/categorias': 'Categorías',
  '/dashboard/ventas': 'Ventas',
  '/dashboard/compras': 'Compras',
  '/dashboard/caja': 'Corte de Caja',
  '/dashboard/clientes': 'Clientes',
  '/dashboard/proveedores': 'Proveedores',
  '/dashboard/reportes': 'Reportes',
}

function TopbarInner() {
  const pathname = usePathname()
  const router = useRouter()
  const pageTitle = PAGE_TITLES[pathname] ?? 'PaperFlow'

  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notifsLoaded, setNotifsLoaded] = useState(false)

  // Cargar notificaciones (stock bajo) desde Supabase
  // Después — carga al montar el componente automáticamente
  const loadNotifications = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('products')
      .select('id, name, sku, stock_quantity, min_stock')
      .lt('stock_quantity', 10)
      .eq('is_active', true)
      .order('stock_quantity', { ascending: true })
      .limit(20)

    setNotifications(prev => {
      const notifs: Notification[] = (data ?? []).map(p => {
        // Conservar estado "read" si ya existía
        const existing = prev.find(n => n.id === p.id)
        return {
          id: p.id,
          type: p.stock_quantity === 0 ? 'stock_out' : 'stock_low',
          title: p.stock_quantity === 0 ? `Sin stock: ${p.name}` : `Stock bajo: ${p.name}`,
          description: p.stock_quantity === 0
            ? `SKU ${p.sku} — Sin unidades disponibles`
            : `SKU ${p.sku} — Solo ${p.stock_quantity} unidad${p.stock_quantity !== 1 ? 'es' : ''} restante${p.stock_quantity !== 1 ? 's' : ''}`,
          url: '/dashboard/productos?filter=low-stock',
          read: existing?.read ?? false,
        }
      })
      return notifs
    })
  }, [])

  // Cargar al montar
  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  useEffect(() => {
    const interval = setInterval(loadNotifications, 30_000)
    return () => clearInterval(interval)
  }, [loadNotifications])

  useEffect(() => {
    loadNotifications()
  }, [pathname, loadNotifications])

  const handleNotifOpen = () => {
    setNotifOpen(v => !v)
  }

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  // Atajo ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(v => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <NotificationsPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifications={notifications}
        onMarkAllRead={markAllRead}
      />

      <header
        className="pf-topbar"
        style={{
          height: 60, flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '0 18px',
          position: 'relative', zIndex: 3,
        }}
      >
        {/* Sidebar toggle */}
        <SidebarTrigger
          style={{
            width: 36, height: 36, borderRadius: 9,
            background: 'rgba(255,255,255,0.03)',
            color: 'var(--text-muted)', cursor: 'pointer', transition: 'all .15s',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
        />

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-faint)', fontSize: 15 }}>
          <span style={{ color: 'var(--text)' }}>PaperFlow</span>
          <span style={{ color: 'var(--text-faint)' }}>/</span>
          <span style={{ color: 'var(--text-2)', fontWeight: 540 }}>{pageTitle}</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Search button */}
        <button
          className="pf-search-btn"
          onClick={() => setSearchOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 9, height: 38, padding: '0 12px',
            minWidth: 200, borderRadius: 'var(--r-sm)',
            border: '1px solid var(--line)', background: 'rgba(0,0,0,0.25)',
            color: 'var(--text)', cursor: 'pointer',
            fontFamily: 'var(--font)', fontSize: 13, transition: 'border-color .15s',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--line-strong)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--line)')}
        >
          <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <span style={{ flex: 1, textAlign: 'left', color: 'var(--text-muted)' }}>Buscar…</span>
          <span className="kbd">⌘K</span>
        </button>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <button
          aria-label="Notificaciones"
          onClick={handleNotifOpen}
          style={{
            position: 'relative', width: 38, height: 38, borderRadius: 9,
            border: '1px solid var(--line)', background: notifOpen ? 'rgba(47,107,255,0.12)' : 'rgba(255,255,255,0.03)',
            color: notifOpen ? 'var(--blue-bright)' : 'var(--text-muted)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all .15s',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = notifOpen ? 'var(--blue-bright)' : 'var(--text-muted)')}
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: 7, right: 7,
              width: 7, height: 7, borderRadius: 999,
              background: 'var(--blue-bright)',
              boxShadow: '0 0 8px var(--blue-glow)',
              border: '2px solid var(--ink-900)',
            }} />
          )}
        </button>

        {/* Nueva venta */}
        <Button
          onClick={() => router.push('/dashboard/pos')}
          style={{
            background: 'linear-gradient(180deg, var(--blue-bright), var(--blue))',
            border: '1px solid rgba(255,255,255,0.16)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, var(--sh-blue)',
            color: '#fff', fontFamily: 'var(--font)', fontWeight: 540,
            fontSize: 13.5, height: 38, borderRadius: 'var(--r-sm)', gap: 7,
          }}
        >
          <Plus size={15} />
          <span>Nueva venta</span>
        </Button>
      </header>
    </>
  )
}

/* ─────────────────────────────────────────────
   Main export
─────────────────────────────────────────────── */
interface DashboardLayoutClientProps {
  children: React.ReactNode
  user: { email: string; firstName: string; lastName: string; role?: string | null }
}

export function DashboardLayoutClient({ children, user }: DashboardLayoutClientProps) {
  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <TopbarInner />
        <main className="no-sb" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
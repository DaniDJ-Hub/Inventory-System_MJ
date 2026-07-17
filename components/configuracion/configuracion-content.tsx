'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Store,
  User,
  Users,
  Shield,
  Loader2,
  Pencil,
  Save,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  Package,
  Percent,
} from 'lucide-react'
// FIX: validación centralizada (antes: sin límites de longitud, sin política real de contraseña)
import {
  businessSettingsSchema,
  changePasswordSchema,
  firstZodError,
} from '@/lib/validations/schemas'
import { getFriendlyErrorMessage } from '@/lib/utils/error-messages'
import { useConfirm } from '@/components/providers/confirm-provider'

// ── Types ──────────────────────────────────────────────────
interface BusinessSettings {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  tax_id: string | null
  logo_url: string | null
  currency: string
  tax_rate: number
  low_stock_threshold: number
}

interface Profile {
  id: string
  first_name: string
  last_name: string
  phone: string | null
  is_active: boolean
  role?: { id: string; name: string; description: string } | null
}

interface Role {
  id: string
  name: string
  description: string | null
  permissions: Record<string, boolean>
}

interface ConfiguracionContentProps {
  userId: string
  userEmail: string
  /**
   * Rol del usuario actual, resuelto en el servidor por `requireRole()`.
   * Se usa aquí solo para UX (ej. impedir que un admin se quite su propio
   * rol por error). La autorización real ya se aplicó en el Server Component;
   * este componente nunca debe ser la única barrera de seguridad.
   */
  currentUserRole: string
  settings: BusinessSettings | null
  profile: Profile | null
  roles: Role[]
  usuarios: Profile[]
}

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  cashier: 'Cajero',
  employee: 'Empleado',
}

const roleBadgeColor: Record<string, string> = {
  admin: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  cashier: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  employee: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

export function ConfiguracionContent({
  userId,
  userEmail,
  currentUserRole,
  settings: initialSettings,
  profile: initialProfile,
  roles,
  usuarios,
}: ConfiguracionContentProps) {
  const router = useRouter()
  const confirm = useConfirm()
  const [isLoading, setIsLoading] = useState(false)

  // ── Estado: Negocio ──────────────────────────────────────
  const [negocio, setNegocio] = useState({
    name: initialSettings?.name ?? 'Mi Papelería',
    address: initialSettings?.address ?? '',
    phone: initialSettings?.phone ?? '',
    email: initialSettings?.email ?? '',
    tax_id: initialSettings?.tax_id ?? '',
    currency: initialSettings?.currency ?? 'MXN',
    tax_rate: initialSettings?.tax_rate?.toString() ?? '16',
    low_stock_threshold: initialSettings?.low_stock_threshold?.toString() ?? '10',
  })

  // ── Estado: Perfil ───────────────────────────────────────
  const [perfil, setPerfil] = useState({
    first_name: initialProfile?.first_name ?? '',
    last_name: initialProfile?.last_name ?? '',
    phone: initialProfile?.phone ?? '',
  })
  const [passwordData, setPasswordData] = useState({
    nueva: '',
    confirmar: '',
  })

  // ── Estado: Usuarios ─────────────────────────────────────
  const [usuariosList, setUsuariosList] = useState<Profile[]>(usuarios)
  const [editandoUsuario, setEditandoUsuario] = useState<Profile | null>(null)
  const [rolSeleccionado, setRolSeleccionado] = useState('')
  const [activoSeleccionado, setActivoSeleccionado] = useState(true)
  const [dialogUsuarioOpen, setDialogUsuarioOpen] = useState(false)

  // ── Guardar configuración del negocio ────────────────────
  const handleGuardarNegocio = async () => {
    // FIX: antes solo se validaba que `name` no estuviera vacío; `parseFloat`/`parseInt`
    // con NaN caían silenciosamente a un default (`|| 16`, `|| 10`), ocultando errores
    // de captura del usuario (ej. escribir "abc" en tax_rate). Zod valida y reporta.
    const parsed = businessSettingsSchema.safeParse(negocio)
    if (!parsed.success) {
      toast.error(firstZodError(parsed))
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      const payload = {
        name: parsed.data.name,
        address: parsed.data.address || null,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        tax_id: parsed.data.tax_id || null,
        currency: parsed.data.currency,
        tax_rate: parsed.data.tax_rate,
        low_stock_threshold: parsed.data.low_stock_threshold,
        updated_at: new Date().toISOString(),
      }

      const { error } = initialSettings?.id
        ? await supabase.from('business_settings').update(payload).eq('id', initialSettings.id)
        : await supabase.from('business_settings').insert(payload)

      if (error) {
        toast.error(getFriendlyErrorMessage(error, 'Error al guardar la configuración'))
        return
      }

      toast.success('Configuración del negocio guardada')
      router.refresh()
    } catch (err) {
      toast.error('Error inesperado al guardar la configuración')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // ── Guardar perfil de usuario ────────────────────────────
  const handleGuardarPerfil = async () => {
    if (!perfil.first_name.trim()) {
      toast.error('El nombre es requerido')
      return
    }
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: perfil.first_name.trim(),
          last_name: perfil.last_name.trim(),
          phone: perfil.phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) throw error
      toast.success('Perfil actualizado')
      router.refresh()
    } catch (err) {
      toast.error('Error al actualizar el perfil')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // ── Cambiar contraseña ───────────────────────────────────
  const handleCambiarPassword = async () => {
    // FIX (Alto #6): antes solo exigía 6 caracteres sin reglas de complejidad.
    // `changePasswordSchema` exige 10+ caracteres, mayúscula, minúscula y número,
    // y valida la coincidencia de ambos campos en un solo paso.
    const parsed = changePasswordSchema.safeParse(passwordData)
    if (!parsed.success) {
      toast.error(firstZodError(parsed))
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: parsed.data.nueva,
      })
      if (error) {
        toast.error(error.message || 'Error al cambiar la contraseña')
        return
      }
      setPasswordData({ nueva: '', confirmar: '' })
      toast.success('Contraseña actualizada correctamente')
    } catch (err) {
      toast.error('Error inesperado al cambiar la contraseña')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // ── Editar usuario (rol y estado) ────────────────────────
  const abrirEditarUsuario = (u: Profile) => {
    setEditandoUsuario(u)
    setRolSeleccionado(u.role?.id ?? '')
    setActivoSeleccionado(u.is_active)
    setDialogUsuarioOpen(true)
  }

  const handleGuardarUsuario = async () => {
    if (!editandoUsuario) return

    // FIX: red de seguridad de UX — evita que el único admin conectado se
    // desactive o se quite el rol de admin por error desde esta pantalla.
    // (La autorización real sigue viviendo en requireRole() + RLS; esto solo
    // previene un "auto-bloqueo" accidental, no es un control de seguridad.)
    const esUsuarioActual = editandoUsuario.id === userId
    const nuevoRolEsAdmin = roles.find(r => r.id === rolSeleccionado)?.name === 'admin'
    if (esUsuarioActual && (!activoSeleccionado || !nuevoRolEsAdmin)) {
      const confirmado = await confirm({
        title: 'Estás modificando tu propia cuenta',
        description:
          'Estás a punto de quitarte el rol de administrador o desactivar tu propia cuenta. Podrías perder acceso a Configuración. ¿Deseas continuar?',
        confirmLabel: 'Continuar de todos modos',
        variant: 'destructive',
      })
      if (!confirmado) return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({
          role_id: rolSeleccionado || null,
          is_active: activoSeleccionado,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editandoUsuario.id)

      if (error) {
        toast.error(getFriendlyErrorMessage(error, 'Error al actualizar el usuario'))
        return
      }

      // Actualizar estado local
      const rolObj = roles.find(r => r.id === rolSeleccionado) ?? null
      setUsuariosList(prev =>
        prev.map(u =>
          u.id === editandoUsuario.id
            ? { ...u, role: rolObj ? { id: rolObj.id, name: rolObj.name, description: rolObj.description ?? '' } : null, is_active: activoSeleccionado }
            : u
        )
      )

      setDialogUsuarioOpen(false)
      toast.success('Usuario actualizado')
    } catch (err) {
      toast.error('Error al actualizar el usuario')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">
          Administra tu negocio, perfil y usuarios del sistema
        </p>
      </div>

      <Tabs defaultValue="negocio">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="negocio" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Negocio
          </TabsTrigger>
          <TabsTrigger value="perfil" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Mi Perfil
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuarios
          </TabsTrigger>
        </TabsList>

        {/* ── TAB: NEGOCIO ── */}
        <TabsContent value="negocio" className="mt-6 space-y-6">

          {/* Información general */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Store className="h-4 w-4" />
                Información del negocio
              </CardTitle>
              <CardDescription>
                Datos que aparecen en tickets y documentos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nombre-negocio">Nombre del negocio *</Label>
                  <Input
                    id="nombre-negocio"
                    placeholder="Mi Papelería"
                    value={negocio.name}
                    onChange={e => setNegocio(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rfc">RFC / Tax ID</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="rfc"
                      placeholder="XAXX010101000"
                      className="pl-9"
                      value={negocio.tax_id}
                      onChange={e => setNegocio(p => ({ ...p, tax_id: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="direccion"
                    placeholder="Calle, Número, Colonia, Ciudad"
                    className="pl-9"
                    value={negocio.address}
                    onChange={e => setNegocio(p => ({ ...p, address: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="telefono-negocio">Teléfono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="telefono-negocio"
                      placeholder="555-0100"
                      className="pl-9"
                      value={negocio.phone}
                      onChange={e => setNegocio(p => ({ ...p, phone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-negocio">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email-negocio"
                      type="email"
                      placeholder="contacto@mipapeleria.com"
                      className="pl-9"
                      value={negocio.email}
                      onChange={e => setNegocio(p => ({ ...p, email: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuración fiscal y sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Configuración fiscal y sistema
              </CardTitle>
              <CardDescription>
                Moneda, impuestos y alertas de inventario
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="moneda">Moneda</Label>
                  <Select
                    value={negocio.currency}
                    onValueChange={v => setNegocio(p => ({ ...p, currency: v }))}
                  >
                    <SelectTrigger id="moneda">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MXN">MXN — Peso mexicano</SelectItem>
                      <SelectItem value="USD">USD — Dólar americano</SelectItem>
                      <SelectItem value="EUR">EUR — Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="iva">Tasa de IVA (%)</Label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="iva"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="16"
                      className="pl-9"
                      value={negocio.tax_rate}
                      onChange={e => setNegocio(p => ({ ...p, tax_rate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock-minimo">Alerta de stock bajo</Label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="stock-minimo"
                      type="number"
                      min="1"
                      placeholder="10"
                      className="pl-9"
                      value={negocio.low_stock_threshold}
                      onChange={e => setNegocio(p => ({ ...p, low_stock_threshold: e.target.value }))}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Unidades mínimas para mostrar alerta
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleGuardarNegocio} disabled={isLoading}>
              {isLoading
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <Save className="mr-2 h-4 w-4" />
              }
              Guardar cambios
            </Button>
          </div>
        </TabsContent>

        {/* ── TAB: MI PERFIL ── */}
        <TabsContent value="perfil" className="mt-6 space-y-6">

          {/* Datos personales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Datos personales
              </CardTitle>
              <CardDescription>
                Tu información de acceso y contacto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar inicial */}
              <div className="flex items-center gap-4 pb-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  {perfil.first_name.charAt(0)}{perfil.last_name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{perfil.first_name} {perfil.last_name}</p>
                  <p className="text-sm text-muted-foreground">{userEmail}</p>
                  {initialProfile?.role && (
                    <Badge
                      variant="secondary"
                      className={`mt-1 text-xs ${roleBadgeColor[initialProfile.role.name] ?? ''}`}
                    >
                      <Shield className="mr-1 h-3 w-3" />
                      {roleLabels[initialProfile.role.name] ?? initialProfile.role.name}
                    </Badge>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first-name">Nombre</Label>
                  <Input
                    id="first-name"
                    placeholder="Juan"
                    value={perfil.first_name}
                    onChange={e => setPerfil(p => ({ ...p, first_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Apellido</Label>
                  <Input
                    id="last-name"
                    placeholder="Pérez"
                    value={perfil.last_name}
                    onChange={e => setPerfil(p => ({ ...p, last_name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="correo-perfil">Correo electrónico</Label>
                  <Input
                    id="correo-perfil"
                    value={userEmail}
                    disabled
                    className="bg-muted text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    El correo no se puede cambiar desde aquí
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono-perfil">Teléfono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="telefono-perfil"
                      placeholder="555-0100"
                      className="pl-9"
                      value={perfil.phone}
                      onChange={e => setPerfil(p => ({ ...p, phone: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleGuardarPerfil} disabled={isLoading}>
                  {isLoading
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : <Save className="mr-2 h-4 w-4" />
                  }
                  Guardar perfil
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Cambiar contraseña */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Cambiar contraseña
              </CardTitle>
              <CardDescription>
                Mínimo 6 caracteres. Cierra sesión en otros dispositivos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nueva-pass">Nueva contraseña</Label>
                  <Input
                    id="nueva-pass"
                    type="password"
                    placeholder="••••••••"
                    value={passwordData.nueva}
                    onChange={e => setPasswordData(p => ({ ...p, nueva: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmar-pass">Confirmar contraseña</Label>
                  <Input
                    id="confirmar-pass"
                    type="password"
                    placeholder="••••••••"
                    value={passwordData.confirmar}
                    onChange={e => setPasswordData(p => ({ ...p, confirmar: e.target.value }))}
                  />
                </div>
              </div>

              {/* Indicador de coincidencia */}
              {passwordData.nueva && passwordData.confirmar && (
                <div className={`flex items-center gap-2 text-sm ${
                  passwordData.nueva === passwordData.confirmar ? 'text-green-600' : 'text-red-600'
                }`}>
                  {passwordData.nueva === passwordData.confirmar
                    ? <><CheckCircle2 className="h-4 w-4" /> Las contraseñas coinciden</>
                    : <><AlertTriangle className="h-4 w-4" /> Las contraseñas no coinciden</>
                  }
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleCambiarPassword}
                  disabled={isLoading || !passwordData.nueva || !passwordData.confirmar}
                  variant="outline"
                >
                  {isLoading
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : <Shield className="mr-2 h-4 w-4" />
                  }
                  Cambiar contraseña
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: USUARIOS ── */}
        <TabsContent value="usuarios" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Usuarios del sistema
              </CardTitle>
              <CardDescription>
                Gestiona roles y acceso de cada usuario. Los nuevos usuarios se registran desde la pantalla de login.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {usuariosList.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No hay usuarios registrados
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuariosList.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold flex-shrink-0">
                              {u.first_name.charAt(0)}{u.last_name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{u.first_name} {u.last_name}</p>
                              {u.id === userId && (
                                <p className="text-xs text-muted-foreground">Tú</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {u.role ? (
                            <Badge
                              variant="secondary"
                              className={`text-xs ${roleBadgeColor[u.role.name] ?? ''}`}
                            >
                              <Shield className="mr-1 h-3 w-3" />
                              {roleLabels[u.role.name] ?? u.role.name}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sin rol</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {u.phone ?? '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.is_active ? 'default' : 'secondary'}>
                            {u.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => abrirEditarUsuario(u)}
                            disabled={u.id === userId}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Info de roles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Roles del sistema
              </CardTitle>
              <CardDescription>Niveles de acceso disponibles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  { rol: 'admin', desc: 'Acceso completo a todas las funciones y configuración' },
                  { rol: 'manager', desc: 'Gestión de inventario, ventas, reportes y compras' },
                  { rol: 'cashier', desc: 'Punto de venta y consulta de productos' },
                  { rol: 'employee', desc: 'Consulta de inventario y operaciones básicas' },
                ].map(({ rol, desc }) => (
                  <div key={rol} className="flex items-start gap-3 rounded-lg border p-3">
                    <Badge
                      variant="secondary"
                      className={`mt-0.5 text-xs flex-shrink-0 ${roleBadgeColor[rol]}`}
                    >
                      {roleLabels[rol]}
                    </Badge>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── DIALOG: Editar usuario ── */}
      <Dialog open={dialogUsuarioOpen} onOpenChange={setDialogUsuarioOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
            <DialogDescription>
              {editandoUsuario?.first_name} {editandoUsuario?.last_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={rolSeleccionado} onValueChange={setRolSeleccionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin rol asignado" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      <span className="flex items-center gap-2">
                        <Shield className="h-3.5 w-3.5" />
                        {roleLabels[r.name] ?? r.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Usuario activo</p>
                <p className="text-xs text-muted-foreground">
                  Los usuarios inactivos no pueden iniciar sesión
                </p>
              </div>
              <Switch
                checked={activoSeleccionado}
                onCheckedChange={setActivoSeleccionado}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogUsuarioOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleGuardarUsuario} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
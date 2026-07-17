'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Ban,
  Truck,
  Loader2,
  Mail,
  Phone,
  User,
} from 'lucide-react'
import { supplierSchema, firstZodError } from '@/lib/validations/schemas'
import { getFriendlyErrorMessage } from '@/lib/utils/error-messages'
import { useConfirm } from '@/components/providers/confirm-provider'
import { useListQueryParams } from '@/lib/hooks/use-list-query-params'
import { PaginationBar } from '@/components/shared/pagination-bar'

interface Supplier {
  id: string
  name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  tax_id: string | null
  payment_terms: string | null
  notes: string | null
  is_active: boolean
}

interface SuppliersContentProps {
  initialSuppliers: Supplier[]
  totalCount: number
  page: number
  pageSize: number
}

export function SuppliersContent({
  initialSuppliers,
  totalCount,
  page,
  pageSize,
}: SuppliersContentProps) {
  const router = useRouter()
  const confirm = useConfirm()
  const { searchInput, setSearch, setPage } = useListQueryParams()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    tax_id: '',
    payment_terms: '',
    notes: '',
  })

  const resetForm = () => {
    setFormData({
      name: '',
      contact_name: '',
      email: '',
      phone: '',
      address: '',
      tax_id: '',
      payment_terms: '',
      notes: '',
    })
    setEditingSupplier(null)
  }

  const openEditDialog = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      name: supplier.name,
      contact_name: supplier.contact_name ?? '',
      email: supplier.email ?? '',
      phone: supplier.phone ?? '',
      address: supplier.address ?? '',
      tax_id: supplier.tax_id ?? '',
      payment_terms: supplier.payment_terms ?? '',
      notes: supplier.notes ?? '',
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const parsed = supplierSchema.safeParse(formData)
    if (!parsed.success) {
      toast.error(firstZodError(parsed))
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()

      const supplierData = {
        name: parsed.data.name,
        contact_name: parsed.data.contact_name || null,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        address: parsed.data.address || null,
        tax_id: parsed.data.tax_id || null,
        payment_terms: parsed.data.payment_terms || null,
        notes: parsed.data.notes || null,
      }

      const { error } = editingSupplier
        ? await supabase.from('suppliers').update(supplierData).eq('id', editingSupplier.id)
        : await supabase.from('suppliers').insert(supplierData)

      if (error) {
        toast.error(getFriendlyErrorMessage(error, 'Error al guardar proveedor'))
        return
      }

      toast.success(editingSupplier ? 'Proveedor actualizado' : 'Proveedor creado')
      setIsDialogOpen(false)
      resetForm()
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('Error inesperado al guardar proveedor')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (supplier: Supplier) => {
    // FIX (Crítico #3): borrado lógico — un proveedor con compras asociadas
    // (purchases.supplier_id) no debe desaparecer del historial de compras.
    const confirmed = await confirm({
      title: `¿Desactivar a "${supplier.name}"?`,
      description:
        'El proveedor dejará de aparecer al registrar nuevas compras, pero su historial se conservará.',
      confirmLabel: 'Desactivar',
      variant: 'destructive',
    })
    if (!confirmed) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('suppliers')
        .update({ is_active: false })
        .eq('id', supplier.id)

      if (error) {
        toast.error(getFriendlyErrorMessage(error, 'Error al desactivar proveedor'))
        return
      }

      toast.success('Proveedor desactivado')
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('Error inesperado al desactivar proveedor')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-muted-foreground">
            Administra tus proveedores
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Proveedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </DialogTitle>
              <DialogDescription>
                {editingSupplier ? 'Modifica los datos del proveedor' : 'Agrega un nuevo proveedor'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Empresa *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Distribuidora ABC"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Contacto</Label>
                  <Input
                    id="contact_name"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    placeholder="Maria Garcia"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="proveedor@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="555-5678"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tax_id">RFC</Label>
                  <Input
                    id="tax_id"
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                    placeholder="DAB010101XXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_terms">Condiciones de Pago</Label>
                  <Input
                    id="payment_terms"
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    placeholder="30 dias"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Direccion</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Calle, Numero, Ciudad"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas adicionales..."
                  rows={2}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingSupplier ? 'Guardar Cambios' : 'Crear Proveedor'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o contacto..."
            value={searchInput}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="secondary">{totalCount} proveedores</Badge>
      </div>

      {/* Suppliers Table */}
      {initialSuppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Truck className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">No hay proveedores</h3>
          <p className="text-muted-foreground mb-4">
            {searchInput ? 'No se encontraron proveedores' : 'Comienza agregando tu primer proveedor'}
          </p>
          {!searchInput && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Proveedor
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Condiciones</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                          <Truck className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{supplier.name}</p>
                          {supplier.tax_id && (
                            <p className="text-xs text-muted-foreground">
                              RFC: {supplier.tax_id}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {supplier.contact_name && (
                          <div className="flex items-center gap-1 text-sm">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {supplier.contact_name}
                          </div>
                        )}
                        {supplier.email && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {supplier.email}
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {supplier.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {supplier.payment_terms ?? '—'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(supplier)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(supplier)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Desactivar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <PaginationBar page={page} pageSize={pageSize} totalCount={totalCount} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}

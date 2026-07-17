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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Ban,
  Package,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
// FIX: validación centralizada, manejo de errores amigable, confirm accesible,
// búsqueda/paginación server-side (ver comentarios inline más abajo)
import { productSchema, firstZodError } from '@/lib/validations/schemas'
import { getFriendlyErrorMessage } from '@/lib/utils/error-messages'
import { useConfirm } from '@/components/providers/confirm-provider'
import { useListQueryParams } from '@/lib/hooks/use-list-query-params'
import { PaginationBar } from '@/components/shared/pagination-bar'

interface Product {
  id: string
  sku: string
  barcode: string | null
  name: string
  description: string | null
  category_id: string | null
  supplier_id: string | null
  cost_price: number
  sale_price: number
  stock_quantity: number
  min_stock: number
  unit: string
  is_active: boolean
  category?: { id: string; name: string; color: string } | null
  supplier?: { id: string; name: string } | null
}

interface Category {
  id: string
  name: string
  color: string
}

interface Supplier {
  id: string
  name: string
}

interface ProductsContentProps {
  initialProducts: Product[]
  categories: Category[]
  suppliers: Supplier[]
  totalCount: number
  page: number
  pageSize: number
}

export function ProductsContent({
  initialProducts,
  categories,
  suppliers,
  totalCount,
  page,
  pageSize,
}: ProductsContentProps) {
  const router = useRouter()
  const confirm = useConfirm()
  // FIX (Alto #5): búsqueda y paginación ahora viven en la URL y disparan una
  // consulta paginada/filtrada en el servidor (ver app/dashboard/productos/page.tsx),
  // en vez de traer la tabla completa y filtrar en memoria del navegador.
  const { searchInput, setSearch, setPage } = useListQueryParams()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    sku: '',
    barcode: '',
    name: '',
    description: '',
    category_id: '',
    supplier_id: '',
    cost_price: '',
    sale_price: '',
    stock_quantity: '',
    min_stock: '10',
    unit: 'pieza',
  })

  const resetForm = () => {
    setFormData({
      sku: '',
      barcode: '',
      name: '',
      description: '',
      category_id: '',
      supplier_id: '',
      cost_price: '',
      sale_price: '',
      stock_quantity: '',
      min_stock: '10',
      unit: 'pieza',
    })
    setEditingProduct(null)
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      sku: product.sku,
      barcode: product.barcode ?? '',
      name: product.name,
      description: product.description ?? '',
      category_id: product.category_id ?? '',
      supplier_id: product.supplier_id ?? '',
      cost_price: product.cost_price.toString(),
      sale_price: product.sale_price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      min_stock: product.min_stock.toString(),
      unit: product.unit,
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // FIX (Alto #8): antes `parseFloat`/`parseInt` sobre campos vacíos producían
    // `NaN` silenciosamente, que se insertaba tal cual en la base de datos.
    // Zod valida tipos, rangos (precio > 0, stock >= 0) y la regla de negocio
    // "precio de venta >= costo" antes de tocar la red.
    const parsed = productSchema.safeParse(formData)
    if (!parsed.success) {
      toast.error(firstZodError(parsed))
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()

      const productData = {
        sku: parsed.data.sku,
        barcode: parsed.data.barcode || null,
        name: parsed.data.name,
        description: parsed.data.description || null,
        category_id: parsed.data.category_id || null,
        supplier_id: parsed.data.supplier_id || null,
        cost_price: parsed.data.cost_price,
        sale_price: parsed.data.sale_price,
        stock_quantity: parsed.data.stock_quantity,
        min_stock: parsed.data.min_stock,
        unit: parsed.data.unit,
      }

      const { error } = editingProduct
        ? await supabase.from('products').update(productData).eq('id', editingProduct.id)
        : await supabase.from('products').insert(productData)

      if (error) {
        toast.error(getFriendlyErrorMessage(error, 'Error al guardar producto'))
        return
      }

      toast.success(editingProduct ? 'Producto actualizado' : 'Producto creado')
      setIsDialogOpen(false)
      resetForm()
      // FIX (Medio #14): antes se llamaba a router.refresh() Y ADEMÁS se volvía a
      // consultar manualmente `products` desde el cliente, duplicando la petición.
      // router.refresh() ya vuelve a ejecutar el Server Component (page.tsx) con
      // los datos frescos — es la única fuente de verdad necesaria aquí.
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('Error inesperado al guardar producto')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (product: Product) => {
    // FIX (Crítico #3): antes `.delete()` borraba el registro físicamente.
    // Un producto referenciado por ventas/compras pasadas (sale_items.product_id)
    // provocaría un error de llave foránea, o peor, un ON DELETE CASCADE que
    // corrompería el historial de ventas. Ahora se hace un borrado lógico
    // (is_active = false): el producto deja de listarse/venderse pero el
    // historial financiero permanece intacto.
    const confirmed = await confirm({
      title: `¿Desactivar "${product.name}"?`,
      description:
        'El producto dejará de aparecer en el catálogo y en el punto de venta, pero se conservará en el historial de ventas y compras.',
      confirmLabel: 'Desactivar',
      variant: 'destructive',
    })
    if (!confirmed) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', product.id)

      if (error) {
        toast.error(getFriendlyErrorMessage(error, 'Error al desactivar producto'))
        return
      }

      toast.success('Producto desactivado')
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('Error inesperado al desactivar producto')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground">
            Administra el inventario de tu papeleria
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Modifica los datos del producto' : 'Agrega un nuevo producto al inventario'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="PROD-001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode">Codigo de Barras</Label>
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="7501234567890"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Cuaderno Profesional 100 hojas"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripcion</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripcion del producto..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            {cat.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier">Proveedor</Label>
                  <Select
                    value={formData.supplier_id}
                    onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((sup) => (
                        <SelectItem key={sup.id} value={sup.id}>
                          {sup.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost_price">Precio Costo *</Label>
                  <Input
                    id="cost_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sale_price">Precio Venta *</Label>
                  <Input
                    id="sale_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unidad</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData({ ...formData, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pieza">Pieza</SelectItem>
                      <SelectItem value="paquete">Paquete</SelectItem>
                      <SelectItem value="caja">Caja</SelectItem>
                      <SelectItem value="metro">Metro</SelectItem>
                      <SelectItem value="kg">Kilogramo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock_quantity">Stock Actual *</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    placeholder="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_stock">Stock Minimo</Label>
                  <Input
                    id="min_stock"
                    type="number"
                    min="0"
                    value={formData.min_stock}
                    onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                    placeholder="10"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
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
            placeholder="Buscar por nombre, SKU o codigo..."
            value={searchInput}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="secondary">{totalCount} productos</Badge>
      </div>

      {/* Products Table */}
      {initialProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">No hay productos</h3>
          <p className="text-muted-foreground mb-4">
            {searchInput ? 'No se encontraron productos con ese criterio' : 'Comienza agregando tu primer producto'}
          </p>
          {!searchInput && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Producto
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.supplier && (
                            <p className="text-xs text-muted-foreground">{product.supplier.name}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                    <TableCell>
                      {product.category ? (
                        <Badge
                          variant="secondary"
                          style={{
                            backgroundColor: `${product.category.color}20`,
                            borderColor: product.category.color,
                            color: product.category.color
                          }}
                          className="border"
                        >
                          {product.category.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(product.cost_price)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(product.sale_price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {product.stock_quantity < product.min_stock && (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                        <Badge
                          variant={product.stock_quantity === 0 ? 'destructive' : product.stock_quantity < product.min_stock ? 'secondary' : 'outline'}
                        >
                          {product.stock_quantity} {product.unit}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(product)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(product)}
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

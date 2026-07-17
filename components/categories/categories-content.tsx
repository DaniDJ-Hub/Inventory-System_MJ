'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  MoreHorizontal,
  Pencil,
  Ban,
  Tags,
  Loader2,
  Package,
} from 'lucide-react'
import { categorySchema, firstZodError } from '@/lib/validations/schemas'
import { getFriendlyErrorMessage } from '@/lib/utils/error-messages'
import { useConfirm } from '@/components/providers/confirm-provider'

interface Category {
  id: string
  name: string
  description: string | null
  color: string
  is_active: boolean
  product_count: number
}

interface CategoriesContentProps {
  initialCategories: Category[]
}

const colorOptions = [
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Verde', value: '#10b981' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Amarillo', value: '#f59e0b' },
  { name: 'Rojo', value: '#ef4444' },
  { name: 'Morado', value: '#8b5cf6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Rosa', value: '#ec4899' },
]

export function CategoriesContent({ initialCategories }: CategoriesContentProps) {
  const router = useRouter()
  const confirm = useConfirm()
  // FIX: antes existía un estado local `categories` desincronizado del prop
  // `initialCategories` — tras quitar el refetch manual duplicado (ver
  // handleSubmit), ese estado dejaba de actualizarse. Usamos el prop
  // directamente: Next.js lo refresca automáticamente vía router.refresh(),
  // que vuelve a ejecutar el Server Component (categorias/page.tsx).
  const categories = initialCategories
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
  })

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3b82f6',
    })
    setEditingCategory(null)
  }

  const openEditDialog = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description ?? '',
      color: category.color,
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const parsed = categorySchema.safeParse(formData)
    if (!parsed.success) {
      toast.error(firstZodError(parsed))
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()

      const categoryData = {
        name: parsed.data.name,
        description: parsed.data.description || null,
        color: parsed.data.color,
      }

      const { error } = editingCategory
        ? await supabase.from('categories').update(categoryData).eq('id', editingCategory.id)
        : await supabase.from('categories').insert(categoryData)

      if (error) {
        toast.error(getFriendlyErrorMessage(error, 'Error al guardar categoria'))
        return
      }

      toast.success(editingCategory ? 'Categoria actualizada' : 'Categoria creada')
      setIsDialogOpen(false)
      resetForm()
      // FIX (Medio #14): un solo router.refresh() en vez de refetch manual duplicado
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('Error inesperado al guardar categoria')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (category: Category) => {
    if (category.product_count > 0) {
      toast.error('No puedes desactivar una categoria con productos asignados')
      return
    }

    // FIX (Crítico #3): borrado lógico en vez de DELETE físico, por consistencia
    // con products/customers/suppliers y para permitir reactivarla más adelante.
    const confirmed = await confirm({
      title: `¿Desactivar la categoria "${category.name}"?`,
      description: 'Podrás volver a activarla más adelante si es necesario.',
      confirmLabel: 'Desactivar',
      variant: 'destructive',
    })
    if (!confirmed) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('categories')
        .update({ is_active: false })
        .eq('id', category.id)

      if (error) {
        toast.error(getFriendlyErrorMessage(error, 'Error al desactivar categoria'))
        return
      }

      toast.success('Categoria desactivada')
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('Error inesperado al desactivar categoria')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categorias</h1>
          <p className="text-muted-foreground">
            Organiza tus productos por categorias
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Editar Categoria' : 'Nueva Categoria'}
              </DialogTitle>
              <DialogDescription>
                {editingCategory ? 'Modifica los datos de la categoria' : 'Crea una nueva categoria para tus productos'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Papeleria Basica"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripcion</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripcion de la categoria..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`w-8 h-8 rounded-full transition-all ${
                        formData.color === color.value 
                          ? 'ring-2 ring-offset-2 ring-offset-background ring-primary scale-110' 
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingCategory ? 'Guardar Cambios' : 'Crear Categoria'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Tags className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">No hay categorias</h3>
          <p className="text-muted-foreground mb-4">
            Comienza creando tu primera categoria
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Categoria
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id} className="relative overflow-hidden">
              <div 
                className="absolute top-0 left-0 w-full h-1"
                style={{ backgroundColor: category.color }}
              />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="flex items-center justify-center w-10 h-10 rounded-lg"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <Tags className="h-5 w-5" style={{ color: category.color }} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      {category.description && (
                        <CardDescription className="line-clamp-1">
                          {category.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(category)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(category)}
                        className="text-destructive focus:text-destructive"
                        disabled={category.product_count > 0}
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Desactivar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>{category.product_count} productos</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

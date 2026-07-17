import { z } from 'zod'

/**
 * Esquemas de validación centralizados.
 *
 * Por qué existen:
 * - Antes, cada formulario validaba manualmente (o no validaba) con `parseFloat`/`parseInt`,
 *   lo que aceptaba silenciosamente `NaN` en campos numéricos vacíos.
 * - Centralizar los esquemas evita duplicar reglas de negocio (DRY) y permite reusarlas
 *   tanto en el cliente (feedback inmediato) como, en el futuro, en Route Handlers o
 *   Edge Functions (validación en el servidor).
 */

// ─────────────────────────────────────────────────────────────
// Productos
// ─────────────────────────────────────────────────────────────
export const productSchema = z
  .object({
    sku: z
      .string()
      .trim()
      .min(1, 'El SKU es requerido')
      .max(50, 'El SKU no puede exceder 50 caracteres'),
    barcode: z.string().trim().max(50).optional().or(z.literal('')),
    name: z
      .string()
      .trim()
      .min(1, 'El nombre es requerido')
      .max(200, 'El nombre no puede exceder 200 caracteres'),
    description: z.string().trim().max(1000).optional().or(z.literal('')),
    category_id: z.string().uuid().optional().or(z.literal('')),
    supplier_id: z.string().uuid().optional().or(z.literal('')),
    cost_price: z.coerce
      .number({ invalid_type_error: 'El costo debe ser un número' })
      .min(0, 'El costo no puede ser negativo'),
    sale_price: z.coerce
      .number({ invalid_type_error: 'El precio debe ser un número' })
      .positive('El precio de venta debe ser mayor a 0'),
    stock_quantity: z.coerce
      .number({ invalid_type_error: 'El stock debe ser un número' })
      .int('El stock debe ser un número entero')
      .min(0, 'El stock no puede ser negativo'),
    min_stock: z.coerce
      .number({ invalid_type_error: 'El stock mínimo debe ser un número' })
      .int('El stock mínimo debe ser un número entero')
      .min(0, 'El stock mínimo no puede ser negativo'),
    unit: z.string().trim().min(1, 'La unidad es requerida'),
  })
  .refine((data) => data.sale_price >= data.cost_price, {
    message: 'El precio de venta no puede ser menor al costo',
    path: ['sale_price'],
  })

export type ProductFormValues = z.infer<typeof productSchema>

// ─────────────────────────────────────────────────────────────
// Clientes
// ─────────────────────────────────────────────────────────────
export const customerSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido').max(200),
  email: z.string().trim().email('Correo inválido').optional().or(z.literal('')),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{7,20}$/, 'Teléfono inválido')
    .optional()
    .or(z.literal('')),
  address: z.string().trim().max(500).optional().or(z.literal('')),
  tax_id: z.string().trim().max(50).optional().or(z.literal('')),
  credit_limit: z.coerce.number().min(0, 'El límite de crédito no puede ser negativo'),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
})

export type CustomerFormValues = z.infer<typeof customerSchema>

// ─────────────────────────────────────────────────────────────
// Proveedores
// ─────────────────────────────────────────────────────────────
export const supplierSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido').max(200),
  contact_name: z.string().trim().max(200).optional().or(z.literal('')),
  email: z.string().trim().email('Correo inválido').optional().or(z.literal('')),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{7,20}$/, 'Teléfono inválido')
    .optional()
    .or(z.literal('')),
  address: z.string().trim().max(500).optional().or(z.literal('')),
  tax_id: z.string().trim().max(50).optional().or(z.literal('')),
  payment_terms: z.string().trim().max(100).optional().or(z.literal('')),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
})

export type SupplierFormValues = z.infer<typeof supplierSchema>

// ─────────────────────────────────────────────────────────────
// Categorías
// ─────────────────────────────────────────────────────────────
export const categorySchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido').max(100),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido (formato #RRGGBB)'),
})

export type CategoryFormValues = z.infer<typeof categorySchema>

// ─────────────────────────────────────────────────────────────
// Contraseñas — política reforzada (antes: mínimo 6 caracteres, sin reglas)
// ─────────────────────────────────────────────────────────────
export const passwordSchema = z
  .string()
  .min(10, 'La contraseña debe tener al menos 10 caracteres')
  .regex(/[A-Z]/, 'Debe incluir al menos una letra mayúscula')
  .regex(/[a-z]/, 'Debe incluir al menos una letra minúscula')
  .regex(/[0-9]/, 'Debe incluir al menos un número')

export const changePasswordSchema = z
  .object({
    nueva: passwordSchema,
    confirmar: z.string(),
  })
  .refine((data) => data.nueva === data.confirmar, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmar'],
  })

export const signupSchema = z.object({
  firstName: z.string().trim().min(1, 'El nombre es requerido'),
  lastName: z.string().trim().min(1, 'El apellido es requerido'),
  email: z.string().trim().email('Correo inválido'),
  password: passwordSchema,
})

// ─────────────────────────────────────────────────────────────
// Configuración del negocio
// ─────────────────────────────────────────────────────────────
export const businessSettingsSchema = z.object({
  name: z.string().trim().min(1, 'El nombre del negocio es requerido').max(200),
  address: z.string().trim().max(500).optional().or(z.literal('')),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{7,20}$/, 'Teléfono inválido')
    .optional()
    .or(z.literal('')),
  email: z.string().trim().email('Correo inválido').optional().or(z.literal('')),
  tax_id: z.string().trim().max(50).optional().or(z.literal('')),
  currency: z.string().trim().min(1),
  tax_rate: z.coerce.number().min(0).max(100, 'La tasa de impuesto debe estar entre 0 y 100'),
  low_stock_threshold: z.coerce
    .number()
    .int()
    .min(0, 'El umbral de stock bajo no puede ser negativo'),
})

/**
 * Helper genérico para usar en los `catch` de los formularios: toma el resultado de
 * `schema.safeParse()` y devuelve el primer mensaje de error legible, listo para un toast.
 */
export function firstZodError(result: { success: false; error: z.ZodError }): string {
  return result.error.issues[0]?.message ?? 'Datos inválidos'
}

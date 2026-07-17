import type { Product, Customer } from '@/lib/types/database'

/**
 * FIX: la query de POS (app/dashboard/pos/page.tsx) intencionalmente solo
 * trae un subconjunto de columnas de `products` (no necesita `description`,
 * `cost_price`, `max_stock`, etc. para vender). Antes, `pos-content.tsx`
 * tipaba sus props como `Product[]` completo, lo cual era un error de tipos
 * real (oculto por `ignoreBuildErrors: true`) porque la query nunca trae esas
 * columnas. En vez de forzar la entidad completa (Product) o traer columnas
 * de más solo para satisfacer el tipo, se define un tipo más angosto que
 * refleja exactamente lo que el módulo de POS necesita — Interface
 * Segregation Principle: los consumidores no deben depender de campos que
 * no usan.
 */
export type POSProduct = Pick<
  Product,
  'id' | 'sku' | 'barcode' | 'name' | 'sale_price' | 'stock_quantity' | 'unit'
> & {
  category?: { id: string; name: string; color: string } | null
}

/**
 * Mismo razonamiento que POSProduct: la query de clientes en el POS
 * (app/dashboard/pos/page.tsx) solo trae id/name/email/phone — no el
 * historial de crédito completo — así que el tipo debe reflejar eso.
 */
export type POSCustomer = Pick<Customer, 'id' | 'name' | 'email' | 'phone'>

export interface CartItem {
  product: POSProduct
  quantity: number
  discount: number
}

/**
 * Antes, subtotal/descuento/total se calculaban inline dentro de POSContent con
 * `.reduce()`, mezclados con estado de React — imposible de probar sin renderizar
 * todo el componente. Extraerlos como funciones puras es la lógica financiera de
 * mayor riesgo del sistema (afecta directamente el dinero cobrado), así que
 * merece pruebas unitarias dedicadas (ver __tests__/calculations.test.ts).
 */
export function calculateSubtotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.product.sale_price * item.quantity, 0)
}

export function calculateTotalDiscount(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.discount, 0)
}

export function calculateTotal(cart: CartItem[]): number {
  return calculateSubtotal(cart) - calculateTotalDiscount(cart)
}

export function calculateChange(amountReceived: number, total: number): number {
  return Math.max(0, amountReceived - total)
}

export function canAddQuantity(item: CartItem, delta: number): boolean {
  const newQuantity = item.quantity + delta
  return newQuantity > 0 && newQuantity <= item.product.stock_quantity
}

export function formatCurrencyMXN(amount: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
}

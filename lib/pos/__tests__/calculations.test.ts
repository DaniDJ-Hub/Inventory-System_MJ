import { describe, expect, it } from 'vitest'
import {
  calculateChange,
  calculateSubtotal,
  calculateTotal,
  calculateTotalDiscount,
  canAddQuantity,
} from '../calculations'
import type { CartItem, POSProduct } from '../calculations'

function makeProduct(overrides: Partial<POSProduct> = {}): POSProduct {
  return {
    id: 'p1',
    sku: 'SKU-1',
    barcode: null,
    name: 'Cuaderno profesional',
    sale_price: 35,
    stock_quantity: 10,
    unit: 'pieza',
    ...overrides,
  }
}

describe('calculateSubtotal', () => {
  it('suma precio * cantidad de cada item', () => {
    const cart: CartItem[] = [
      { product: makeProduct({ sale_price: 35 }), quantity: 2, discount: 0 },
      { product: makeProduct({ sale_price: 10 }), quantity: 3, discount: 0 },
    ]
    expect(calculateSubtotal(cart)).toBe(35 * 2 + 10 * 3)
  })

  it('retorna 0 para un carrito vacío', () => {
    expect(calculateSubtotal([])).toBe(0)
  })
})

describe('calculateTotalDiscount', () => {
  it('suma los descuentos de todos los items', () => {
    const cart: CartItem[] = [
      { product: makeProduct(), quantity: 1, discount: 5 },
      { product: makeProduct(), quantity: 1, discount: 2.5 },
    ]
    expect(calculateTotalDiscount(cart)).toBe(7.5)
  })
})

describe('calculateTotal', () => {
  it('es subtotal menos descuento', () => {
    const cart: CartItem[] = [{ product: makeProduct({ sale_price: 100 }), quantity: 1, discount: 15 }]
    expect(calculateTotal(cart)).toBe(85)
  })
})

describe('calculateChange', () => {
  it('calcula el cambio correctamente', () => {
    expect(calculateChange(100, 85)).toBe(15)
  })

  it('nunca retorna un valor negativo (evita "cambio negativo" en UI)', () => {
    expect(calculateChange(50, 85)).toBe(0)
  })
})

describe('canAddQuantity', () => {
  it('permite incrementar si hay stock suficiente', () => {
    const item: CartItem = { product: makeProduct({ stock_quantity: 5 }), quantity: 2, discount: 0 }
    expect(canAddQuantity(item, 1)).toBe(true)
  })

  it('bloquea incrementar si excede el stock disponible', () => {
    const item: CartItem = { product: makeProduct({ stock_quantity: 5 }), quantity: 5, discount: 0 }
    expect(canAddQuantity(item, 1)).toBe(false)
  })

  it('bloquea reducir por debajo de 1', () => {
    const item: CartItem = { product: makeProduct(), quantity: 1, discount: 0 }
    expect(canAddQuantity(item, -1)).toBe(false)
  })
})

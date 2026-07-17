// Database Types for PaperFlow Inventory System

export interface Role {
  id: string
  name: 'admin' | 'manager' | 'cashier' | 'employee'
  description: string | null
  permissions: Record<string, boolean>
  created_at: string
}

export interface Profile {
  id: string
  role_id: string | null
  first_name: string
  last_name: string
  phone: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined fields
  role?: Role
}

export interface BusinessSettings {
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
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  description: string | null
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
  // Computed fields
  product_count?: number
}

export interface Supplier {
  id: string
  name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Computed fields
  product_count?: number
}

export interface Product {
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
  max_stock: number | null
  unit: string
  is_active: boolean
  image_url: string | null
  created_at: string
  updated_at: string
  // Joined fields
  category?: Category
  supplier?: Supplier
}

export interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  tax_id: string | null
  credit_limit: number
  current_balance: number
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Sale {
  id: string
  sale_number: number
  customer_id: string | null
  user_id: string
  subtotal: number
  tax_amount: number
  discount_amount: number
  total: number
  payment_method: 'cash' | 'card' | 'transfer' | 'credit'
  payment_status: 'paid' | 'pending' | 'cancelled'
  notes: string | null
  created_at: string
  // Joined fields
  customer?: Customer
  user?: Profile
  items?: SaleItem[]
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  quantity: number
  unit_price: number
  discount: number
  total: number
  created_at: string
  // Joined fields
  product?: Product
}

export interface Purchase {
  id: string
  purchase_number: number
  supplier_id: string | null
  user_id: string
  subtotal: number
  tax_amount: number
  total: number
  payment_status: 'paid' | 'pending' | 'partial'
  notes: string | null
  received_at: string | null
  created_at: string
  // Joined fields
  supplier?: Supplier
  user?: Profile
  items?: PurchaseItem[]
}

export interface PurchaseItem {
  id: string
  purchase_id: string
  product_id: string
  quantity: number
  unit_cost: number
  total: number
  created_at: string
  // Joined fields
  product?: Product
}

export interface StockMovement {
  id: string
  product_id: string
  user_id: string
  movement_type: 'in' | 'out' | 'adjustment' | 'sale' | 'purchase' | 'return'
  quantity: number
  previous_stock: number
  new_stock: number
  reference_type: string | null
  reference_id: string | null
  notes: string | null
  created_at: string
  // Joined fields
  product?: Product
  user?: Profile
}

export interface CashRegister {
  id: string
  user_id: string
  opening_amount: number
  closing_amount: number | null
  expected_amount: number | null
  difference: number | null
  cash_sales: number
  card_sales: number
  transfer_sales: number
  status: 'open' | 'closed'
  opened_at: string
  closed_at: string | null
  notes: string | null
  // Joined fields
  user?: Profile
}

export interface AuditLog {
  id: string
  user_id: string | null
  action: string
  table_name: string | null
  record_id: string | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
  // Joined fields
  user?: Profile
}

// Dashboard Stats
export interface DashboardStats {
  totalSales: number
  totalSalesAmount: number
  totalPurchases: number
  totalPurchasesAmount: number
  totalProducts: number
  lowStockProducts: number
  totalCustomers: number
  totalSuppliers: number
}

// Cart Item for POS
export interface CartItem {
  product: Product
  quantity: number
  discount: number
}

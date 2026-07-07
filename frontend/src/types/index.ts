export interface Business {
	id: string,
	name: string,
	phone: string | null
	created_at: string 
}

export interface Customer {
	id: string,
	business_id: string,
	name: string,
	phone: string | null
}

export interface Product {
	id: string,
	business_id: string,
	name: string
}

export interface PriceHistory {
	id: string,
	product_id: string,
	price: string,
	valid_from: string
}

export interface RecipeItem {
	id: string,
	product_id: string,
	item_id: string,
	quantity: string,
	unit: string
}

export interface Item {
	id: string,
	business_id: string,
	name: string,
	unit: string,
	current_stock: string,
	low_stock_threshold: string,
	notes: string | null
}

export interface RestockItem {
	id: string,
	restock_id: string,
	item_id: string,
	quantity: number 
}
export interface Restock {
	id: string,
	business_id: string,
	restock_date: string,
	supplier: string | null,
	notes: string | null,
	restock_items: RestockItem[]
}
export interface OrderItem {
	id: string,
	order_id: string,
	product_id: string,
	quantity: number,
	unit_price: string
}

export interface ProductWithDetails {
	id: string
	business_id: string
	name: string
	latest_price: PriceHistory | null
	recipe_items: RecipeItem[]
}

export type ActiveModal = { mode: 'info' | 'edit' | 'delete'; id: string } | null

export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled'

export interface Order {
	id: string,
	business_id: string,
	customer_id: string,
	created_at: string,
	status: OrderStatus,
	order_items: OrderItem[]
}

export type CreateItemPayload = Omit<Item, "id" | "business_id">
export type CreateRestockItemPayload = Omit<RestockItem, "id" | "restock_id">

export interface CreateRestockPayload {
	supplier: string
	notes: string
	restock_date: string
	restock_items: CreateRestockItemPayload[]
}

export type CreateOrderItemPayload = Omit<OrderItem, "id" | "order_id" | "unit_price">

export interface CreateOrderPayload {
	customer_id: string
	status: OrderStatus
	order_items: CreateOrderItemPayload[]
}

export type CreateCustomerPayload = Omit<Customer, "id" | "business_id">

export type CreateProductPayload = Omit<Product, "id" | "business_id">

export type CreatePriceHistoryPayload = Omit<PriceHistory, "id" | "product_id">

export type CreateRecipeItemPayload = Omit<RecipeItem, "id" | "product_id">

import {supabase} from '../supabase/supabaseClient'
import type { Order, OrderStatus, CreateOrderPayload } from '../types'

const API_URL = import.meta.env.VITE_API_URL

export async function createOrder(orderData: CreateOrderPayload): Promise<Order> {
	const { data, error } = await supabase.auth.getSession()
	const token = data.session?.access_token

	if (!token) {
		throw new Error('User is not authenticated')
	}
	const response = await fetch(`${API_URL}/orders`, {
		method: "POST",
		headers: {
			'Authorization': `Bearer ${token}`,
			'Content-type': 'application/json'
		},
		body: JSON.stringify(orderData)
	})

	if (!response.ok) {
		const errorBody = await response.json()
		throw new Error(errorBody.detail || `Error ${response.status}`)
	}
	return response.json()
}

export async function updateOrder(id: string, orderData: Partial<CreateOrderPayload>): Promise<Order> {
	const { data, error } = await supabase.auth.getSession()
	const token = data.session?.access_token

	if (!token) {
		throw new Error('User is not authenticated')
	}

	const response = await fetch(`${API_URL}/orders/${id}/status`, {
		method: "PATCH",
		headers: {
			'Authorization': `Bearer ${token}`,
			'Content-type': 'application/json'
		},
		body: JSON.stringify(orderData)
	})

	if (!response.ok) {
		const errorBody = await response.json()
		throw new Error(errorBody.detail || `Error ${response.status}`)
	}
	return response.json()
}

export async function getOrders({ 
	limit, 
	offset, 
	status,
	orderDate,
	sortByDate
}: { 
	limit?: number | null; 
	offset?: number | null; 
	status?: OrderStatus | null;
	orderDate?: string | null;
	sortByDate?: 'asc'| 'desc' | null;
}): Promise<Order[]> {
	const { data, error } = await supabase.auth.getSession()
	const token = data.session?.access_token

	if (!token) {
		throw new Error('User is not authenticated')
	}

	const url = new URL(`${API_URL}/orders`)
	
	// Only append to the query string if the value is explicitly provided
	if (limit !== null && limit !== undefined) {
		url.searchParams.append('limit', limit.toString())
	}
	
	if (offset !== null && offset !== undefined) {
		url.searchParams.append('offset', offset.toString())
	}

	if (orderDate) {
		url.searchParams.append('order_date', orderDate)
	}

	if (sortByDate) {
		url.searchParams.append('sort_by_date', sortByDate)
	}
	
	if (status) {
		url.searchParams.append('status', status)
	}

	const response = await fetch(url.toString(), {
		headers: {
			'Authorization': `Bearer ${token}`
		}
	})

	if (!response.ok) {
		const errorBody = await response.json()
		throw new Error(errorBody.detail || `Error ${response.status}`)
	}
	return response.json()
}

import {supabase} from '../supabase/supabaseClient'
import type { Order, OrderStatus } from '../types'

const API_URL = import.meta.env.VITE_API_URL

export async function getOrders(): Promise<Order []> {
	const { data, error } = await supabase.auth.getSession()
	const token = data.session?.access_token

	if (!token) {
		throw new Error('User is not authenticated')
	}
	const response = await fetch(`${API_URL}/orders`, {
		headers: {
			'Authorization': `Bearer ${token}`
		}
	})

	if (!response.ok) throw new Error('Items not found')
	return response.json()
}

export async function getOrderByStatus(status: OrderStatus): Promise<Order []> {
	const { data, error } = await supabase.auth.getSession()
	const token = data.session?.access_token

	if (!token) {
		throw new Error('User is not authenticated')
	}
	const response = await fetch(`${API_URL}/orders?status=${status}`, {
		headers: {
			'Authorization': `Bearer ${token}`
		}
	})

	if (!response.ok) throw new Error('Items not found')
	return response.json()
}

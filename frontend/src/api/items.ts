import {supabase} from '../supabase/supabaseClient'
import type { Item } from '../types'

const API_URL = import.meta.env.VITE_API_URL

export async function getStock(): Promise<Item []> {
	const { data, error } = await supabase.auth.getSession()
	const token = data.session?.access_token

	if (!token) {
		throw new Error('User is not authenticated')
	}
	const response = await fetch(`${API_URL}/items`, {
		headers: {
			'Authorization': `Bearer ${token}`
		}
	})

	if (!response.ok) throw new Error('Items not found')
	return response.json()
}

export async function getLowStockItems(): Promise<Item []> {
	const { data, error } = await supabase.auth.getSession()
	const token = data.session?.access_token

	if (!token) {
		throw new Error('User is not authenticated')
	}
	const response = await fetch(`${API_URL}/items/low-stock`, {
		headers: {
			'Authorization': `Bearer ${token}`
		}
	})

	if (!response.ok) throw new Error('Items not found')
	return response.json()
}

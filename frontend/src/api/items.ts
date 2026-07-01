import {supabase} from '../supabase/supabaseClient'
import type { CreateItemPayload, Item } from '../types'

const API_URL = import.meta.env.VITE_API_URL

export async function createItem(itemData: CreateItemPayload): Promise<Item> {
	const { data, error } = await supabase.auth.getSession()
	const token = data.session?.access_token

	if (!token) {
		throw new Error('User is not authenticated')
	}
	const response = await fetch(`${API_URL}/items`, {
		method: "POST",
		headers: {
			'Authorization': `Bearer ${token}`,
			'Content-type': 'application/json'
		},
		body: JSON.stringify(itemData)
	})

	if (!response.ok) throw new Error(`Error when creating item: ${response.text}`)
	return response.json()
}

export async function updateItem(itemId: string, itemData: Partial<CreateItemPayload>): Promise<Item> {
	const { data, error } = await supabase.auth.getSession()
	const token = data.session?.access_token

	if (!token) {
		throw new Error('User is not authenticated')
	}
	const response = await fetch(`${API_URL}/items/${itemId}`, {
		method: "PATCH",
		headers: {
			'Authorization': `Bearer ${token}`,
			'Content-type': 'application/json'
		},
		body: JSON.stringify(itemData)
	})

	if (!response.ok) throw new Error(`Error when creating item: ${response.text}`)
	return response.json()
}

export async function deleteItem(itemId: string): Promise<void> {
	const { data, error } = await supabase.auth.getSession()
	const token = data.session?.access_token

	if (!token) {
		throw new Error('User is not authenticated')
	}
	const response = await fetch(`${API_URL}/items/${itemId}`, {
		method: "DELETE",
		headers: {
			'Authorization': `Bearer ${token}`,
			'Content-type': 'application/json'
		}
	})

	if (!response.ok) throw new Error(`Error when creating item: ${response.text}`)
}

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

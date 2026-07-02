import { supabase } from '../supabase/supabaseClient'
import type { CreateRestockPayload, Restock } from '../types'

const API_URL = import.meta.env.VITE_API_URL

export async function createRestock(restockData: CreateRestockPayload): Promise<Restock> {
	const { data, error } = await supabase.auth.getSession()
	const token = data.session?.access_token

	if (!token) {
		throw new Error('User is not authenticated')
	}
	const response = await fetch(`${API_URL}/restocks`, {
		method: "POST",
		headers: {
			'Authorization': `Bearer ${token}`,
			'Content-type': 'application/json'
		},
		body: JSON.stringify(restockData)
	})

	if (!response.ok) throw new Error(`Error when creating item: ${response.text}`)
	return response.json()
}

export async function updateRestock(id: string, itemData: Partial<CreateRestockPayload>): Promise<Restock> {
	const { data, error } = await supabase.auth.getSession()
	const token = data.session?.access_token

	if (!token) {
		throw new Error('User is not authenticated')
	}
	const response = await fetch(`${API_URL}/restocks/${id}`, {
		method: "PATCH",
		headers: {
			'Authorization': `Bearer ${token}`,
			'Content-type': 'application/json'
		},
		body: JSON.stringify(itemData)
	})

	if (!response.ok) throw new Error(`Error when updating restock: ${response.text}`)
	return response.json()
}

export async function deleteRestock(id: string): Promise<void> {
	const { data, error } = await supabase.auth.getSession()
	const token = data.session?.access_token

	if (!token) {
		throw new Error('User is not authenticated')
	}
	const response = await fetch(`${API_URL}/restocks/${id}`, {
		method: "DELETE",
		headers: {
			'Authorization': `Bearer ${token}`,
			'Content-type': 'application/json'
		}
	})

	if (!response.ok) throw new Error(`Error when deleting restock: ${response.text}`)
}



export async function getRestocks(): Promise<Restock []> {
	const { data, error } = await supabase.auth.getSession()
	const token = data.session?.access_token

	if (!token) {
		throw new Error('User is not authenticated')
	}
	const response = await fetch(`${API_URL}/restocks`, {
		headers: {
			'Authorization': `Bearer ${token}`
		}
	})

	if (!response.ok) throw new Error('Restocks not found')
	return response.json()
}


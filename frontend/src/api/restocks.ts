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
	if (!response.ok) {
		const errorBody = await response.json()
		throw new Error(errorBody.detail || `Error ${response.status}`)
	}
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
	if (!response.ok) {
		const errorBody = await response.json()
		throw new Error(errorBody.detail || `Error ${response.status}`)
	}
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
	if (!response.ok) {
		const errorBody = await response.json()
		throw new Error(errorBody.detail || `Error ${response.status}`)
	}
}



export async function getRestocks({
	limit, 
	offset, 
	supplier,
}: {
	limit?: number | null
	offset?: number | null
	supplier?: string | null
}): Promise<Restock []> {
	const { data, error } = await supabase.auth.getSession()
	const token = data.session?.access_token

	if (!token) {
		throw new Error('User is not authenticated')
	}

	const url = new URL(`${API_URL}/restocks`)

	if (limit !== null && limit !== undefined) {
		url.searchParams.append('limit', limit.toString())
	}
	
	if (offset !== null && offset !== undefined) {
		url.searchParams.append('offset', offset.toString())
	}

	if (supplier) {
		url.searchParams.append('supplier', supplier)
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


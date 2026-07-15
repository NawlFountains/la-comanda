import type { BusinessCreateData } from '../schemas/business'
import type { Business } from '../types'

const API_URL = import.meta.env.VITE_API_URL

export async function getMyBusiness(token: string): Promise<Business> {
	const response = await fetch(`${API_URL}/businesses/me`, {
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

export async function createBusiness(token: string, data: BusinessCreateData): Promise<Business> {
	const response = await fetch(`${API_URL}/businesses`, {
		method: "POST",
		headers: {
			'Authorization': `Bearer ${token}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(data)
	})

	if (!response.ok) {
		const errorBody = await response.json()
		throw new Error(errorBody.detail || `Error ${response.status}`)
	}
	return response.json()
}

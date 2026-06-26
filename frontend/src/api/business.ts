import type { Business } from '../types'

const API_URL = import.meta.env.VITE_API_URL

export async function getMyBusiness(token: string): Promise<Business> {
	const response = await fetch(`${API_URL}/businesses/me`, {
		headers: {
			'Authorization': `Bearer ${token}`
		}
	})

	if (!response.ok) throw new Error('Business not found')
	return response.json()
}

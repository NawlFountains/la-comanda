import {supabase} from '../supabase/supabaseClient'
import type { Product } from '../types'

const API_URL = import.meta.env.VITE_API_URL

export async function getProducts(): Promise<Product []> {
	const { data, error } = await supabase.auth.getSession()
	const token = data.session?.access_token

	if (!token) {
		throw new Error('User is not authenticated')
	}
	const response = await fetch(`${API_URL}/products`, {
		headers: {
			'Authorization': `Bearer ${token}`
		}
	})

	if (!response.ok) throw new Error('Products not found')
	return response.json()
}

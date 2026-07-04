import {supabase} from '../supabase/supabaseClient'
import type { CreateProductPayload, Product } from '../types'

const API_URL = import.meta.env.VITE_API_URL

export async function createProduct(productData: CreateProductPayload): Promise<Product> {
	const { data, error } = await supabase.auth.getSession()
	const token = data.session?.access_token

	if (!token) {
		throw new Error('User is not authenticated')
	}
	const response = await fetch(`${API_URL}/products`, {
		method: "POST",
		headers: {
			'Authorization': `Bearer ${token}`,
			'Content-type': 'application/json'
		},
		body: JSON.stringify(productData)
	})

	if (!response.ok) throw new Error(`Error when creating product: ${response.text}`)
	return response.json()
}

export async function updateProduct(productId: string, productData: Partial<CreateProductPayload>): Promise<Product> {
	const { data, error } = await supabase.auth.getSession()
	const token = data.session?.access_token

	if (!token) {
		throw new Error('User is not authenticated')
	}
	const response = await fetch(`${API_URL}/products/${productId}`, {
		method: "PATCH",
		headers: {
			'Authorization': `Bearer ${token}`,
			'Content-type': 'application/json'
		},
		body: JSON.stringify(productData)
	})

	if (!response.ok) throw new Error(`Error when updating product: ${response.text}`)
	return response.json()
}

export async function deleteProduct(productId: string) {
	const { data, error } = await supabase.auth.getSession()
	const token = data.session?.access_token

	if (!token) {
		throw new Error('User is not authenticated')
	}
	const response = await fetch(`${API_URL}/products/${productId}`, {
		method: "DELETE",
		headers: {
			'Authorization': `Bearer ${token}`,
			'Content-type': 'application/json'
		}
	})

	if (!response.ok) throw new Error(`Error when deleting product: ${response.text}`)
}

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

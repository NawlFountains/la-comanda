import type {PriceHistoryCreateData} from '../schemas/price_history'
import type {ProductCreateData, ProductUpdateData} from '../schemas/product'
import type {RecipeItemCreateData, RecipeItemUpdateData} from '../schemas/recipe_item'
import {supabase} from '../supabase/supabaseClient'
import type { PriceHistory, Product, ProductWithDetails, RecipeItem } from '../types'

const API_URL = import.meta.env.VITE_API_URL

export async function createProduct(productData: ProductCreateData): Promise<Product> {
	const { data } = await supabase.auth.getSession()
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
	if (!response.ok) {
		const errorBody = await response.json()
		throw new Error(errorBody.detail || `Error ${response.status}`)
	}
	return response.json()
}

export async function createPriceProduct(productId: string, priceData: PriceHistoryCreateData): Promise<PriceHistory> {
	const { data } = await supabase.auth.getSession()
	const token = data.session?.access_token

	if (!token) {
		throw new Error('User is not authenticated')
	}
	const response = await fetch(`${API_URL}/products/${productId}/prices`, {
		method: "POST",
		headers: {
			'Authorization': `Bearer ${token}`,
			'Content-type': 'application/json'
		},
		body: JSON.stringify(priceData)
	})

	if (!response.ok) {
		const errorBody = await response.json()
		throw new Error(errorBody.detail || `Error ${response.status}`)
	}
	return response.json()
}

export async function createRecipeItem(productId: string, recipeItemData: RecipeItemCreateData): Promise<RecipeItem> {
	const { data } = await supabase.auth.getSession()
	const token = data.session?.access_token

	if (!token) {
		throw new Error('User is not authenticated')
	}
	const response = await fetch(`${API_URL}/products/${productId}/recipe`, {
		method: "POST",
		headers: {
			'Authorization': `Bearer ${token}`,
			'Content-type': 'application/json'
		},
		body: JSON.stringify(recipeItemData)
	})


	if (!response.ok) throw new Error(`Error when creating price: ${response.text}`)
	return response.json()
}

export async function updateProduct(productId: string, productData: ProductUpdateData): Promise<Product> {
	const { data } = await supabase.auth.getSession()
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

export async function updateRecipeItem(productId: string, recipeId: string, recipeItemData: RecipeItemUpdateData): Promise<RecipeItem> {
	const { data } = await supabase.auth.getSession()
	const token = data.session?.access_token

	if (!token) {
		throw new Error('User is not authenticated')
	}
	const response = await fetch(`${API_URL}/products/${productId}/recipe/${recipeId}`, {
		method: "PATCH",
		headers: {
			'Authorization': `Bearer ${token}`,
			'Content-type': 'application/json'
		},
		body: JSON.stringify(recipeItemData)
	})

	if (!response.ok) throw new Error(`Error when updating recipe item: ${response.text}`)
	return response.json()
}



export async function deleteProduct(productId: string) {
	const { data } = await supabase.auth.getSession()
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

export async function deletePrice(productId: string, priceId: string) {
	const { data } = await supabase.auth.getSession()
	const token = data.session?.access_token

	if (!token) {
		throw new Error('User is not authenticated')
	}
	const response = await fetch(`${API_URL}/products/${productId}/prices/${priceId}`, {
		method: "DELETE",
		headers: {
			'Authorization': `Bearer ${token}`,
			'Content-type': 'application/json'
		}
	})

	if (!response.ok) throw new Error(`Error when deleting price: ${response.text}`)
}

export async function deleteRecipeItem(productId: string, recipeId: string) {
	const { data } = await supabase.auth.getSession()
	const token = data.session?.access_token

	if (!token) {
		throw new Error('User is not authenticated')
	}
	const response = await fetch(`${API_URL}/products/${productId}/recipe/${recipeId}`, {
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

export async function getProducts(): Promise<Product []> {
	const { data } = await supabase.auth.getSession()
	const token = data.session?.access_token

	if (!token) {
		throw new Error('User is not authenticated')
	}
	const response = await fetch(`${API_URL}/products`, {
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

export async function getProductsWithDetails(): Promise<ProductWithDetails[]> {
	const { data } = await supabase.auth.getSession()
	const token = data.session?.access_token

	if (!token) {
		throw new Error('User is not authenticated')
	}
	const response = await fetch(`${API_URL}/products/full`, {
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

export async function getProductPriceHistory(productId: string): Promise<PriceHistory[]> {
	const { data } = await supabase.auth.getSession()
	const token = data.session?.access_token

	if (!token) {
		throw new Error('User is not authenticated')
	}
	const response = await fetch(`${API_URL}/products/${productId}/prices`, {
		headers: {
			'Authorization': `Bearer ${token}`,
			'Content-type': 'application/json'
		}
	})

	if (!response.ok) {
		const errorBody = await response.json()
		throw new Error(errorBody.detail || `Error ${response.status}`)
	}
	return response.json()
}

export async function getProductRecipeItems(productId: string): Promise<RecipeItem[]> {
	const { data } = await supabase.auth.getSession()
	const token = data.session?.access_token

	if (!token) {
		throw new Error('User is not authenticated')
	}
	const response = await fetch(`${API_URL}/products/${productId}/recipe`, {
		headers: {
			'Authorization': `Bearer ${token}`,
			'Content-type': 'application/json'
		}
	})
	if (!response.ok) {
		const errorBody = await response.json()
		throw new Error(errorBody.detail || `Error ${response.status}`)
	}
	return response.json()
}



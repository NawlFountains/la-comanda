import { useState, useEffect, useMemo, useCallback } from 'react'
import { getProducts } from '../api/products'
import type { Product } from '../types'

export const useProducts = () => {
	const [products, setProducts] = useState<Product[]>([])
	const [searchQuery, setSearchQuery] = useState("")
	const [loading, setLoading] = useState<boolean>(false)
	const [errors, setErrors] = useState<{ name?: string, unit?: string, current_stock?: string, low_stock_threshold?: string }>({})
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		// TODO change backend to add recipes and prices
		async function loadProducts() {
			try {
				setLoading(true)
				const data = await getProducts()
				setProducts(data)
			} catch (err) {
				setError(err)
			} finally {
				setLoading(false)
			}
		}
		loadProducts()
	}, [])

	const visibleProducts = useMemo(() => {
		return products.filter(product=>
			product.name.toLowerCase().includes(searchQuery.toLowerCase())
		)
	}, [products, searchQuery])

	return {
		products: visibleProducts,
		searchQuery,
		setSearchQuery,
		loading,
		errors,
		error
	}
}

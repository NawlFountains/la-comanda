import { useState, useEffect, useMemo, useCallback } from 'react'
import { createProduct, deleteProduct, getProducts, updateProduct } from '../api/products'
import { productCreateSchema, productUpdateSchema } from '../schemas/product'
import type { CreateProductPayload, Product } from '../types'

export const useProducts = () => {
	const [products, setProducts] = useState<Product[]>([])
	const [searchQuery, setSearchQuery] = useState("")
	const [loading, setLoading] = useState<boolean>(false)
	const [submitting, setSubmitting] = useState<boolean>(false)
	const [errors, setErrors] = useState<{ name?: string }>({})
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

	const handleProductCreate = useCallback( async (productData: CreateProductPayload): Promise<boolean> => {
		const result = productCreateSchema.safeParse(productData)
		if (!result.success) {
			const newErrors: typeof errors = {}
			for (const issue of result.error.issues) {
				const field = issue.path[0] as keyof typeof newErrors
				if (!newErrors[field]) newErrors[field] = issue.message
			}
			setErrors(newErrors)
			return false
		}
		setErrors({})		
		setSubmitting(true)
		setError(null)
		try {
			const newProduct: Product = await createProduct(productData)

			setProducts((prevProducts) => [...prevProducts, newProduct])
			return true
		} catch (err) {
			setError(err)
			console.error("Failed to create product:", err)
			return false
		} finally {
			setSubmitting(false)
		}
	} , [])

	const handleProductUpdate = useCallback( async (id: string, productData: Partial<CreateProductPayload>): Promise<boolean> => {
		const result = productUpdateSchema.safeParse(productData)
		if (!result.success) {
			const newErrors: typeof errors = {}
			for (const issue of result.error.issues) {
				const field = issue.path[0] as keyof typeof newErrors
				if (!newErrors[field]) newErrors[field] = issue.message
			}
			setErrors(newErrors)
			return false
		}
		setErrors({})		
		setSubmitting(true)
		setError(null)
		try {
			const updatedProduct: Product = await updateProduct(id, productData)
			setProducts((prevProducts) => prevProducts.map((product) => product.id === id ? updatedProduct: product))
			return true
		} catch (err) {
			setError(err)
			console.error("Failed to update product:", err)
			return false
		} finally {
			setSubmitting(false)
		}
	} , [])

	const handleProductDelete = async (id: string) => {
		setSubmitting(true)
		setError(null)
		try {
			await deleteProduct(id)

			setProducts((prevProducts) => prevProducts.filter((product) => product.id !== id))
		} catch (err) {
			setError(err)
			console.error("Failed to delete product:", err)
		} finally {
			setSubmitting(false)
		}
	}

	const visibleProducts = useMemo(() => {
		return products.filter(product=>
			product.name.toLowerCase().includes(searchQuery.toLowerCase())
		)
	}, [products, searchQuery])

	return {
		products,
		visibleProducts,
		searchQuery,
		setSearchQuery,
		handleProductCreate,
		handleProductUpdate,
		handleProductDelete,
		loading,
		submitting,
		errors,
		error
	}
}

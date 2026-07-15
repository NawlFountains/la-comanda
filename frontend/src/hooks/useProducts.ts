import { useState, useEffect, useMemo, useCallback } from 'react'
import { createProduct, deleteProduct, updateProduct, getProductsWithDetails } from '../api/products'
import type { Product, ProductWithDetails } from '../types'
import { productCreateSchema, productUpdateSchema } from '../schemas/product'
import type { ProductCreateData, ProductErrors, ProductUpdateData } from '../schemas/product'
import { useToast } from '../context/ToastContext'
import { useValidation } from './useValidation'

export const useProducts = () => {
	const { showToast } = useToast()

	const [products, setProducts] = useState<ProductWithDetails[]>([])

	const [searchName, setSearchName] = useState("")
	const [appliedSearchName, setAppliedSearchName ] = useState("")

	const [loading, setLoading] = useState<boolean>(false)
	const [submitting, setSubmitting] = useState<boolean>(false)

	const { errors , validate, clearErrors } = useValidation<ProductErrors>()

	const validateProduct = useCallback((data: ProductCreateData) => validate(productCreateSchema, data), [validate])
	const validateProductUpdate = useCallback((data: ProductUpdateData) => validate(productUpdateSchema, data), [validate])

	const [loadError, setLoadError] = useState<string | null>(null)

	useEffect(() => {
		async function loadProducts() {
			try {
				setLoading(true)
				const data = await getProductsWithDetails()
				setProducts(data)
			} catch (err) {
				setLoadError(err instanceof Error ? err.message : "Unkown error")
			} finally {
				setLoading(false)
			}
		}
		loadProducts()
	}, [])

		const handleProductCreate = useCallback( async (productData: ProductCreateData): Promise<boolean> => {
		setSubmitting(true)
		let tempId = crypto.randomUUID()
		let optimisticProduct: ProductWithDetails = {
			...productData,
			id: tempId,
			business_id: tempId,
			latest_price: null,
			recipe_items: []
		}

		setProducts((prev) => [...prev, optimisticProduct])
		try {
			const newProduct: Product = await createProduct(productData)

			const newProductWithNoDetails : ProductWithDetails = ({
				id: newProduct.id,
				business_id: newProduct.business_id,
				name: newProduct.name,
				latest_price: null,
				recipe_items: []
			})

			setProducts((prev) => 
				 prev.map((p) => (p.id === tempId ? newProductWithNoDetails : p))
			)
			showToast('Product created succesfully','message')
			return true
		} catch (err) {
			setProducts((prev) => prev.filter((p) => p.id !== tempId))
			const message = err instanceof Error ? err.message : "Unknown error"
			showToast(`Failed to create product: ${message}`)
			return false
		} finally {
			setSubmitting(false)
		}
	} , [])

	const handleProductUpdate = useCallback( async (id: string, productData: ProductUpdateData): Promise<boolean> => {
		setSubmitting(true)

		let previousProduct: ProductWithDetails | undefined
		setProducts((prev) => {
			previousProduct = prev.find((p) => p.id === id)
			return prev.map((p) => (p.id === id ? { ...p, ...productData } : p))
		})
		try {
			const updatedProduct: Product = await updateProduct(id, productData)
			setProducts((prev) =>
				prev.map((p) => (p.id === id ? { ...p, ...updatedProduct } : p))
			)
			showToast('Product updated successfully', 'message')
			return true
		} catch (err) {
			if (previousProduct) {
				setProducts((prev) => prev.map((p) => (p.id === id ? previousProduct! : p)))
			}
			const message = err instanceof Error ? err.message : "Unknown error"
			showToast(`Failed to update product: ${message}`)
			return false
		} finally {
			setSubmitting(false)
		}	} , [])

	const handleProductDelete = async (id: string) => {
		setSubmitting(true)
		try {
			await deleteProduct(id)

			setProducts((prevProducts) => prevProducts.filter((product) => product.id !== id))
			showToast('Product deleted succesfully','message')
		} catch (err) {
			const message = err instanceof Error ? err.message : "Unknown error"
			showToast(`Failed to delete product: ${message}`)
		} finally {
			setSubmitting(false)
		}
	}
	const visibleProducts = useMemo(() => {
		return products.filter(product=>
			product.name.toLowerCase().includes(appliedSearchName.toLowerCase())
		)
	}, [products, appliedSearchName])

	const handleSearchNameChanged = (name: string | null) => {
		setAppliedSearchName(name ? name : '')
	}

	return {
		products,
		setProducts,
		visibleProducts,
		searchName,
		setSearchName,
		setAppliedSearchName: handleSearchNameChanged,
		validateProduct,
		validateProductUpdate,
		handleProductCreate,
		handleProductUpdate,
		handleProductDelete,
		loading,
		submitting,
		errors,
		loadError,
		clearErrors,
	}
}

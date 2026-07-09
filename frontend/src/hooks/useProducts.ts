import { useState, useEffect, useMemo, useCallback } from 'react'
import { createPriceProduct, createProduct, deleteProduct, getProductPriceHistory, updateProduct, createRecipeItem, deleteRecipeItem, updateRecipeItem, getProductsWithDetails } from '../api/products'
import { productCreateSchema, productUpdateSchema, type ProductErrors } from '../schemas/product'
import type { PriceHistory, RecipeItem, CreateProductPayload, Product, CreatePriceHistoryPayload, CreateRecipeItemPayload, ProductWithDetails } from '../types'
import {parseZodErrors} from '../utils/parseZodErrors'
import {priceHistoryCreateSchema, type PriceHistoryErrors } from '../schemas/price_history'
import {recipeItemCreateSchema, recipeItemUpdateSchema, type RecipeItemErrors} from '../schemas/recipe_item'

export const useProducts = (activeProductId?: string | null) => {
	const [products, setProducts] = useState<ProductWithDetails[]>([])

	const [prices, setPrices] = useState<PriceHistory[]>([])

	const [searchName, setSearchName] = useState("")
	const [appliedSearchName, setAppliedSearchName ] = useState("")

	const [loading, setLoading] = useState<boolean>(false)
	const [loadingDetails, setLoadingDetails] = useState<boolean>(false)
	const [submitting, setSubmitting] = useState<boolean>(false)
	const [errors, setErrors] = useState<ProductErrors>({})
	const [priceErrors, setPriceErrors] = useState<PriceHistoryErrors>({})
	const [recipeErrors, setRecipeErrors] = useState<RecipeItemErrors>({})

	const [loadError, setLoadError] = useState<string | null>(null)
	const [submitError, setSubmitError] = useState<string | null>(null)

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

	useEffect(() => {
		if (!activeProductId) return

		async function loadProductPriceHistory() {
			try {
				setLoadingDetails(true)

				if (activeProductId) {
					const prices = await getProductPriceHistory(activeProductId)
					setPrices(prices)
				}

			} catch (err) {
				setLoadError(err instanceof Error ? err.message : "Unkown error")
			} finally {
				setLoadingDetails(false)
			}
		}
		
		loadProductPriceHistory()
	}, [activeProductId])

	const handleProductCreate = useCallback( async (productData: CreateProductPayload): Promise<boolean> => {
		const result = productCreateSchema.safeParse(productData)
		if (!result.success) {
			const newErrors = parseZodErrors<ProductErrors>(result.error)
			setErrors(newErrors)
			return false
		}
		setErrors({})		
		setSubmitting(true)
		setSubmitError(null)
		try {
			const newProduct: Product = await createProduct(productData)

			const newProductWithNoDetails : ProductWithDetails = ({
				id: newProduct.id,
				business_id: newProduct.business_id,
				name: newProduct.name,
				latest_price: null,
				recipe_items: []
			})

			setProducts((prevProducts) => [...prevProducts, newProductWithNoDetails])
			return true
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : "Unknown error")
			console.error("Failed to create product :", err)
			return false
		} finally {
			setSubmitting(false)
		}
	} , [])

	const handleProductUpdate = useCallback( async (id: string, productData: Partial<CreateProductPayload>): Promise<boolean> => {
		const result = productUpdateSchema.safeParse(productData)
		if (!result.success) {
			const newErrors = parseZodErrors<ProductErrors>(result.error)
			setErrors(newErrors)
			return false
		}
		setErrors({})		
		setSubmitting(true)
		setSubmitError(null)
		try {
			const updatedProduct: Product = await updateProduct(id, productData)
			setProducts((prevProducts) => 
				prevProducts.map((product) => 
					product.id === id ? { ...product, ...updatedProduct } : product
				)
			)
			return true
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : "Unknown error")
			console.error("Failed to update product:", err)
			return false
		} finally {
			setSubmitting(false)
		}
	} , [])

	const handleProductDelete = async (id: string) => {
		setSubmitting(true)
		setSubmitError(null)
		try {
			await deleteProduct(id)

			setProducts((prevProducts) => prevProducts.filter((product) => product.id !== id))
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : "Unknown error")
			console.error("Failed to delete product:", err)
		} finally {
			setSubmitting(false)
		}
	}

	const handlePriceCreate = useCallback( async (productId: string, priceData: CreatePriceHistoryPayload): Promise<boolean> => {
		const result = priceHistoryCreateSchema.safeParse(priceData)
		if (!result.success) {
			const newErrors = parseZodErrors<PriceHistoryErrors>(result.error)
			setPriceErrors(newErrors)
			return false
		}
		setPriceErrors({})		
		setSubmitting(true)
		setSubmitError(null)
		try {
			const newPrice: PriceHistory = await createPriceProduct(productId, priceData)

			setPrices((prevPrices) => [...prevPrices, newPrice])
			setProducts((prevProducts) => 
					prevProducts.map((product) => {
						if (product.id !== productId) return product

						const hasNoPrice = !product.latest_price
						
						const isNewer = product.latest_price && 
							new Date(newPrice.valid_from) > new Date(product.latest_price.valid_from)

						if (hasNoPrice || isNewer) return { ...product, latest_price: newPrice }
						return product
					})
				)
			return true
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : "Unknown error")
			console.error("Failed to create price:", err)
			return false
		} finally {
			setSubmitting(false)
		}
	}, [])

	const handleRecipeItemCreate = useCallback( async (productId: string, recipeItemData: CreateRecipeItemPayload ): Promise<boolean> => {
		const result = recipeItemCreateSchema.safeParse(recipeItemData)
		if (!result.success) {
			const newErrors = parseZodErrors<RecipeItemErrors>(result.error)
			setRecipeErrors(newErrors)
			return false
		}
		setPriceErrors({})		
		setSubmitting(true)
		setSubmitError(null)
		try {
			const newRecipeItem: RecipeItem = await createRecipeItem(productId, recipeItemData)

			setProducts((prevProducts) => 
				    prevProducts.map((product) => 
						product.id === productId
							? { ...product, recipe_items: [...product.recipe_items, newRecipeItem] }
							: product
				    )
			)
			return true
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : "Unknown error")
			console.error("Failed to create recipe item:", err)
			return false
		} finally {
			setSubmitting(false)
		}
	}, []) 

	const handleRecipeItemUpdate = useCallback( async (productId: string, recipeId: string, recipeItemData: Partial<CreateRecipeItemPayload> ): Promise<boolean> => {
		const result = recipeItemUpdateSchema.safeParse(recipeItemData)
		if (!result.success) {
			const newErrors = parseZodErrors<RecipeItemErrors>(result.error)
			setRecipeErrors(newErrors)
			return false
		}
		setRecipeErrors({})		
		setSubmitting(true)
		setSubmitError(null)
		try {
			const updatedRecipeItem: RecipeItem = await updateRecipeItem(productId, recipeId, recipeItemData)

			setProducts((prevProducts) => 
				    prevProducts.map((product) => 
						product.id === productId
							? {
								...product,
								recipe_items: product.recipe_items.map((item) => 
									item.id === recipeId ? updatedRecipeItem : item
								)
							}
							: product
				    )
			)
			return true
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : "Unknown error")
			return false
		} finally {
			setSubmitting(false)
		}
	} , [])


	const handleRecipeItemDelete = async ( productId: string, id: string) => {
		setSubmitting(true)
		setSubmitError(null)
		try {
			await deleteRecipeItem(productId, id)

			setProducts((prevProducts) => 
				prevProducts.map((product) => 
					product.id === productId 
						? { ...product, recipe_items: product.recipe_items.filter((item) => item.id !== id) }
						: product
				)
			)
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : "Unknown error")
			console.error("Failed to delete product:", err)
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
		visibleProducts,
		prices,
		searchName,
		setSearchName,
		setAppliedSearchName: handleSearchNameChanged,
		handleProductCreate,
		handleProductUpdate,
		handleProductDelete,
		handlePriceCreate,
		handleRecipeItemCreate,
		handleRecipeItemUpdate,
		handleRecipeItemDelete,
		loading,
		loadingDetails,
		submitting,
		errors,
		priceErrors,
		recipeErrors,
		loadError,
		submitError
	}
}

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createPriceProduct, createProduct, deleteProduct, getProductPriceHistory, getProductRecipeItems, getProducts, updateProduct, createRecipeItem, deleteRecipeItem, updateRecipeItem } from '../api/products'
import { productCreateSchema, productUpdateSchema, type ProductErrors } from '../schemas/product'
import type { PriceHistory, RecipeItem, CreateProductPayload, Product, CreatePriceHistoryPayload, CreateRecipeItemPayload } from '../types'
import {parseZodErrors} from '../utils/parseZodErrors'
import {priceHistoryCreateSchema, type PriceHistoryErrors } from '../schemas/price_history'
import {recipeItemCreateSchema, recipeItemUpdateSchema, type RecipeItemErrors} from '../schemas/recipe_item'

export const useProducts = (activeProductId?: string | null) => {
	const [products, setProducts] = useState<Product[]>([])
	const [prices, setPrices] = useState<PriceHistory[]>([])
	const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([])
	const [searchQuery, setSearchQuery] = useState("")
	const [loading, setLoading] = useState<boolean>(false)
	const [loadingDetails, setLoadingDetails] = useState<boolean>(false)
	const [submitting, setSubmitting] = useState<boolean>(false)
	const [errors, setErrors] = useState<ProductErrors>({})
	const [priceErrors, setPriceErrors] = useState<PriceHistoryErrors>({})
	const [recipeErrors, setRecipeErrors] = useState<RecipeItemErrors>({})

	const [loadError, setLoadError] = useState<string | null>(null)
	const [submitError, setSubmitError] = useState<string | null>(null)

	useEffect(() => {
		// TODO change backend to retrive full product with recipes and prices `products/full`
		async function loadProducts() {
			try {
				setLoading(true)
				const data = await getProducts()
				setProducts(data)
			} catch (err) {
				setLoadError(err)
			} finally {
				setLoading(false)
			}
		}
		loadProducts()
	}, [])

	useEffect(() => {
		if (!activeProductId) return

		async function loadProductDetails() {
			try {
				setLoadingDetails(true)
				const [prices, recipe] = await Promise.all([
					getProductPriceHistory(activeProductId),
					getProductRecipeItems(activeProductId)
				])

				setPrices(prices)
				setRecipeItems(recipe)
			} catch (err) {
				setLoadError(err instanceof Error ? err.message : "Unkown error")
			} finally {
				setLoadingDetails(false)
			}
		}
		
		loadProductDetails()
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

			setProducts((prevProducts) => [...prevProducts, newProduct])
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
			setProducts((prevProducts) => prevProducts.map((product) => product.id === id ? updatedProduct: product))
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
			setRecipeItems((prevRecipeItems) => [...prevRecipeItems, newRecipeItem])
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
			setRecipeItems((prevRecipeItems) => prevRecipeItems.map((recipeItem) => recipeItem.id === recipeId ? updatedRecipeItem: recipeItem))
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

			setRecipeItems((prevRecipeItems) => prevRecipeItems.filter((recipeItem) => recipeItem.id !== id))
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : "Unknown error")
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
		prices,
		recipeItems,
		searchQuery,
		setSearchQuery,
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

import { useState, useEffect, useCallback } from 'react'
import type { ProductWithDetails, PriceHistory } from '../types'
import {useToast} from '../context/ToastContext'
import { priceHistoryCreateSchema, type PriceHistoryCreateData, type PriceHistoryErrors } from '../schemas/price_history'
import {useValidation} from './useValidation'
import {createPriceProduct, getProductPriceHistory} from '../api/products'

export const usePriceHistory = (
	activeProductId: string | null | undefined,
	setProducts: React.Dispatch<React.SetStateAction<ProductWithDetails[]>>
) => {
	const { showToast } = useToast()

	const [prices, setPrices] = useState<PriceHistory[]>([])

	const { errors , validate , clearErrors } = useValidation<PriceHistoryErrors>()

	const validatePrice = useCallback((data: PriceHistoryCreateData) => validate(priceHistoryCreateSchema, data), [validate])

	const [loadError, setLoadError] = useState<string | null>(null)
	const [loadingDetails, setLoadingDetails] = useState<boolean>(false)
	const [submitting, setSubmitting] = useState<boolean>(false)

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

	const handlePriceCreate = useCallback( async (productId: string, priceData: PriceHistoryCreateData): Promise<boolean> => {
		setSubmitting(true)

		const tempId = crypto.randomUUID()
		const optimisticPrice: PriceHistory = { ...priceData, product_id: productId, id: tempId }

		let previousLatestPrice: PriceHistory | null | undefined
		setProducts((prev) =>
			prev.map((p) => {
				if (p.id !== productId) return p
				previousLatestPrice = p.latest_price
				const hasNoPrice = !p.latest_price
				const isNewer = p.latest_price && new Date(optimisticPrice.valid_from) > new Date(p.latest_price.valid_from)
				if (hasNoPrice || isNewer) return { ...p, latest_price: optimisticPrice }
				return p
			})
		)
		setPrices((prev) => [optimisticPrice, ...prev ])

		try {
			const newPrice: PriceHistory = await createPriceProduct(productId, priceData)
			setPrices((prev) => prev.map((p) => (p.id === tempId ? newPrice : p)))
			setProducts((prev) =>
				prev.map((p) => {
					if (p.id !== productId) return p
					const hasNoPrice = !p.latest_price
					const isNewer = p.latest_price && new Date(newPrice.valid_from) > new Date(p.latest_price.valid_from)
					if (hasNoPrice || isNewer) return { ...p, latest_price: newPrice }
					return p
				})
			)
			showToast('Price created successfully', 'message')
			return true
		} catch (err) {
			setPrices((prev) => prev.filter((p) => p.id !== tempId))
			setProducts((prev) =>
				prev.map((p) => (p.id === productId ? { ...p, latest_price: previousLatestPrice ?? null } : p))
			)
			const message = err instanceof Error ? err.message : "Unknown error"
			showToast(`Failed to create price: ${message}`)
			return false
		} finally {
			setSubmitting(false)
		}
	}, [])

	return {
		prices,
		loadingDetails,
		loadError,
		validatePrice,
		handlePriceCreate,
		submitting,
		errors,
		clearErrors
	}
}

import {useCallback, useEffect, useMemo, useState} from "react"
import { deleteRestock, getRestocks, updateRestock } from '../api/restocks'
import type { CreateRestockPayload, Restock } from '../types'
import { restockCreateSchema, restockUpdateSchema, type RestockErrors } from '../schemas/restock'
import { createRestock } from "../api/restocks"
import {parseZodErrors} from "../utils/parseZodErrors"

export const useRestocks = () => {
	const [restocks, setRestocks] = useState<Restock[]>([])
	const [loading, setLoading] = useState<boolean>(false)
	const [submitting, setSubmitting] = useState<boolean>(false)
	const [searchQuery, setSearchQuery] = useState('')
	const [errors, setErrors ] = useState<RestockErrors>({})
	const [loadError, setLoadError] = useState<string | null>(null)
	const [submitError, setSubmitError] = useState<string | null>(null)

	useEffect(() => {
		async function loadRestocks() {
			try {
				setLoading(true)
				const data = await getRestocks()

				setRestocks(data)
			} catch (err) {
				setLoadError(err)
			} finally {
				setLoading(false)
			}
		}
		loadRestocks()
	}, [])

	const visibleRestocks = useMemo(() => {
		return restocks.filter(restock =>
				      restock.supplier?.toLowerCase().includes(searchQuery.toLowerCase()))
	}, [restocks, searchQuery])

	const handleRestockCreate = useCallback( async (restockData: CreateRestockPayload): Promise<boolean> => {
		const result = restockCreateSchema.safeParse(restockData)
		if (!result.success) {
			const newErrors = parseZodErrors<RestockErrors>(result.error)
			setErrors(newErrors)
			return false
		}
		setErrors({})		
		setSubmitting(true)
		setSubmitError(null)
		try {
			const newRestock: Restock = await createRestock(restockData)

			setRestocks((prevRestocks) => [...prevRestocks, newRestock])
			return true
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : "Unknown error")
			console.error("Failed to create restock :", err)
			return false
		} finally {
			setSubmitting(false)
		}
	}, [])

	
	const handleRestockDelete = async(id: string) => {
		setSubmitting(true)
		setSubmitError(null)
		try {
			await deleteRestock(id)

			setRestocks((prevRestocks) => prevRestocks.filter((restock) => restock.id !== id))
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : "Unknown error")
			console.error("Failed to delete restock :", err)
			return false
		} finally {
			setSubmitting(false)
		}
	}


	const handleRestockUpdate = useCallback( async (id: string, itemData: Partial<CreateRestockPayload>): Promise<boolean> => {
		const result = restockUpdateSchema.safeParse(itemData)
		if (!result.success) {
			const newErrors = parseZodErrors<RestockErrors>(result.error)
			setErrors(newErrors)
			return false
		}
		setErrors({})		
		setSubmitting(true)
		setSubmitError(null)
		try {
			const updatedRestock: Restock = await updateRestock(id, itemData)
			setRestocks((prevRestocks) => prevRestocks.map((restock) => restock.id === id ? updatedRestock: restock))
			return true
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : "Unknown error")
			console.error("Failed to update restock :", err)
			return false
		} finally {
			setSubmitting(false)
		}
	}, [])



	return {
		restocks,
		visibleRestocks,
		searchQuery,
		setSearchQuery,
		loading,
		submitting,
		handleRestockCreate,
		handleRestockDelete,
		handleRestockUpdate,
		errors,
		loadError,
		submitError
	}
}

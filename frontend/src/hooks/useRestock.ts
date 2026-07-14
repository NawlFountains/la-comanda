import {useCallback, useEffect, useState} from "react"
import { deleteRestock, getRestocks, updateRestock } from '../api/restocks'
import type { Restock } from '../types'
import { restockCreateSchema, restockUpdateSchema, type RestockCreateData, type RestockErrors, type RestockUpdateData } from '../schemas/restock'
import { createRestock } from "../api/restocks"
import {useToast} from "../context/ToastContext"
import {useValidation} from "./useValidation"

export const useRestocks = () => {
	const { showToast } = useToast()
	const { errors, validate, clearErrors } = useValidation<RestockErrors>()

	const validateRestock = useCallback((data: RestockCreateData) => validate(restockCreateSchema, data), [validate])
	const validateRestockUpdate = useCallback((data: RestockUpdateData) => validate(restockUpdateSchema, data), [validate])

	const [restocks, setRestocks] = useState<Restock[]>([])
	const [loading, setLoading] = useState<boolean>(false)
	const [submitting, setSubmitting] = useState<boolean>(false)

	const [searchSupplier, setSearchSupplier] = useState('')
	const [appliedSearchSupplier, setAppliedSearchSupplier] = useState<string | null>(null)

	const [loadError, setLoadError] = useState<string | null>(null)

	const [ page, setPage ] = useState<number>(1)
	const LIMIT = 20


	useEffect(() => {
		async function loadRestocks() {
			try {
				setLoading(true)
				const offset = (page - 1) * LIMIT

				const data = await getRestocks({limit: LIMIT, offset, supplier: appliedSearchSupplier})

				setRestocks(data)
			} catch (err) {
				setLoadError(err instanceof Error ? err.message : "Unkown error")
			} finally {
				setLoading(false)
			}
		}
		loadRestocks()
	}, [page, appliedSearchSupplier])

	const handleSearchSupplierChanged = (supplier: string | null) => {
		setAppliedSearchSupplier(supplier)
	}

	const handleRestockCreate = useCallback( async (restockData: RestockCreateData): Promise<boolean> => {
		setSubmitting(true)
		const tempId = crypto.randomUUID()
		const optimisticRestock: Restock = {
			... restockData, 
			id: tempId, 
			business_id: tempId,
			restock_items: restockData.restock_items.map((item) => ({
				...item,
				id: crypto.randomUUID(),
				restock_id: tempId
			})),
			notes: restockData.notes ?? ''
		}

		setRestocks((prevRestocks) => [...prevRestocks, optimisticRestock])

		try {
			const newRestock: Restock = await createRestock(restockData)

			setRestocks((prevRestocks) => prevRestocks.map((r) => (r.id === tempId ? newRestock : r )))
			showToast('Restock succesfuly created', 'message')
			return true
		} catch (err) {
			setRestocks((prevRestocks) => prevRestocks.filter((r) => (r.id !== tempId)))
			const message = err instanceof Error ? err.message : "Unknown error"
			showToast(`Failed to create restock: ${message}`)
			return false
		} finally {
			setSubmitting(false)
		}
	}, [])

	
	const handleRestockDelete = async(id: string) => {
		try {
			await deleteRestock(id)

			setRestocks((prevRestocks) => prevRestocks.filter((restock) => restock.id !== id))
			showToast(`Restock succesfuly deleted`, 'message')
		} catch (err) {
			const message = err instanceof Error ? err.message : "Unknown error"
			showToast(`Failed to delete restock: ${message}`)
			return false
		} finally {
			setSubmitting(false)
		}
	}


	const handleRestockUpdate = useCallback( async (id: string, restockData: RestockUpdateData): Promise<boolean> => {
		setSubmitting(true)
		let previousRestock: Restock | undefined
		setRestocks((prev) => {
			previousRestock = prev.find((r) => r.id === id)
			return prev.map((r) =>
				r.id === id ? { ...r, ...restockData} : r
			)
		})
		try {
			const updatedRestock: Restock = await updateRestock(id, restockData)
			setRestocks((prev) => prev.map((r) => (r.id === id ? updatedRestock : r)))
			showToast(`Restock succesfuly update`, 'message')
			return true
		} catch (err) {
			if (previousRestock) {
				setRestocks((prev) => prev.map((r) => (r.id === id ? previousRestock! : r)))
			}
			const message = err instanceof Error ? err.message : "Unknown error"
			showToast(`Failed to update restock: ${message}`)
			return false
		} finally {
			setSubmitting(false)
		}
	}, [])



	return {
		restocks,
		page,
		setPage,
		limit: LIMIT,
		searchSupplier,
		setSearchSupplier,
		setAppliedSearchSupplier: handleSearchSupplierChanged,
		loading,
		submitting,
		validateRestock,
		validateRestockUpdate,
		handleRestockCreate,
		handleRestockDelete,
		handleRestockUpdate,
		errors,
		loadError,
		clearErrors
	}
}

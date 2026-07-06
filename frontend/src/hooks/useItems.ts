import { useState, useEffect, useMemo, useCallback } from 'react'
import { deleteItem, getStock, updateItem } from '../api/items'
import type { Item, CreateItemPayload } from '../types'
import { createItem } from '../api/items'
import { itemCreateSchema, itemUpdateSchema, type ItemErrors } from '../schemas/item'
import {parseZodErrors} from '../utils/parseZodErrors'

export const useItems = () => {
	const [items, setItems] = useState<Item[]>([])
	const [searchQuery, setSearchQuery] = useState("")
	const [loading, setLoading] = useState<boolean>(false)
	const [submitting, setSubmitting] = useState<boolean>(false)
	const [errors, setErrors] = useState<ItemErrors>({})
	const [loadError, setLoadError] = useState<string | null>(null)
	const [submitError, setSubmitError] = useState<string | null>(null)

	useEffect(() => {
		async function loadItems() {
			try {
				setLoading(true)
				const data = await getStock()
				setItems(data)
			} catch (err) {
				setLoadError(err)
			} finally {
				setLoading(false)
			}
		}
		loadItems()
	}, [])

	const visibleItems = useMemo(() => {
		return items.filter(item =>
			item.name.toLowerCase().includes(searchQuery.toLowerCase())
		)
	}, [items, searchQuery])

	const handleItemCreate = useCallback( async (itemData: CreateItemPayload): Promise<boolean> => {
		const result = itemCreateSchema.safeParse(itemData)
		if (!result.success) {
			const newErrors = parseZodErrors<ItemErrors>(result.error)
			setErrors(newErrors)
			return false
		}
		setErrors({})		
		setSubmitting(true)
		setSubmitError(null)
		try {
			const newItem: Item= await createItem(itemData)

			setItems((prevItems) => [...prevItems, newItem])
			return true
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : "Unknown error")
			console.error("Failed to create item :", err)
			return false
		} finally {
			setSubmitting(false)
		}
	}, [])

	const handleItemDelete = async(id: string) => {
		setSubmitting(true)
		setSubmitError(null)
		try {
			await deleteItem(id)

			setItems((prevItems) => prevItems.filter((item) => item.id !== id))
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : "Unknown error")
			console.error("Failed to delete item :", err)
			return false
		} finally {
			setSubmitting(false)
		}
	}

	const handleItemUpdate = useCallback( async (id: string, itemData: Partial<CreateItemPayload>): Promise<boolean> => {
		const result = itemUpdateSchema.safeParse(itemData)
		if (!result.success) {
			const newErrors = parseZodErrors<ItemErrors>(result.error)	
			setErrors(newErrors)
			return false
		}
		setErrors({})		
		setSubmitting(true)
		setSubmitError(null)
		try {
			const updatedItem: Item= await updateItem(id, itemData)
			setItems((prevItems) => prevItems.map((item) => item.id === id ? updatedItem : item))
			return true
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : "Unknown error")
			console.error("Failed to update item :", err)
			return false
		} finally {
			setSubmitting(false)
		}
	}, [])

	return {
		items,
		visibleItems,
		handleItemCreate,
		handleItemDelete,
		handleItemUpdate,
		searchQuery,
		setSearchQuery,
		loading,
		submitting,
		errors,
		loadError,
		submitError
	}
}

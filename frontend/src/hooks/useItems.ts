import { useState, useEffect, useMemo, useCallback } from 'react'
import { deleteItem, getStock, updateItem } from '../api/items'
import type { Item, CreateItemPayload } from '../types'
import { createItem } from '../api/items'
import { itemCreateSchema, itemUpdateSchema } from '../schemas/item'

export const useItems = () => {
	const [items, setItems] = useState<Item[]>([])
	const [searchQuery, setSearchQuery] = useState("")
	const [loading, setLoading] = useState<boolean>(false)
	const [errors, setErrors] = useState<{ name?: string, unit?: string, current_stock?: string, low_stock_threshold?: string }>({})
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		async function loadItems() {
			try {
				setLoading(true)
				const data = await getStock()
				setItems(data)
			} catch (err) {
				setError(err)
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
			const newErrors: typeof errors = {}
			for (const issue of result.error.issues) {
				const field = issue.path[0] as keyof typeof newErrors
				if (!newErrors[field]) newErrors[field] = issue.message
			}
			setErrors(newErrors)
			return false
		}
		setErrors({})		
		setLoading(true)
		setError(null)
		try {
			const newItem: Item= await createItem(itemData)

			setItems((prevItems) => [...prevItems, newItem])
			return true
		} catch (err) {
			setError(err)
			console.error("Failed to create item:", err)
			return false
		} finally {
			setLoading(false)
		}
	}, [])

	const handleItemDelete = async(id: string) => {
		setLoading(true)
		setError(null)
		try {
			await deleteItem(id)

			setItems((prevItems) => prevItems.filter((item) => item.id !== id))
		} catch (err) {
			setError(err)
			console.error("Failed to create item:", err)
		} finally {
			setLoading(false)
		}
	}

	const handleItemUpdate = useCallback( async (id: string, itemData: Partial<CreateItemPayload>): Promise<boolean> => {
		const result = itemUpdateSchema.safeParse(itemData)
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
		setLoading(true)
		setError(null)
		try {
			const updatedItem: Item= await updateItem(id, itemData)
			setItems((prevItems) => prevItems.map((item) => item.id === id ? updatedItem : item))
			return true
		} catch (err) {
			setError(err)
			console.error("Failed to create item:", err)
			return false
		} finally {
			setLoading(false)
		}
	}, [])

	return {
		items: visibleItems,
		handleItemCreate,
		handleItemDelete,
		handleItemUpdate,
		searchQuery,
		setSearchQuery,
		loading,
		error,
		errors
	}
}

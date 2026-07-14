import { useState, useEffect, useMemo, useCallback } from 'react'
import { deleteItem, getStock, updateItem } from '../api/items'
import type { Item } from '../types'
import { createItem } from '../api/items'
import { itemCreateSchema, itemUpdateSchema, } from '../schemas/item'
import type { ItemCreateData, ItemErrors, ItemUpdateData } from '../schemas/item'
import {useToast} from '../context/ToastContext'
import {useValidation} from './useValidation'

export const useItems = () => {
	const { showToast} = useToast()
	const { errors, validate, clearErrors } = useValidation<ItemErrors>()

	const validateItem = useCallback((data: ItemCreateData) => validate(itemCreateSchema, data), [validate])
	const validateItemUpdate = useCallback((data: ItemUpdateData) => validate(itemUpdateSchema, data), [validate])

	const [items, setItems] = useState<Item[]>([])

	const [searchName, setSearchName] = useState("")
	const [appliedName, setAppliedName] = useState("")

	const [filterLowStock, setFilterLowStock] = useState<boolean>(false)

	const [loading, setLoading] = useState<boolean>(false)
	const [submitting, setSubmitting] = useState<boolean>(false)
	const [loadError, setLoadError] = useState<string | null>(null)

	useEffect(() => {
		async function loadItems() {
			try {
				setLoading(true)
				const data = await getStock()
				setItems(data)
			} catch (err) {
				setLoadError(err instanceof Error ? err.message : "Unkown error")
			} finally {
				setLoading(false)
			}
		}
		loadItems()
	}, [])

	const handleSearchNameChanged = (name: string | null) => {
		setAppliedName(name ? name : "")
	}

	const visibleItems = useMemo(() => {
		const filteredItems = filterLowStock
			? items.filter(item => Number(item.current_stock) < Number(item.low_stock_threshold))
			: items

		return filteredItems.filter(item =>
			item.name.toLowerCase().includes(appliedName.toLowerCase())
		)
	}, [items, filterLowStock, appliedName])

	const handleItemCreate = useCallback( async (itemData: ItemCreateData): Promise<boolean> => {
		setSubmitting(true)

		const tempId = crypto.randomUUID()
		const optimisticItem: Item = { ... itemData, id: tempId, business_id: tempId, notes: itemData.notes ?? ''}

		setItems((prevItems) => [...prevItems, optimisticItem])

		try {
			const newItem: Item= await createItem(itemData)

			setItems((prevItems) => 
				 prevItems.map((item) => (item.id === tempId ? newItem : item))
			)
			showToast("Item succesfully added", "message")
			return true
		} catch (err) {
			setItems((prevItems) => prevItems.filter((item) => item.id !== tempId))
			const message = err instanceof Error ? err.message : "Unknown error"
			showToast(`Failed to add item: ${message}`)
			return false
		} finally {
			setSubmitting(false)
		}
	}, [])

	const handleItemDelete = async(id: string) => {
		setSubmitting(true)
		try {
			await deleteItem(id)

			setItems((prevItems) => prevItems.filter((item) => item.id !== id))
			showToast("Item succesfully deleted", "message")
		} catch (err) {
			const message = err instanceof Error ? err.message : "Unknown error"
			showToast(`Failed to delete item: ${message}`)
			return false
		} finally {
			setSubmitting(false)
		}
	}

	const handleItemUpdate = useCallback( async (id: string, itemData: ItemUpdateData): Promise<boolean> => {
		setSubmitting(true)
		let previousItem: Item | undefined
		setItems((prev) => {
			previousItem = prev.find((i) => i.id === id)
			return prev.map((i) =>
				i.id === id ? { ...i, ...itemData} : i
			)
		})
		try {
			const updatedItem: Item= await updateItem(id, itemData)
			setItems((prev) => prev.map((i) => (i.id === id ? updatedItem : i)))
			showToast("Item succesfully updated", "message")
			return true
		} catch (err) {
			if (previousItem) {
				setItems((prev) => prev.map((i) => (i.id === id ? previousItem! : i)))
			}
			const message = err instanceof Error ? err.message : "Unknown error"
			showToast(`Failed to update item: ${message}`)
			return false
		} finally {
			setSubmitting(false)
		}
	}, [])

	return {
		items,
		visibleItems,
		validateItem,
		validateItemUpdate,
		handleItemCreate,
		handleItemDelete,
		handleItemUpdate,
		searchName,
		setSearchName,
		setAppliedSearchName: handleSearchNameChanged,
		filterLowStock,
		setFilterLowStock,
		loading,
		submitting,
		errors,
		loadError,
		clearErrors
	}
}

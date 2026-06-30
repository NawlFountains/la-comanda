import { useState, useEffect, useMemo, useCallback } from 'react'
import { deleteItem, getStock } from '../api/items'
import type { Item, CreateItemPayload } from '../types'
import { createItem } from '../api/items'

export const useItems = () => {
	const [items, setItems] = useState<Item[]>([])
	const [searchQuery, setSearchQuery] = useState("")
	const [loading, setLoading] = useState<boolean>(false)
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

	const handleItemCreate = useCallback( async (itemData: CreateItemPayload) => {
		setLoading(true)
		setError(null)
		try {
			const newItem: Item= await createItem(itemData)

			setItems((prevItems) => [...prevItems, newItem])
		} catch (err) {
			setError(err)
			console.error("Failed to create item:", err)
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

	const handleItemUpdate = async(id: string, updatedData: Partial<CreateItemPayload>) => {

	}

	return {
		items: visibleItems,
		handleItemCreate,
		handleItemDelete,
		handleItemUpdate,
		searchQuery,
		setSearchQuery,
		loading,
		error
	}
}

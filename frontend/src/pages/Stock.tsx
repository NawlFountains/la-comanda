import {useEffect, useState} from "react"
import ScreenLayout from "../layouts/ScreenLayout"
import type { Item } from "../types"
import { getStock } from "../api/items"
import EditableStockTable from "../components/EditableStockTable"
import {buttonVariants} from "../components/ButtonStyles"

export default function Stoc() {
	const [allItems, setAllItems] = useState<Item[]>([])
	const [searchQuery, setSearchQuery] = useState("")
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		async function loadItems() {
			try {
				setLoading(true)
				const data = await getStock()
				setAllItems(data)
			} catch (err) {
				setError(err)
			} finally {
				setLoading(false)
			}
		}
		loadItems()
	}, [])

	const visibleItems = allItems.filter(item =>
					     item.name.toLowerCase().includes(searchQuery.toLowerCase()))

	if (loading) return (<div className="text-center p-12">Loading items...</div>)
	if (error) return (<div className="text-center text-red-500">{error}</div>)

	return (
		<ScreenLayout>
			<div className="flex flex-col w-full gap-2 mt-2">

			{/* Search and creation tab */}
			<div className="flex flex-row sm:flex-row justify-between mx-2 gap-2">
				{/* Search filter */}
				<input
					placeholder="Search by item name"
					type="text"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="bg-neutral-300 px-3 w-full h-10 rounded-sm"/>	
				<button
					className={buttonVariants.secondary}>
				+ Add item
				</button>

			</div>

			{/* Items table */}
			<EditableStockTable items={visibleItems}/>
			</div>
		</ScreenLayout>
	)
}

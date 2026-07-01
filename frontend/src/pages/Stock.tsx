import ScreenLayout from "../layouts/ScreenLayout"
import EditableStockTable from "../components/EditableStockTable"
import { useItems } from "../hooks/useItems"
import {buttonVariants} from "../components/ButtonStyles"
import {useState} from "react"
import AddItemModal from "../components/AddItemModal"

export default function Stock() {
	const { items, searchQuery, setSearchQuery, handleItemCreate, handleItemDelete, handleItemUpdate, loading, error, errors } = useItems()
	const [showModal, setShowModal] = useState(false)

	if (loading) return (<div className="text-center p-12">Loading items...</div>)
	if (error) return (
		<div className="text-center text-red-500">
		{error}
		</div>
	)

	return (
		<ScreenLayout>
			<div className="flex flex-col w-full gap-2 mt-2">

			{/* Modals */}

			{showModal && (
				<AddItemModal 
					onClose={() => setShowModal(false)}
					onCreate={handleItemCreate}
					errors={errors}/>
			)}

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
					onClick={() => setShowModal(prev => !prev)}
					className={buttonVariants.secondary}>
				+ Add item
				</button>
			</div>

			{/* Items table */}
			<EditableStockTable 
				onEdit={handleItemUpdate}
				onDelete={handleItemDelete}
				items={items}
				errors={errors}/>
			</div>
		</ScreenLayout>
	)
}

import ScreenLayout from "../layouts/ScreenLayout"
import EditableStockTable from "../components/EditableStockTable"
import EditableStockRow from "../components/EditableStockRow"
import { useItems } from "../hooks/useItems"
import {buttonVariants} from "../components/ButtonStyles"
import {useState} from "react"
import AddItemModal from "../components/AddItemModal"
import EditableRestockTable from "../components/EditableRestockTable"
import EditableRestockRow from "../components/EditableRestockRow"
import {useRestocks} from "../hooks/useRestock"
import AddRestockModal from "../components/AddRestockModal"

export default function Stock() {
	const { 
		items, 
		visibleItems, 
		searchQuery: itemSearchQuery, 
		setSearchQuery: setItemSearchQuery, 
		handleItemCreate, 
		handleItemDelete, 
		handleItemUpdate, 
		loading: itemLoading, 
		submitting: itemSubmitting,
		error: itemError, 
		errors: itemErrors } = useItems()

	const { restocks, 
		visibleRestocks, 
		loading: restockLoading,
		submitting: restockSubmitting,
		searchQuery: restockSearchQuery,
		setSearchQuery: setRestockSearchQuery,
		handleRestockCreate, 
		handleRestockDelete, 
		handleRestockUpdate, 
		errors: restockErrors } = useRestocks()

	const [showAddItemModal, setShowAddItemModal] = useState(false)
	const [showAddRestockModal, setShowAddRestockModal] = useState(false)

	if (itemLoading || restockLoading) return (<div className="text-center p-12">Loading items and restocks...</div>)
	if (itemError) return (
		<div className="text-center text-red-500">
		{itemError}
		</div>
	)

	return (
		<ScreenLayout>
			<div className="flex flex-col w-full gap-8 mt-2">

				{/* Modals */}

				{showAddItemModal && (
					<AddItemModal 
						onClose={() => setShowAddItemModal(false)}
						onCreate={handleItemCreate}
						submitting={itemSubmitting}
						errors={itemErrors}/>
				)}

				{showAddRestockModal && (
					<AddRestockModal 
						onClose={() => setShowAddRestockModal(false)}
						onCreate={handleRestockCreate}
						items={items}
						submitting={restockSubmitting}
						errors={restockErrors}/>
				)}

				<div className="flex flex-col gap-3">
					{/* Search and creation tab */}
					<div className="flex flex-row justify-between mx-2 gap-2">
						{/* Search filter */}
						<input
							name="search-item"
							placeholder="Search by item name"
							type="text"
							value={itemSearchQuery}
							onChange={(e) => setItemSearchQuery(e.target.value)}
							className="bg-neutral-300 px-3 min-w-32 w-full h-10 rounded-sm"/>	
						<button
							onClick={() => setShowAddItemModal(true)}
							className={buttonVariants.secondary}>
						+ Add item
						</button>
					</div>

					{/* Items table */}
					<EditableStockTable>
						{visibleItems.map( item => (
							<EditableStockRow	
								onEdit={handleItemUpdate}
								onDelete={handleItemDelete}
								submitting={itemSubmitting}
								item={item}
								errors={itemErrors}/>
						))}
					</EditableStockTable>
				</div>

				<div className="flex flex-col gap-3">
					<div className="flex flex-row justify-between mx-2 gap-2">
						{/* Search filter */}
						<input
							name="search-supplier"
							placeholder="Search by supplier name"
							type="text"
							value={restockSearchQuery}
							onChange={(e) => setRestockSearchQuery(e.target.value)}
							className="bg-neutral-300 px-3 min-w-32 w-full h-10 rounded-sm"/>	
						<button
							onClick={() => setShowAddRestockModal(true)}
							className={buttonVariants.secondary}>
						+ Add Restock 
						</button>
					</div>



					{/* Restock table */}
					<EditableRestockTable >
						{visibleRestocks.map( restock => (
							<EditableRestockRow
								onEdit={handleRestockUpdate}
								onDelete={handleRestockDelete}
								submitting={restockSubmitting}
								items={items}
								restock={restock}
								errors={restockErrors}
								/>
						))}
					</EditableRestockTable>
				</div>
			</div>
		</ScreenLayout>
	)
}

import {useState} from "react"
import ScreenLayout from "../layouts/ScreenLayout"
import StockTable from "../components/items/StockTable"
import StockRow from "../components/items/StockRow"
import { useItems } from "../hooks/useItems"
import {buttonVariants} from "../components/styles/ButtonStyles"
import AddItemModal from "../components/items/AddItemModal"
import RestockTable from "../components/restocks/RestockTable"
import RestockRow from "../components/restocks/RestockRow"
import {useRestocks} from "../hooks/useRestock"
import AddRestockModal from "../components/restocks/AddRestockModal"
import EditItemModal from "../components/items/EditItemModal"
import ConfirmDeletionModal from "../components/ConfirmDeletionModal"
import EditRestockModal from "../components/restocks/EditRestockModal"
import TableSkeleton from "../components/skeletons/TableSkeleton"
import EmptyRow from "../components/EmptyRow"

type MultiActiveModal = 

  | { target: 'item'; mode: 'info' | 'edit' | 'delete'; itemId: string }
  | { target: 'restock'; mode: 'info' | 'edit' | 'delete'; restockId: string }
  | null;

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
		loadError: itemLoadError, 
		submitError: itemSubmitError,
		errors: itemErrors } = useItems()

	const { restocks, 
		visibleRestocks, 
		searchQuery: restockSearchQuery,
		setSearchQuery: setRestockSearchQuery,
		handleRestockCreate, 
		handleRestockDelete, 
		handleRestockUpdate, 
		loading: restockLoading,
		submitting: restockSubmitting,
		errors: restockErrors,
		loadError: restockLoadError, 
		submitError: restockSubmitError,

	} = useRestocks()

	const [ activeModal, setActiveModal ] = useState<MultiActiveModal>(null)

	const activeItem = activeModal?.target === 'item'
		? items.find(i => i.id === activeModal.itemId)
		: null

	const activeRestock = activeModal?.target === 'restock'
		? restocks.find(r => r.id === activeModal.restockId)
		: null

	const [showAddItemModal, setShowAddItemModal] = useState(false)
	const [showAddRestockModal, setShowAddRestockModal] = useState(false)

	if (itemLoading || restockLoading) return (
		<ScreenLayout> 
			<TableSkeleton cols={5} />
		</ScreenLayout>
	)

	if (itemLoadError || restockLoadError) return (
		<div className="text-center text-red-500">
		{itemLoadError ?? restockLoadError}
		</div>
	)

	return (
		<ScreenLayout>
			<div className="flex flex-col w-full gap-8 mt-2">

				

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
					<StockTable>
						{visibleItems.length > 0 ? (
							visibleItems.map((item, idx) => (
								<StockRow	
									key={idx}
									item={item}
									onTriggerEdit={() => setActiveModal({ target: 'item', mode: 'edit', itemId: item.id })}
									onTriggerDelete={() => setActiveModal({ target: 'item', mode: 'delete', itemId: item.id })}
									/>
							))
						): (
							<EmptyRow message={`No ${itemSearchQuery ? 'matching' : ''} items`} />
						)}
					</StockTable>
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
					<RestockTable >
						{visibleRestocks.length > 0 ? (
							visibleRestocks.map((restock, idx) => (
								<RestockRow
									key={idx}
									items={items}
									restock={restock}
									onTriggerEdit={() => setActiveModal({ target: 'restock', mode: 'edit', restockId: restock.id })}
									onTriggerDelete={() => setActiveModal({ target: 'restock', mode: 'delete', restockId: restock.id })}
									/>
							))
						): (
							<EmptyRow message={`No ${restockSearchQuery ? 'matching' : ''} restocks`} />
						)}
					</RestockTable>
				</div>

				{/* Item modals */}
				{showAddItemModal && (
					<AddItemModal 
						onClose={() => setShowAddItemModal(false)}
						onCreate={handleItemCreate}
						submitting={itemSubmitting}
						submitError={itemSubmitError}
						errors={itemErrors}/>
				)}

				{activeModal?.mode === 'edit' && activeItem && (
					<EditItemModal 
						onClose={() => setActiveModal(null)}
						onEdit={handleItemUpdate}
						submitting={itemSubmitting}
						errors={itemErrors}
						item={activeItem}
						submitError={itemSubmitError}
					/>
				)}

				{activeModal?.mode === 'delete' && activeItem && (
					<ConfirmDeletionModal
						name={activeItem.name}
						onClose={() => setActiveModal(null)}
						onConfirm={() => {
							handleItemDelete(activeItem.id)
							setActiveModal(null)
						}}	
						submitting={itemSubmitting}
						submitError={itemSubmitError}
						/>
				)}
				
				{/* Restock modals */}
				{showAddRestockModal && (
					<AddRestockModal 
						onClose={() => setShowAddRestockModal(false)}
						onCreate={handleRestockCreate}
						items={items}
						submitting={restockSubmitting}
						submitError={restockSubmitError}
						errors={restockErrors}/>
				)}

				{activeModal?.mode === 'edit' && activeRestock && (
					<EditRestockModal
						onClose={() => setActiveModal(null)}
						onEdit={handleRestockUpdate}
						submitting={restockSubmitting}
						submitError={restockSubmitError}
						errors={restockErrors}
						restock={activeRestock}
					/>
				)}

				{activeModal?.mode === 'delete' && activeRestock && (
					<ConfirmDeletionModal
						name={`Restock id: ${activeRestock.id}`}
						onClose={() => setActiveModal(null)}
						onConfirm={() => {
							handleRestockDelete(activeRestock.id)
							setActiveModal(null)
						}}	
						submitting={restockSubmitting}
						submitError={restockSubmitError}
						/>
				)}
			</div>
		</ScreenLayout>
	)
}

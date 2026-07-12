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
import ErrorLoading from "../components/errors/ErrorLoading"
import InputSearchFilter from "../components/InputSearchFilter"
import PaginationControlFooter from "../components/PaginationControlFooter"

type MultiActiveModal = 

  | { target: 'item'; mode: 'info' | 'edit' | 'delete'; itemId: string }
  | { target: 'restock'; mode: 'info' | 'edit' | 'delete'; restockId: string }
  | null;

export default function Stock() {
	const { 
		items, 
		visibleItems, 
		searchName: itemSearchName, 
		setSearchName: setItemSearchName, 
		setAppliedSearchName: setAppliedItemSearchName,
		handleItemCreate, 
		handleItemDelete, 
		handleItemUpdate, 
		filterLowStock,
		setFilterLowStock,
		loading: itemLoading, 
		submitting: itemSubmitting,
		loadError: itemLoadError, 
		submitError: itemSubmitError,
		errors: itemErrors } = useItems()

	const { restocks, 
		page,
		setPage,
		limit,
		searchSupplier: restockSearchSupplier,
		setSearchSupplier: setRestockSearchSupplier,
		setAppliedSearchSupplier,
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

	const [activeTab, setActiveTab] = useState<'stock'| 'restock'>('stock')


	if (itemLoadError) {
		return (
			<ErrorLoading message={itemLoadError} />
		)
	}
	if (restockLoadError) {
		return (
			<ErrorLoading message={restockLoadError} />
		)
	}

	return (
		<ScreenLayout>
			<div className="flex flex-col w-full gap-2 mt-2">

				{/* Toggle views */}
				<div className="flex flex-row px-2 gap-3 w-fit rounded-lg">
					<div className={`py-2 ${activeTab === 'stock' ? `border-b-2` : ''} border-neutral-800 dark:border-neutral-600 transition-all duration-50`}>
						<button
							aria-pressed={activeTab === 'stock'}
							role='tab'
							className={`${activeTab === 'stock' ? `${buttonVariants.toggleOn}` : buttonVariants.toggleOff}`}
							onClick={() => setActiveTab('stock')}>
							Stock
						</button>
					</div>
					<div className={`py-2 ${activeTab === 'restock' ? `border-b-2` : ''} border-neutral-800 dark:border-neutral-600 transition-all duration-50`}>
						<button
							aria-pressed={activeTab === 'restock'}
							role='tab'
							className={`${activeTab === 'restock'? buttonVariants.toggleOn : buttonVariants.toggleOff}`}
							onClick={() => setActiveTab('restock')}>
							Restock
						</button>
					</div>
				</div>

				{/* Stock tab */}
				{activeTab === 'stock' && (
					<div className="flex flex-col gap-3">

						{/* Search, filter and creation tab */}
						<div className="flex flex-col sm:flex-row justify-between mx-2 gap-2">
							{/* Search filter */}
							<InputSearchFilter 
								id="itemSearchName"
								placeholder="Search by item name"
								value={itemSearchName}
								onChange={(e) => setItemSearchName(e ?? "")}
								onApply={setAppliedItemSearchName}
							/>
							{/* Action Controls */}
							<div className="flex items-center justify-end w-full sm:w-auto gap-2">
								{/* Toggle Button */}
								<button
									onClick={() => setFilterLowStock(prev => !prev)}
									className={`${filterLowStock ? buttonVariants.toggleOn : buttonVariants.toggleOff} flex items-center gap-1.5`}
								>
									<span className={`transition-all duration-150 ${filterLowStock ? 'opacity-100 scale-100' : 'opacity-0 scale-0 w-0'}`}>
										✓
									</span>
									<span className="text-nowrap">Low Stock</span>
								</button>

								{/* Add Item Button */}
								<button
									onClick={() => setShowAddItemModal(true)}
									className={`${buttonVariants.secondary} flex items-center`}
								>
									+ Add item
								</button>
							</div>
						</div>

						{/* Items table */}
						{!itemLoading ? (
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
								<EmptyRow message={`No ${itemSearchName ? 'matching' : ''} items`} />
							)}
						</StockTable>
						) : (
							<TableSkeleton cols={5}/>
						)}
					</div>
				)}


				{/* Restock tab */}
				{activeTab === 'restock' && (
					<div className="flex flex-col gap-3">
						<div className="flex flex-row justify-between mx-2 gap-2">
							{/* Search filter */}
							<InputSearchFilter 
								id="searchSupplier"
								placeholder="Search by supplier name"
								value={restockSearchSupplier}
								onChange={(e) => setRestockSearchSupplier(e ?? "")}
								onApply={setAppliedSearchSupplier}
							/>
							<button
								onClick={() => setShowAddRestockModal(true)}
								className={buttonVariants.secondary}>
							+ Add Restock 
							</button>
						</div>



						{/* Restock table */}
						{!restockLoading ? (
							<RestockTable >
								{restocks.length > 0 ? (
									restocks.map((restock, idx) => (
										<RestockRow
											key={idx}
											items={items}
											restock={restock}
											onTriggerEdit={() => setActiveModal({ target: 'restock', mode: 'edit', restockId: restock.id })}
											onTriggerDelete={() => setActiveModal({ target: 'restock', mode: 'delete', restockId: restock.id })}
											/>
									))
								): (
									<EmptyRow message={`No ${restockSearchSupplier? 'matching' : ''} restocks`} />
								)}
								<PaginationControlFooter 
									loading={restockLoading}
									page={page}
									setPage={setPage}
									itemCount={restocks.length}
									limit={limit}
									
								/>
							</RestockTable>
						): (
							<TableSkeleton cols={5}/>
						)}
					</div>
				)}
				

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

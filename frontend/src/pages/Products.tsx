import ScreenLayout from "../layouts/ScreenLayout"
import ProductsTable from "../components/products/ProductsTable"
import ProductsRow from "../components/products/ProductsRow"
import {buttonVariants} from "../components/styles/ButtonStyles"
import {useState} from "react"
import { useProducts } from '../hooks/useProducts'
import AddProductModal from "../components/products/AddProductModal"
import EditProductModal from "../components/products/EditProductModal"
import ConfirmDeletionModal from "../components/ConfirmDeletionModal"
import InfoProductModal from "../components/products/InfoProductModal"
import {useItems} from "../hooks/useItems"
import type { ActiveModal } from "../types"
import TableSkeleton from "../components/skeletons/TableSkeleton"
import EmptyRow from "../components/EmptyRow"
import ErrorLoading from "../components/errors/ErrorLoading"

export default function Products() {
	const [ activeModal, setActiveModal] = useState<ActiveModal>(null)
	const { 
		products,
		visibleProducts,
		prices,
		searchQuery,
		setSearchQuery, 
		handleProductCreate,
		handleProductUpdate,
		handleProductDelete,
		handlePriceCreate,
		handleRecipeItemCreate,
		handleRecipeItemUpdate,
		handleRecipeItemDelete,
		loading,
		loadingDetails,
		submitting,
		errors, 
		priceErrors,
		recipeErrors,
		loadError,
		submitError
	} = useProducts(activeModal?.id) 

	const { items } = useItems()

	const activeProduct = products.find(p => p.id === activeModal?.id)
	const [ createProductModal, setCreateProductModal ] = useState(false)

	if (loadError) return (
		<ErrorLoading message={loadError} />
	)

	return (
		<ScreenLayout>
			<div className="flex flex-col w-full gap-2 mt-2">

			{/* Search and creation tab */}
			<div className="flex flex-row sm:flex-row justify-between mx-2 gap-2">
				{/* Search filter */}
				<input
					placeholder="Search product by name"
					type="text"
					value={searchQuery}
					id="searchQuery"
					onChange={(e) => setSearchQuery(e.target.value)}
					className="bg-neutral-300 px-3 w-full h-10 rounded-sm"/>	
				{/* Create product */}
				<button
					onClick={() => setCreateProductModal(true)}
					className={buttonVariants.secondary}>
				+ Add product 
				</button>
			</div>

			{/* Products table */}
			{!loading ? (
				<ProductsTable> 
					{visibleProducts.length > 0 ? (
						visibleProducts.map(product => 
							<ProductsRow
								key={product.id}
								onTriggerEdit={() => setActiveModal({ mode: "edit", id: product.id })}
								onTriggerInfo={() => setActiveModal({ mode: "info", id: product.id })}
								onTriggerDelete={() => setActiveModal({ mode: "delete", id: product.id })}
								product={product}
							/>
						)
					): (
						<EmptyRow message={`No ${searchQuery ? 'matching' : ''} products`} />
					)}
					
					
				</ProductsTable>
			) : (
				<TableSkeleton cols={4} />
			)}


			{/* Modals */}

			{createProductModal && (
				<AddProductModal 
					onClose={() => setCreateProductModal(false)}
					onCreate={handleProductCreate}
					submitting={submitting}
					errors={errors}
					submitError={submitError}
				/>
			)}

			{activeModal?.mode === "info" && activeProduct && (
				<InfoProductModal 
					onClose={() => setActiveModal(null)}
					loading={loadingDetails}
					product={activeProduct}
					prices={prices}
					items={items}
				/>
			)}

			{activeModal?.mode === "edit" && activeProduct && (
				<EditProductModal 
					onClose={() => setActiveModal(null)}
					onEdit={handleProductUpdate}
					onAddPrice={handlePriceCreate}
					onAddRecipeItem={handleRecipeItemCreate}
					onEditRecipeItem={handleRecipeItemUpdate}
					onDeleteRecipeItem={handleRecipeItemDelete}
					product={activeProduct}
					prices={prices}
					items={items}
					submitting={submitting}
					loading={loadingDetails}
					errors={errors}
					priceErrors={priceErrors}
					recipeErrors={recipeErrors}
					submitError={submitError}
				/>
			)}

			{activeModal?.mode === "delete" && activeProduct && (
				<ConfirmDeletionModal
					name={activeProduct.name}
					onClose={() => setActiveModal(null)}
					onConfirm={() => {
						handleProductDelete(activeProduct.id)
						setActiveModal(null)
					}}	
					submitting={submitting}
					submitError={submitError}
					/>
			)}
			</div>

		</ScreenLayout>
	)
}

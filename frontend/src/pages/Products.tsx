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
import InputSearchFilter from "../components/InputSearchFilter"
import { usePriceHistory } from "../hooks/usePriceHistory"
import { useRecipeItems } from "../hooks/useRecipeItems"

export default function Products() {
	const [ activeModal, setActiveModal] = useState<ActiveModal>(null)
	const productsData = useProducts()

	const { items } = useItems()

	const activeProduct = productsData.products.find(p => p.id === activeModal?.id)
	const priceData = usePriceHistory(activeProduct?.id, productsData.setProducts)
	const recipeItemData = useRecipeItems(productsData.setProducts)
	const [ createProductModal, setCreateProductModal ] = useState(false)

	if (productsData.loadError) return (
		<ErrorLoading message={productsData.loadError} />
	)

	return (
		<ScreenLayout>
			<div className="flex flex-col w-full gap-2 mt-2">

			{/* Search and creation tab */}
			<div className="flex flex-row sm:flex-row justify-between mx-2 gap-2">
				{/* Search filter */}
				<InputSearchFilter 
					id="searchSupplier"
					placeholder="Search products by name"
					value={productsData.searchName}
					onChange={(e) => productsData.setSearchName(e ?? "")}
					onApply={productsData.setAppliedSearchName}
				/>
				{/* Create product */}
				<button
					onClick={() => setCreateProductModal(true)}
					className={buttonVariants.secondary}>
				+ Add product 
				</button>
			</div>

			{/* Products table */}
			{!productsData.loading ? (
				<ProductsTable> 
					{productsData.visibleProducts.length > 0 ? (
						productsData.visibleProducts.map(product => 
							<ProductsRow
								key={product.id}
								onTriggerEdit={() => setActiveModal({ mode: "edit", id: product.id })}
								onTriggerInfo={() => setActiveModal({ mode: "info", id: product.id })}
								onTriggerDelete={() => setActiveModal({ mode: "delete", id: product.id })}
								product={product}
							/>
						)
					): (
						<EmptyRow message={`No ${productsData.searchName ? 'matching' : ''} products`} />
					)}
					
					
				</ProductsTable>
			) : (
				<TableSkeleton cols={4} />
			)}


			{/* Modals */}

			{createProductModal && (
				<AddProductModal 
					onClose={() => {
						productsData.clearErrors()
						setCreateProductModal(false)
					}}
					onCreate={productsData.handleProductCreate}
					validateProduct={productsData.validateProduct}
					submitting={productsData.submitting}
					errors={productsData.errors}
				/>
			)}

			{activeModal?.mode === "info" && activeProduct && (
				<InfoProductModal 
					onClose={() => setActiveModal(null)}
					loading={priceData.loadingDetails}
					product={activeProduct}
					prices={priceData.prices}
					items={items}
				/>
			)}

			{activeModal?.mode === "edit" && activeProduct && (
				<EditProductModal 
					onClose={() => {
						productsData.clearErrors()
						priceData.clearErrors()
						recipeItemData.clearErrors()
						setActiveModal(null)
					}}
					productsActions={{
						onEdit: productsData.handleProductUpdate,
						validateProductUpdate: productsData.validateProductUpdate,
						loading: productsData.loading,
						submitting: productsData.submitting,
						errors: productsData.errors,
					}}
					priceActions={{
						onAdd: priceData.handlePriceCreate,
						validatePrice: priceData.validatePrice,
						submitting: priceData.submitting,
						errors: priceData.errors
					}}
					recipeItemActions={{
						onAdd: recipeItemData.handleRecipeItemCreate,
						onEdit: recipeItemData.handleRecipeItemUpdate,
						onDelete: recipeItemData.handleRecipeItemDelete,
						validateRecipe: recipeItemData.validateRecipe,
						validateRecipeUpdate: recipeItemData.validateRecipeUpdate,
						submitting: recipeItemData.submitting,
						errors: recipeItemData.errors
					}}
					product={activeProduct}
					prices={priceData.prices}
					items={items}

				/>
			)}

			{activeModal?.mode === "delete" && activeProduct && (
				<ConfirmDeletionModal
					name={activeProduct.name}
					onClose={() => setActiveModal(null)}
					onConfirm={() => {
						productsData.handleProductDelete(activeProduct.id)
						setActiveModal(null)
					}}	
					submitting={productsData.submitting}
					/>
			)}
			</div>

		</ScreenLayout>
	)
}

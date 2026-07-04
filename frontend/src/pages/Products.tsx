import ScreenLayout from "../layouts/ScreenLayout"
import ProductsTable from "../components/ProductsTable"
import ProductsRow from "../components/ProductsRow"
import {buttonVariants} from "../components/ButtonStyles"
import {useState} from "react"
import { useProducts } from '../hooks/useProducts'
import AddProductModal from "../components/AddProductModal"
import EditProductModal from "../components/EditProductModal"
import ConfirmDeletionModal from "../components/ConfirmDeletionModal"
import InfoProductModal from "../components/InfoProductModal"
import {useItems} from "../hooks/useItems"
import type { ActiveModal } from "../types"

export default function Products() {
	const [ activeModal, setActiveModal] = useState<ActiveModal>(null)
	const { 
		products,
		visibleProducts,
		prices,
		recipeItems,
		searchQuery,
		setSearchQuery, 
		handleProductCreate,
		handleProductUpdate,
		handleProductDelete,
		loading,
		submitting,
		errors, 
		error } = useProducts(activeModal?.id) 

	const { items } = useItems()

	const activeProduct = products.find(p => p.id === activeModal?.id)
	const [ createProductModal, setCreateProductModal ] = useState(false)


	if (loading) return (<div className="text-center p-12">Loading products...</div>)
	if (error) return (
		<div className="text-center text-red-500">
		{error}
		</div>
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
			<ProductsTable> 
				{visibleProducts.map(product => 
					<ProductsRow
						key={product.id}
						onTriggerEdit={() => setActiveModal({ mode: "edit", id: product.id })}
						onTriggerInfo={() => setActiveModal({ mode: "info", id: product.id })}
						onTriggerDelete={() => setActiveModal({ mode: "delete", id: product.id })}
						product={product}
					/>
				)}
				
			</ProductsTable>


			{/* Modals */}

			{createProductModal && (
				<AddProductModal 
					onClose={() => setCreateProductModal(false)}
					onCreate={handleProductCreate}
					submitting={submitting}
					errors={errors}
				/>
			)}

			{activeModal?.mode === "info" && activeProduct && (
				<InfoProductModal 
					onClose={() => setActiveModal(null)}
					product={activeProduct}
					prices={prices}
					recipeItems={recipeItems}
					items={items}
				/>
			)}

			{activeModal?.mode === "edit" && activeProduct && (
				<EditProductModal 
					onClose={() => setActiveModal(null)}
					onEdit={handleProductUpdate}
					product={activeProduct}
					submitting={submitting}
					errors={errors}
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
					/>
			)}
			</div>

		</ScreenLayout>
	)
}

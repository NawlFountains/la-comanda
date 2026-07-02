import ScreenLayout from "../layouts/ScreenLayout"
import EditableProductsTable from "../components/EditableProductsTable"
import {buttonVariants} from "../components/ButtonStyles"
import {useState} from "react"
import { useProducts } from '../hooks/useProducts'

export default function Products() {
	const { products, searchQuery, setSearchQuery, loading, errors, error } = useProducts() 
	const [ showModal, setShowModal ] = useState(false)

	if (loading) return (<div className="text-center p-12">Loading products...</div>)
	if (error) return (
		<div className="text-center text-red-500">
		{error}
		</div>
	)

	return (
		<ScreenLayout>
			<div className="flex flex-col w-full gap-2 mt-2">

			{/* Modals */}

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
					onClick={() => setShowModal(prev => !prev)}
					className={buttonVariants.secondary}>
				+ Add product 
				</button>
			</div>

			{/* Products table */}
			<EditableProductsTable 
				products={products}
				/>
			</div>
		</ScreenLayout>
	)
}

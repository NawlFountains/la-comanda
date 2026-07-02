import React, {useState} from 'react'
import { PenIcon, TrashIcon } from '../components/Icons'
import type { Product } from '../types'
import {cardVariants} from './CardStyles'
import ConfirmDeletionModal from './ConfirmDeletionModal'

interface EditableProductsTableProps {
	products: Product[]
}

export default function EditableProductsTable({ products }: EditableProductsTableProps) {

	if (products.length == 0) return (<div> No products </div>)


	return (
	<div className={`${cardVariants.table} sm:mx-2`}>
		<div className="flex flex-col divide-y divide-neutral-300 rounded-b-xl">

			{/* Header */}
			<div className="bg-neutral-200 grid grid-cols-3 sm:grid-cols-5 p-2 font-mono">
				<p className='hidden sm:block'>Product_ID</p>
				<p>Name</p>
				<p>Price</p>
				<p className='hidden sm:block'>Recipe items</p>
				<p>Actions</p>
			</div>

			{/* Table body */}
			{products.map(product => (
				<ProductsRow 
					key={product.id}
					product={product}
				/>
				
			))}
		</div>
	</div>
	)
}

interface ProductsRowProps {
	product: Product
}

function ProductsRow({ product }: ProductsRowProps) {
	const [showDeleteMenu, setShowDeleteMenu] = useState<boolean>(false)
	const [showEditMenu, setShowEditMenu] = useState<boolean>(false)
	return (
		<div 
			key={product.id} 
			className="grid grid-cols-3 sm:grid-cols-5 p-2 gap-4">
			<p className="font-mono hidden sm:block">{product.id}</p>
			<p>{product.name}</p>
			<p>PLACEHOLDER_PRICE</p>
			<p className="hidden sm:block">Item 1, Item 2</p>
			<div className='space-x-3'>
				<button
					onClick={() => setShowEditMenu(true)}
					title="Edit product"
					className='cursor-pointer hover:scale-110'>
					<PenIcon className='w-6 h-6' />
				</button>
				<button
					onClick={() => setShowDeleteMenu(true)}
					title="Delete product"
					className='cursor-pointer text-red-500 hover:scale-110'>
					<TrashIcon className='w-6 h-6' />
				</button>

				{/* Modals */}

				{showDeleteMenu && (
					<ConfirmDeletionModal
						name={product.name}
						onClose={() => setShowDeleteMenu(false)}
						onConfirm={() => {
							// onDelete(item.id)
							setShowDeleteMenu(false)
						}}	
						/>
				)}
			</div>
		</div>
	)
}

import React, {useState} from 'react'
import ConfirmDeletionModal from './ConfirmDeletionModal'
import { PenIcon, TrashIcon } from '../components/Icons'
import type { CreateProductPayload, Product } from '../types'
import type {ProductErrors} from '../schemas/product'
import EditProductModal from './EditProductModal'

interface EditableProductsRowProps {
	onEdit: (id: string, data: Partial<CreateProductPayload>) => Promise<boolean>
	onDelete: (id: string) => void,
	product: Product
	submitting: boolean
	errors: ProductErrors 
}

export default function EditableProductsRow({ onEdit, onDelete, product, submitting, errors }: EditableProductsRowProps) {
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

				{showEditMenu && (
					<EditProductModal 
						onClose={() => setShowEditMenu(false)}
						onEdit={onEdit}
						product={product}
						submitting={submitting}
						errors={errors}
					/>
				)}

				{showDeleteMenu && (
					<ConfirmDeletionModal
						name={product.name}
						onClose={() => setShowDeleteMenu(false)}
						onConfirm={() => {
							onDelete(product.id)
							setShowDeleteMenu(false)
						}}	
						submitting={submitting}
						/>
				)}
			</div>
		</div>
	)
}

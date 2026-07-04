import React, {useState} from 'react'
import { PenIcon, TrashIcon } from '../components/Icons'
import type { CreateItemPayload, Item } from '../types'
import ConfirmDeletionModal from './ConfirmDeletionModal'
import EditItemModal from './EditItemModal'
import type {ItemErrors} from '../schemas/item'

interface EditableStockRowProps {
	item: Item
	onEdit: (id: string, updateData: Partial<CreateItemPayload>) => Promise<boolean>
	onDelete: (id: string) => void
	submitting: boolean
	errors: ItemErrors
}

export default function EditableStockRow({ item, onEdit, onDelete, submitting, errors }: EditableStockRowProps) {
	const [showDeleteMenu, setShowDeleteMenu] = useState<boolean>(false)
	const [showEditMenu, setShowEditMenu] = useState<boolean>(false)
	return (
		<div 
			key={item.id} 
			className="grid grid-cols-3 sm:grid-cols-5 p-2">
			<p className="font-mono hidden sm:block">{item.id}</p>
			<p>{item.name}</p>
			<p>{item.current_stock} <span className='font-medium'>{item.unit}</span></p>
			<p className='hidden sm:block'>{item.low_stock_threshold} <span className='font-medium'>{item.unit}</span></p>
			<div className='space-x-3'>
				<button
					onClick={() => setShowEditMenu(true)}
					title="Edit item"
					className='cursor-pointer hover:scale-110'>
					<PenIcon className='w-6 h-6' />
				</button>
				<button
					onClick={() => setShowDeleteMenu(true)}
					title="Delete item"
					className='cursor-pointer text-red-500 hover:scale-110'>
					<TrashIcon className='w-6 h-6' />
				</button>

				{/* Modals */}

				{showEditMenu && (
					<EditItemModal 
						onClose={() => setShowEditMenu(false)}
						onEdit={onEdit}
						submitting={submitting}
						errors={errors}
						item={item}
					/>
				)}

				{showDeleteMenu && (
					<ConfirmDeletionModal
						name={item.name}
						onClose={() => setShowDeleteMenu(false)}
						onConfirm={() => {
							onDelete(item.id)
							setShowDeleteMenu(false)
						}}	
						submitting={submitting}
						/>
				)}
			</div>
		</div>
	)
}

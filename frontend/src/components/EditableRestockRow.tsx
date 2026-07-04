import React, { useState, useMemo } from 'react'
import { PenIcon, TrashIcon } from '../components/Icons'
import type { Item } from '../types'
import type { CreateRestockPayload } from '../types'
import ConfirmDeletionModal from './ConfirmDeletionModal'
import EditRestockModal from './EditRestockModal'
import type { Restock } from '../types'
import type { RestockErrors } from '../schemas/restock'
import {formatDate} from '../utils/date'


interface EditableRestockRowProps {
	items: Item[],
	restock: Restock,
	onEdit: (id: string, updateData: Partial<CreateRestockPayload>) => Promise<boolean>,
	onDelete: (id: string) => void,
	submitting: boolean
	errors: RestockErrors 
}

export default function EditableRestockRow({ items, restock, onEdit, onDelete, submitting, errors }: EditableRestockRowProps) {
	const [showDeleteMenu, setShowDeleteMenu] = useState<boolean>(false)
	const [showEditMenu, setShowEditMenu] = useState<boolean>(false)

	const itemById = useMemo(() => {
		return Object.fromEntries(items.map(item => [item.id, item]))
	}, [items])

	return (
		<div 
			key={restock.id} 
			className="grid grid-cols-3 sm:grid-cols-5 p-2">
			<p className="font-mono hidden sm:block">{restock.id}</p>
			<p>{restock.supplier}</p>
			<p className='hidden sm:block'>
			{restock.restock_items.map((ri, idx) => {
				const item = itemById[ri.item_id]
				return (
					<span key={idx}>{item.name} {ri.quantity} <span className='font-medium'>{item.unit}</span>{idx < restock.restock_items.length - 1 ? ',' : ''} </span>
				)
			})}
			</p>
			<p>{formatDate(restock.restock_date)}</p>
			<div className='space-x-3'>
				<button
					onClick={() => setShowEditMenu(true)}
					title="Edit restock"
					className='cursor-pointer hover:scale-110'>
					<PenIcon className='w-6 h-6' />
				</button>
				<button
					onClick={() => setShowDeleteMenu(true)}
					title="Delete restock"
					className='cursor-pointer text-red-500 hover:scale-110'>
					<TrashIcon className='w-6 h-6' />
				</button>

				{/* Modals */}

				{showEditMenu && (
					<EditRestockModal 
						onClose={() => setShowEditMenu(false)}
						onEdit={onEdit}
						restock={restock}
						submitting={submitting}
						errors={errors}/>
				)}

				{showDeleteMenu && (
					<ConfirmDeletionModal
						name={`restock with id : ${restock.id}`}
						onClose={() => setShowDeleteMenu(false)}
						onConfirm={() => {
							onDelete(restock.id)
							setShowDeleteMenu(false)}
						}
						submitting={submitting}
						/>
				)}

			</div>
		</div>
	)
}

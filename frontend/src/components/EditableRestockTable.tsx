import React, { useState, useMemo } from 'react'
import { PenIcon, TrashIcon } from '../components/Icons'
import type { Item } from '../types'
import type { CreateRestockPayload } from '../types'
import {cardVariants} from './CardStyles'
import ConfirmDeletionModal from './ConfirmDeletionModal'
import EditRestockModal from './EditRestockModal'
import type { Restock } from '../types'
import type { RestockErrors } from '../schemas/restock'
import {formatDate} from '../utils/date'

interface EditableRestockTableProps {
	items: Item[],
	restocks: Restock[],
	onEdit: (id: string, updateData: Partial<CreateRestockPayload>) => Promise<boolean>,
	onDelete: (id: string) => void,
	submitting: boolean
	errors: RestockErrors 
}

export default function EditableRestockTable({ items, restocks, onEdit, onDelete, submitting, errors}: EditableRestockTableProps) {

	if (restocks.length == 0) return (<div> No restocks </div>)


	return (
	<div className={`${cardVariants.table} sm:mx-2`}>
		<div className="flex flex-col divide-y divide-neutral-300 rounded-b-xl">

			{/* Header */}
			<div className="bg-neutral-200 grid grid-cols-3 sm:grid-cols-5 p-2 font-mono">
				<p className='hidden sm:block'>Restock_ID</p>
				<p>Supplier</p>
				<p className='hidden sm:block'>Items</p>
				<p>Date</p>
				<p>Actions</p>
			</div>

			{/* Table body */}
			{restocks.map(restock => (
				<RestockRow 
					key={restock.id}
					items={items}
					restock={restock}
					onEdit={onEdit}
					onDelete={onDelete}
					submitting={submitting}
					errors={errors}
				/>
				
			))}
		</div>
	</div>
	)
}

interface RestockRowProps {
	items: EditableRestockTableProps['items'],
	restock: Restock,
	onEdit: EditableRestockTableProps['onEdit']
	onDelete: EditableRestockTableProps['onDelete']
	submitting: EditableRestockTableProps['submitting']
	errors: EditableRestockTableProps['errors']
}

function RestockRow({ items, restock, onEdit, onDelete, submitting, errors }: RestockRowProps) {
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

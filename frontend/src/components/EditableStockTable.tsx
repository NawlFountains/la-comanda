import {useState} from 'react'
import { PenIcon, TrashIcon } from '../components/Icons'
import type { CreateItemPayload, Item } from '../types'
import {cardVariants} from './CardStyles'
import ConfirmDeletionModal from './ConfirmDeletionModal'

interface EditableStockTableProps {
	items: Item[],
	onEdit: (id: string, updateData: Partial<CreateItemPayload>) => void,
	onDelete: (id: string) => void,
}

export default function EditableStockTable({ items, onEdit, onDelete }: EditableStockTableProps) {

	if (items.length == 0) return (<div> No stock </div>)


	return (
	<div className={`${cardVariants.table} sm:mx-2`}>
		<div className="flex flex-col divide-y divide-neutral-300 rounded-b-xl">

			{/* Header */}
			<div className="bg-neutral-200 grid grid-cols-3 sm:grid-cols-5 p-2 font-mono">
				<p className='hidden sm:block'>Item_ID</p>
				<p>Name</p>
				<p>Current stock</p>
				<p className='hidden sm:block'>Low stock threshold</p>
				<p>Actions</p>
			</div>

			{/* Table body */}
			{items.map(item => (
				<StockRow 
					key={item.id}
					item={item}
					onEdit={onEdit}
					onDelete={onDelete}
				/>
				
			))}
		</div>
	</div>
	)
}

interface StockRowProps {
	item: Item,
	onEdit: EditableStockTableProps['onEdit']
	onDelete: EditableStockTableProps['onDelete']
}

function StockRow({ item, onEdit, onDelete }: StockRowProps) {
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

				{showDeleteMenu && (
					<ConfirmDeletionModal
						name={item.name}
						onClose={() => setShowDeleteMenu(false)}
						onConfirm={() => {
							onDelete(item.id)
							setShowDeleteMenu(false)
						}}	
						/>
				)}
			</div>
		</div>
	)
}

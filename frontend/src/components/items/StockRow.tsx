import { PenIcon, TrashIcon } from '../styles/Icons'
import type { Item } from '../../types'

interface StockRowProps {
	item: Item
	onTriggerEdit: () => void
	onTriggerDelete: () => void
}

export default function StockRow({ item, onTriggerEdit, onTriggerDelete }: StockRowProps) {
	return (
		<div 
			key={item.id} 
			className="grid grid-cols-3 sm:grid-cols-4 p-2">
			<p>{item.name}</p>
			<p>{item.current_stock} <span className='font-medium'>{item.unit}</span></p>
			<p className='hidden sm:block'>{item.low_stock_threshold} <span className='font-medium'>{item.unit}</span></p>
			<div className='space-x-3'>
				<button
					onClick={onTriggerEdit}
					title="Edit item"
					className='cursor-pointer hover:scale-110'>
					<PenIcon className='w-6 h-6' />
				</button>
				<button
					onClick={onTriggerDelete}
					title="Delete item"
					className='cursor-pointer text-red-500 hover:scale-110'>
					<TrashIcon className='w-6 h-6' />
				</button>
			</div>
		</div>
	)
}

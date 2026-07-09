import { useMemo } from 'react'
import { PenIcon, TrashIcon } from '../styles/Icons'
import type { Item, Restock } from '../../types'
import {formatDate} from '../../utils/date'


interface RestockRowProps {
	items: Item[],
	restock: Restock,
	onTriggerEdit: () => void,
	onTriggerDelete: () => void,
}

export default function RestockRow({ items, restock, onTriggerEdit, onTriggerDelete }: RestockRowProps) {

	const itemById = useMemo(() => {
		return Object.fromEntries(items.map(item => [item.id, item]))
	}, [items])

	return (
		<div 
			key={restock.id} 
			className="grid grid-cols-3 sm:grid-cols-5 p-2">
			<p className="font-mono hidden sm:block">#{restock.id.slice(0, 6).toUpperCase()}</p>
			<p>{restock.supplier}</p>
			<p className='hidden sm:block'>
			{restock.restock_items.length > 0 ? (
				restock.restock_items.map((ri, idx) => {
					const item = itemById[ri.item_id]
					return (
						<span key={idx}>{item?.name} {ri.quantity} <span className='font-medium'>{item.unit}</span>{idx < restock.restock_items.length - 1 ? ',' : ''} </span>
					)
				})
			): (
				<span>-</span>
			)}
			</p>
			<p>{formatDate(restock.restock_date)}</p>
			<div className='space-x-3'>
				<button
					onClick={onTriggerEdit}
					title="Edit restock"
					className='cursor-pointer hover:scale-110'>
					<PenIcon className='w-6 h-6' />
				</button>
				<button
					onClick={onTriggerDelete}
					title="Delete restock"
					className='cursor-pointer text-red-500 hover:scale-110'>
					<TrashIcon className='w-6 h-6' />
				</button>
			</div>
		</div>
	)
}

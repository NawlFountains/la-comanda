import type { Item } from '../../types'
import {cardVariants} from '../styles/CardStyles'
import EmptyRow from '../EmptyRow'

interface LowStockItemsCardProps {
	items: Item[]
}

export default function LowStockItemsCard({ items } : LowStockItemsCardProps) {	
	return (
		<div className={cardVariants.tableBody}>
			<h1 className="text-xl p-6"> Items currently running low on stock </h1>
			<div className="flex flex-col divide-y divide-neutral-300 dark:divide-neutral-600 rounded-b-xl">
				<div className="bg-neutral-200 dark:bg-neutral-900 grid grid-cols-3 p-1 font-mono">
						<p>Name</p>
						<p>Current stock</p>
						<p>Low stock threshold</p>
				</div>
				{items.length > 0 ? (
					items.map(item => (
						<div 
							key={item.id} 
							className='grid grid-cols-3 p-1'>
							<p>{item.name}</p>
							<p>{item.current_stock} {item.unit}</p>
							<p>{item.low_stock_threshold} {item.unit}</p>
						</div>
					))
				): (
					<EmptyRow message='No items running low' />
				)}
			</div>
		</div>
	)
}

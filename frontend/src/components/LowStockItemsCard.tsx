import type { Item } from '../types'

interface LowStockItemsCardProps {
	items: Item[]
}

export default function LowStockItemsCard({ items } : LowStockItemsCardProps) {	
	if (items.length == 0) return (<div>No items running low</div>)

	return (
		<div className="bg-neutral-100 text-center flex flex-col shadow-lg border border-neutral-300 rounded-xl overflow-hidden">
			<h1 className="text-xl p-6"> Items currently running low on stock </h1>
			<div className="flex flex-col divide-y divide-neutral-300 rounded-b-xl">
				<div className="bg-neutral-200 grid grid-cols-3 p-1 font-mono">
						<p>Name</p>
						<p>Current stock</p>
						<p>Low stock threshold</p>
				</div>
				{items.map(item => (
					<div 
						key={item.id} 
						className='grid grid-cols-3 p-1'>
						<p>{item.name}</p>
						<p>{item.current_stock} {item.unit}</p>
						<p>{item.low_stock_threshold} {item.unit}</p>
					</div>
				))}
			</div>
		</div>
	)
}

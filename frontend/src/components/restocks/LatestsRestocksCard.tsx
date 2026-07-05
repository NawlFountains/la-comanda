import React, {useMemo} from 'react'
import type { Restock, Item } from '../../types'
import {cardVariants} from '../styles/CardStyles'
import { formatDate } from '../../utils/date'

interface LatestRestockCardProps {
	restocks: Restock[]
	items: Item[]
}

export default function LatestRestockCard({ restocks, items }: LatestRestockCardProps) {
	const itemById = useMemo(() => {
		return Object.fromEntries(items.map(item => [item.id, item]))
	}, [items])

	if (restocks.length === 0) return (<div>No restocks </div>)


	return (
		<div className={cardVariants.table}>
			<h1 className="text-xl p-6"> Latest restocks</h1>
			<div className="flex flex-col divide-y divide-neutral-300 rounded-b-xl">
				<div className="bg-neutral-200 grid grid-cols-3 p-1 font-mono">
						<p>Date</p>
						<p>Supplier</p>
						<p>Restock items</p>
				</div>
				{restocks.map(restock => (
					<div 
						key={restock.id} 
						className="grid grid-cols-3 p-1">
						<p>{formatDate(restock.restock_date)}</p>
						<p>{restock.supplier}</p>
						<p>
						{restock.restock_items.map((ri, idx) => {
							const item = itemById[ri.item_id]
							return (
								<span key={idx}>{item.name} {ri.quantity} {item.unit}{idx < restock.restock_items.length - 1 ? ',' : ''} </span>
							)
						})}
						</p>
					</div>
				))}
			</div>
		</div>
	)
}

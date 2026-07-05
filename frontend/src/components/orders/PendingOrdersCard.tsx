import { useMemo } from 'react'
import type { Order, Customer } from '../../types'
import {cardVariants} from '../styles/CardStyles'
import { formatDatetime } from '../../utils/date'
import EmptyRow from '../EmptyRow'

interface PendingOrdersCardProps {
	orders: Order[]
	customers: Customer[]
}

export default function PendingOrdersCard({ orders, customers }: PendingOrdersCardProps) {
	const customerById = useMemo(() => {
		return Object.fromEntries(customers.map(customer => [customer.id, customer]))
	}, [customers])

	return (
		<div className={cardVariants.table}>
			<h1 className="text-xl p-6"> Pending orders </h1>
			<div className="flex flex-col divide-y divide-neutral-300 rounded-b-xl">
				<div className="bg-neutral-200 grid grid-cols-3 p-1 font-mono">
						<p>Order_ID</p>
						<p>Customer name</p>
						<p>Created at</p>
				</div>
				{orders.length > 0 ? (
					orders.map(order => (
						<div 
							key={order.id} 
							className="grid grid-cols-3 p-1">
							<p className="font-mono">{order.id}</p>
							<p>{customerById[order.customer_id]?.name}</p>
							<p>{formatDatetime(order.created_at)}</p>
						</div>
					))
				): (
					<EmptyRow message='No pending orders' />
				)}
			</div>
		</div>
	)
}

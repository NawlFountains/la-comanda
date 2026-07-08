import { useMemo } from 'react'
import type { Order, Customer } from '../../types'
import {cardVariants} from '../styles/CardStyles'
import { formatDatetime } from '../../utils/date'
import EmptyRow from '../EmptyRow'
import {Link} from 'react-router-dom'

interface PendingOrdersCardProps {
	orders: Order[]
	customers: Customer[]
	route?: string 
}

export default function PendingOrdersCard({ orders, customers, route }: PendingOrdersCardProps) {
	const customerById = useMemo(() => {
		return Object.fromEntries(customers.map(customer => [customer.id, customer]))
	}, [customers])

	return (
		<div className={cardVariants.table}>
			<div className='flex flex-col gap-2 p-4'>
				<h1 className="text-xl "> Currently pending orders</h1>
			</div>
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
			{route && (
				<div className="p-3 bg-neutral-50 text-center border-t border-neutral-300 rounded-b-xl">
					<Link 
						to={route} 
						className="text-sm font-medium text-neutral-600 hover:text-neutral-900 underline transition-colors"
					>
						More pending orders, check stock page →
					</Link>
				</div>
			)}
		</div>
	)
}

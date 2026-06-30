import { PenIcon, TrashIcon } from '../components/Icons'
import type { Order } from '../types'
import {cardVariants} from './CardStyles'

interface EditableOrdersTableProps {
	orders: Order[]
}

export default function EditableOrdersTable({ orders }: EditableOrdersTableProps) {
	if (orders.length == 0) return (<div> No orders </div>)

	return (
	<div className={`${cardVariants.table} sm:mx-2`}>
		<div className="flex flex-col divide-y divide-neutral-300 rounded-b-xl">
			<div className="bg-neutral-200 grid grid-cols-5 p-1 font-mono">
				<p>Order_ID</p>
				<p>Customer_ID</p>
				<p>Status</p>
				<p>Created at</p>
				<p>Actions</p>
			</div>
			{orders.map(order => (
				<div 
					key={order.id} 
					className="grid grid-cols-5 p-1">
					<p className="font-mono">{order.id}</p>
					<p>{order.customer_id}</p>
					<p className={`font-mono ${order.status === 'cancelled' ? 'text-red-500' : '' }`}>{order.status}</p>
					<p>{new Date(order.created_at).toLocaleString()}</p>
					<div className='space-x-3'>
						<button
							title="Edit order"
							className='cursor-pointer hover:scale-110'>
							<PenIcon className='w-6 h-6' />
						</button>
						<button
							title="Delete order"

							className='cursor-pointer text-red-500 hover:scale-110'>
							<TrashIcon className='w-6 h-6' />
						</button>
					</div>
				</div>
			))}
		</div>
	</div>
	)
}

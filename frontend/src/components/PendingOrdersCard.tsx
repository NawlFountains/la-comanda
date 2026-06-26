import type { Order } from '../types'

interface PendingOrdersCardProps {
	orders: Order[]
}

export default function PendingOrdersCard({ orders }: PendingOrdersCardProps) {
	if (orders.length === 0) return (<div>No pending orders</div>)

	return (
		<div className="bg-neutral-100 text-center flex flex-col shadow-lg border border-neutral-300 rounded-xl">
			<h1 className="text-xl p-6"> Pending orders </h1>
			<div className="flex flex-col divide-y divide-neutral-300 rounded-b-xl">
				<div className="bg-neutral-200 grid grid-cols-3 p-1 font-mono">
						<p>Order_ID</p>
						<p>Customer_ID</p>
						<p>Created at</p>
				</div>
				{orders.map(order => (
					<div 
						key={order.id} 
						className="grid grid-cols-3 p-1">
						<p className="font-mono">{order.id}</p>
						<p>{order.customer_id}</p>
						<p>{new Date(order.created_at).toLocaleString()}</p>
					</div>
				))}
			</div>
		</div>
	)
}

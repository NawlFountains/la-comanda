import {useEffect, useState} from "react";
import type { Order } from '../types'
import ErrorMessage from '../components/ErrorMessage'
import { getPendingOrders } from "../api/orders";

export default function PendingOrdersCard() {
	const [orders, setOrders] = useState<Order[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		async function loadItems() {
			// TODO change backend to retrive customer names and avoid doing it here
			try {
				setLoading(true)
				const data = await getPendingOrders()
				setOrders(data)
			} catch (err) {
				setError('Failed to load orders')
			} finally {
				setLoading(false)
			}
		}
		loadItems()
	}, [])

	if (loading) return (<div>Fetching orders...</div>)
	if (error) return (<ErrorMessage message={error} /> )
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

import ScreenLayout from "../layouts/ScreenLayout"
import LowStockItemsCard from "../components/LowStockItemsCard"
import PendingOrdersCard from "../components/PendingOrdersCard"
import { useState, useEffect } from "react"
import type { Order, Item } from "../types"
import { getOrderByStatus } from "../api/orders"
import {getLowStockItems} from "../api/items"
import {buttonVariants} from "../components/ButtonStyles"

export default function Dashboard() {
	const [orders, setOrders] = useState<Order[]>([])
	const [items, setItems] = useState<Item[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		async function loadDashboardData() {
			// TODO change backend to retrive customer names and avoid doing it here
			try {
				setLoading(true)
				const [ordersData, itemsData] = await Promise.all([
					getOrderByStatus('pending'),
					getLowStockItems()
				])
				setOrders(ordersData)
				setItems(itemsData)
			} catch (err) {
				setError('Failed to fetch data')
			} finally {
				setLoading(false)
			}
		}
		loadDashboardData()
	}, [])

	if (loading) return (<div className="text-center text-xl p-12">Loading your dashboard...</div>)
	if (error) return (<div className="text-center text-red-500">{error}</div>)

	return (
		<ScreenLayout>
			<div className="flex flex-col items-center gap-4">
				<h1 className="text-xl py-4 font-mono">
				Quick actions
				</h1>

			<div className="flex flex-col md:grid md:grid-cols-3 w-full md:w-2/3 xl:w-1/3 gap-4 mb-4">
				<button className={`${buttonVariants.secondary} rounded-xl`}>
					+ Add Order
				</button>
				<button className={`${buttonVariants.secondary} rounded-xl`}>
					+ Add Restock 
				</button>
				<button className={`${buttonVariants.secondary} rounded-xl`}>
					+ Add Product 
				</button>
			</div>

				<h1 className="text-xl py-4 font-mono">
				General status
				</h1>

			<div className="flex flex-col md:grid md:grid-cols-2 w-full sm:w-5/6 gap-8">
				<PendingOrdersCard orders={orders}/>
				<LowStockItemsCard items={items}/>
			</div>
			</div>
		</ScreenLayout>
	)
}

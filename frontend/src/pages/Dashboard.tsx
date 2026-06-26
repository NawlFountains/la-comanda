import ScreenLayout from "../layouts/ScreenLayout"
import type { LayoutContextType } from "../layouts/Layout"
import {useOutletContext} from "react-router-dom"
import LowStockItemsCard from "../components/LowStockItemsCard"
import PendingOrdersCard from "../components/PendingOrdersCard"
import { useState, useEffect } from "react"
import type { Order, Item } from "../types"
import { getPendingOrders } from "../api/orders"
import { getMyBusiness } from "../api/business"
import {getLowStockItems} from "../api/items"

export default function Dashboard() {
	const { business } = useOutletContext<LayoutContextType>()
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
					getPendingOrders(),
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
			<h1 className="text-xl py-4">
			Dashboard
			</h1>

			<div className="flex flex-col md:grid md:grid-cols-2 w-full sm:w-5/6 gap-8">
				<PendingOrdersCard orders={orders}/>
				<LowStockItemsCard items={items}/>
			</div>
		</ScreenLayout>
	)
}

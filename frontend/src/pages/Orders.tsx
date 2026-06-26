import {useEffect, useState} from "react"
import ScreenLayout from "../layouts/ScreenLayout"
import type { Order, OrderStatus } from "../types"
import { getOrders } from "../api/orders"
import EditableOrdersTable from "../components/EditableOrdersTable"
import {TrashIcon} from "../components/Icons"

export default function Orders() {
	const [allOrders, setAllOrders] = useState<Order[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [filterStatus, setFilterStatus] = useState<OrderStatus | "">("")

	useEffect(() => {
		async function loadOrders() {
			try {
				setLoading(true)
				const data = await getOrders()
				setAllOrders(data)
			} catch (err) {
				setError(err)
			} finally {
				setLoading(false)
			}
		}
		loadOrders()
	}, [])

	const visibleOrders = filterStatus
		? allOrders.filter(order => order.status== filterStatus)
		: allOrders

	if (loading) return (<div className="text-center p-12">Loading orders...</div>)
	if (error) return (<div className="text-center text-red-500">{error}</div>)

	return (
		<ScreenLayout>
			<div className="flex flex-col w-full gap-2 mt-2">

			{/* Search and filter tab */}
			<div className="flex flex-col sm:flex-row justify-between mx-2 gap-2">
				{/* Search filter */}
				<input
					placeholder="Search"
					className="bg-neutral-300 px-3 w-full h-10 rounded-sm"/>	

				{/* Drop down filters */}
				<div className="flex flex-row">
				<select 
				  id="filter-select"
				  value={filterStatus}
				  onChange={(e) => setFilterStatus(e.target.value as OrderStatus)}
				  className="bg-neutral-100 border border-neutral-300 rounded p-2 font-medium focus:outline-none focus:ring-neutral-500 cursor-pointer"
				>
					<option value="" disabled hidden>Filter by status</option>
					<option value="pending">Pending</option>
					<option value="cancelled">Cancelled</option>
					<option value="confirmed">Confirmed</option>
					<option value="confirmed">Confirmed</option>
				</select>
				<button 
					title="Remove status filter"
					onClick={() => setFilterStatus('')}
					className={`text-red-500 cursor-pointer hover:scale-105
						${filterStatus === '' ? 'hidden' : 'block'}`}>
					<TrashIcon />
				</button>
				</div>
			</div>
			{/* Orders table */}
			<EditableOrdersTable orders={visibleOrders}/>
			</div>
		</ScreenLayout>
	)
}

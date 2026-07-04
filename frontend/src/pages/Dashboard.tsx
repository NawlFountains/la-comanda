import ScreenLayout from "../layouts/ScreenLayout"
import LowStockItemsCard from "../components/LowStockItemsCard"
import PendingOrdersCard from "../components/PendingOrdersCard"
import LatestRestockCard from '../components/LatestsRestocksCard'
import { useState, useEffect } from "react"
import type { Order, Item } from "../types"
import { getOrderByStatus } from "../api/orders"
import { getStock, getLowStockItems } from "../api/items"
import {buttonVariants} from "../components/ButtonStyles"
import AddRestockModal from "../components/AddRestockModal"
import {useRestocks} from "../hooks/useRestock"
import {useCustomer} from "../hooks/useCustomers"
import { useOrders } from "../hooks/useOrders"
import AddOrderModal from "../components/AddOrderModal"
import {useProducts} from "../hooks/useProducts"
import AddProductModal from "../components/AddProductModal"

export default function Dashboard() {
	const [ pendingOrders, setPendingOrders] = useState<Order[]>([])
	const { customers, handleCustomerCreate, errors: customerErrors } = useCustomer()

	const { orders, submitting: orderSubmitting, handleOrderCreate, errors: orderErrors} = useOrders()
	const { products, submitting: productSubmitting, handleProductCreate, errors: productErrors} = useProducts()

	const [items, setItems] = useState<Item[]>([])
	const [lowStockItems, setLowStockItems] = useState<Item[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const [showAddRestockMenu, setShowAddRestockMenu] = useState<boolean>(false)
	const [showAddOrderMenu, setShowAddOrderMenu] = useState<boolean>(false)
	const [showAddProductMenu, setShowAddProductMenu] = useState<boolean>(false)

	const { restocks, submitting: restockSubmitting, handleRestockCreate, errors: restockErrors } = useRestocks()

	useEffect(() => {
		async function loadDashboardData() {
			try {
				setLoading(true)
				const [ordersData, itemsData, lowStockItemsData] = await Promise.all([
					getOrderByStatus('pending'),
					getStock(),
					getLowStockItems(),
				])
				setPendingOrders(ordersData)
				setItems(itemsData)
				setLowStockItems(lowStockItemsData)
			} catch (err) {
				setError('Failed to fetch data '+err.message)
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
			<div className="flex flex-col w-full sm:w-5/6 items-center gap-4">

			{/* Modals */}
			{showAddRestockMenu && (
				<AddRestockModal 
					onClose={() => setShowAddRestockMenu(false)} 
					onCreate={handleRestockCreate}
					items={items}
					submitting={restockSubmitting}
					errors={restockErrors}/>
			)}

			{showAddOrderMenu && (
				<AddOrderModal 
					onClose={() => setShowAddOrderMenu(false)}
					onCreate={handleOrderCreate}
					onCreateCustomer={handleCustomerCreate}
					products={products}
					customers={customers}
					submitting={orderSubmitting}
					orderErrors={orderErrors}
					customerErrors={customerErrors}
				/>
			)}

			{showAddProductMenu && (
				<AddProductModal 
					onClose={() => setShowAddProductMenu(false)}
					onCreate={handleProductCreate}
					submitting={productSubmitting}
					errors={productErrors}
				/>
			)}

			<div className="items-center">
				<h1 className="text-xl py-4 font-mono">
				Quick actions
				</h1>
			</div>


			{/* Quick actions */}

			<div className="flex flex-col md:grid md:grid-cols-3 w-full md:w-2/3 max-w-xl gap-4 mb-4">
				<button 
					onClick={() => setShowAddOrderMenu(true)}
					className={`${buttonVariants.secondary} rounded-xl`}>
					+ Add Order
				</button>
				<button 
					onClick={() => setShowAddRestockMenu(true)}
					className={`${buttonVariants.secondary} rounded-xl`}>
					+ Add Restock 
				</button>
				<button 
					onClick={() => setShowAddProductMenu(true)}
					className={`${buttonVariants.secondary} rounded-xl`}>
					+ Add Product 
				</button>
			</div>

			{/* General status */}

				<h1 className="text-xl py-4 font-mono">
				General status
				</h1>

			<div className="flex flex-col md:grid md:grid-cols-2 gap-4">
				<PendingOrdersCard orders={pendingOrders} customers={customers}/>
				<LowStockItemsCard items={lowStockItems}/>
			</div>

			<LatestRestockCard restocks={restocks} items={items} />
			</div>

		</ScreenLayout>
	)
}

import ScreenLayout from "../layouts/ScreenLayout"
import LowStockItemsCard from "../components/items/LowStockItemsCard"
import PendingOrdersCard from "../components/orders/PendingOrdersCard"
import LatestRestockCard from '../components/restocks/LatestsRestocksCard'
import { useState, useEffect } from "react"
import type { Order, Item, OrderStatus } from "../types"
import { getOrders } from "../api/orders"
import { getStock, getLowStockItems } from "../api/items"
import {buttonVariants} from "../components/styles/ButtonStyles"
import AddRestockModal from "../components/restocks/AddRestockModal"
import {useRestocks} from "../hooks/useRestock"
import {useCustomer} from "../hooks/useCustomers"
import { useOrders } from "../hooks/useOrders"
import AddOrderModal from "../components/orders/AddOrderModal"
import {useProducts} from "../hooks/useProducts"
import AddProductModal from "../components/products/AddProductModal"
import DashboardSkeleton from "../components/skeletons/DashboardSkeleton"
import ErrorLoading from "../components/errors/ErrorLoading"

export default function Dashboard() {
	const [ pendingOrders, setPendingOrders] = useState<Order[]>([])
	const {
		customers, 
		handleCustomerCreate, 
		errors: customerErrors 
	} = useCustomer()

	const {
		submitting: orderSubmitting,
		handleOrderCreate, 
		errors: orderErrors,
		submitError: orderSubmitError
	} = useOrders()

	const {
		products, 
		submitting: productSubmitting,
		handleProductCreate, 
		errors: productErrors,
		submitError: productSubmitError
	} = useProducts()

	const { 
		restocks,
		submitting: restockSubmitting,
		handleRestockCreate, 
		errors: restockErrors,
		submitError: restockSubmitError
	} = useRestocks()

	const [items, setItems] = useState<Item[]>([])
	const [lowStockItems, setLowStockItems] = useState<Item[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const [showAddRestockMenu, setShowAddRestockMenu] = useState<boolean>(false)
	const [showAddOrderMenu, setShowAddOrderMenu] = useState<boolean>(false)
	const [showAddProductMenu, setShowAddProductMenu] = useState<boolean>(false)

	const MAX_PENDING_ORDERS = 2
	const isLimitExceeded = pendingOrders.length > MAX_PENDING_ORDERS
	const displayedOrders = isLimitExceeded
		? pendingOrders.slice(0, MAX_PENDING_ORDERS)
		: pendingOrders

	useEffect(() => {
		async function loadDashboardData() {
			try {
				setLoading(true)
				const [ordersData, itemsData, lowStockItemsData] = await Promise.all([
					getOrders({status: 'pending' as OrderStatus}),
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

	if (loading) return (
		<ScreenLayout>
			<DashboardSkeleton />
		</ScreenLayout>
	)
	if (error) 
		return (
			<ErrorLoading message={error}/>
		)

	return (
		<ScreenLayout>
			<div className="flex flex-col items-center gap-4">

			{/* Modals */}
			{showAddRestockMenu && (
				<AddRestockModal 
					onClose={() => setShowAddRestockMenu(false)} 
					onCreate={handleRestockCreate}
					items={items}
					submitting={restockSubmitting}
					submitError={restockSubmitError}
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
					submitError={orderSubmitError}
				/>
			)}

			{showAddProductMenu && (
				<AddProductModal 
					onClose={() => setShowAddProductMenu(false)}
					onCreate={handleProductCreate}
					submitting={productSubmitting}
					errors={productErrors}
					submitError={productSubmitError}
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
				<div className="flex flex-col gap-2">
				    <PendingOrdersCard orders={displayedOrders} customers={customers} route={isLimitExceeded ? '/orders' : undefined}/>
				</div>
        
			<LowStockItemsCard items={lowStockItems}/>
		    </div>

			<LatestRestockCard restocks={restocks} items={items} />
			</div>

		</ScreenLayout>
	)
}

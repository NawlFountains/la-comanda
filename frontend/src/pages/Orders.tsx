import {useMemo, useState} from "react"
import ScreenLayout from "../layouts/ScreenLayout"
import type { ActiveModal, Order, OrderStatus } from "../types"
import OrdersTable from "../components/OrdersTable"
import OrdersRow from "../components/OrdersRow"
import { TrashIcon } from "../components/Icons"
import { buttonVariants } from "../components/ButtonStyles"
import { useOrders } from "../hooks/useOrders"
import {useCustomer} from "../hooks/useCustomers"
import {useProducts} from "../hooks/useProducts"
import AddOrderModal from "../components/AddOrderModal"
import EditOrderModal from "../components/EditOrderModal" 
import ConfirmDeletionModal from "../components/ConfirmDeletionModal"
import TableSkeleton from "../components/TableSkeleton"

export default function Orders() {
	const { orders,
		visibleOrders,
		filterStatus,
		searchQuery,
		setSearchQuery,
		setFilterStatus,
		handleOrderCreate,
		handleOrderUpdate,
		handleOrderDelete,
		loading,
		submitting,
		errors: orderErrors,
		error } = useOrders()
	const { customers, handleCustomerCreate, errors: customerErrors } = useCustomer()
	const { products } = useProducts()

	const customerById = useMemo(() => {
		return Object.fromEntries(customers.map(customer => [customer.id, customer]))
	}, [customers])

	const [ activeModal, setActiveModal] = useState<ActiveModal>(null)
	const [ showCreateOrderModal, setShowCreateOrderModal ] = useState<boolean>(false)
	const activeOrder = orders.find(o => o.id === activeModal?.id)

	if (loading) return (
		<ScreenLayout> 
			<TableSkeleton cols={5} />
		</ScreenLayout>
	)
	if (error) return (<div className="text-center text-red-500">{error}</div>)

	return (
		<ScreenLayout>
			<div className="flex flex-col w-full gap-2 mt-2">

			{/* Search and filter tab */}
			<div className="flex flex-col sm:flex-row justify-between mx-2 gap-2">
				{/* Search filter */}
				<input
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					placeholder="Search by date"
					className="bg-neutral-300 px-3 w-full h-10 rounded-sm"/>	

				{/* Drop down filters */}
				<div className="flex flex-row gap-2">
				<select 
				  id="filter-select"
				  value={filterStatus}
				  onChange={(e) => setFilterStatus(e.target.value as OrderStatus)}
				  className="bg-neutral-100 border border-neutral-300 rounded p-2 font-medium focus:outline-none focus:ring-neutral-500 cursor-pointer"
				>
					<option value="" disabled hidden>Filter by status</option>
					<option value="pending">Pending</option>
					<option value="cancelled">Cancelled</option>
					<option value="delivered">Delivered</option>
					<option value="confirmed">Confirmed</option>
				</select>

				<button 
					title="Remove status filter"
					onClick={() => setFilterStatus('')}
					className={`text-red-500 cursor-pointer hover:scale-105
						${filterStatus === '' ? 'hidden' : 'block'}`}>
					<TrashIcon />
				</button>

				<button
					onClick={() => setShowCreateOrderModal(true)}
					className={buttonVariants.secondary}>
				+ Add order
				</button>
				</div>
			</div>

			{/* Orders table */}
			<OrdersTable> 
				{visibleOrders.map((order, idx) => (
					<OrdersRow 
						key={idx}
						order={order}
						customer={customerById[order.customer_id]}
						onTriggerEdit={() => setActiveModal({ mode: 'edit', id: order.id })}
						onTriggerDelete={() => setActiveModal({ mode: 'delete', id: order.id })}
						/>

				))}
			</OrdersTable>
			</div>

			{/* Modals */}
			{showCreateOrderModal && (
				<AddOrderModal 
					onCreate={handleOrderCreate}
					onCreateCustomer={handleCustomerCreate}
					onClose={() => setShowCreateOrderModal(false)}
					products={products}
					customers={customers}
					submitting={submitting}
					orderErrors={orderErrors}
					customerErrors={customerErrors}
				/>
			)}

			{activeModal?.mode === 'edit' && activeOrder && (
				<EditOrderModal 
					onClose={() => setActiveModal(null)}
					onEdit={handleOrderUpdate}
					submitting={submitting}
					order={activeOrder}
					customer={customerById[activeOrder.customer_id]}
					errors={orderErrors}
				/> 
			)}

			{activeModal?.mode === 'delete' && activeOrder && (
				<ConfirmDeletionModal
					name={`order for ${customerById[activeOrder.customer_id].name}`}
					onClose={() => setActiveModal(null)}
					onConfirm={() => {
						handleOrderDelete(activeOrder.id)
						setActiveModal(null)
					}}	
					submitting={submitting}
					/>
			)}

		</ScreenLayout>
	)
}

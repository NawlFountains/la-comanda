import {useMemo, useState} from "react"
import ScreenLayout from "../layouts/ScreenLayout"
import type { ActiveModal, OrderStatus } from "../types"
import OrdersTable from "../components/orders/OrdersTable"
import OrdersRow from "../components/orders/OrdersRow"
import { LoadingSpinner, TrashIcon } from "../components/styles/Icons"
import { buttonVariants } from "../components/styles/ButtonStyles"
import { useOrders } from "../hooks/useOrders"
import {useCustomer} from "../hooks/useCustomers"
import {useProducts} from "../hooks/useProducts"
import AddOrderModal from "../components/orders/AddOrderModal"
import EditOrderModal from "../components/orders/EditOrderModal" 
import ConfirmDeletionModal from "../components/ConfirmDeletionModal"
import TableSkeleton from "../components/skeletons/TableSkeleton"
import EmptyRow from "../components/EmptyRow"
import InfoOrderModal from "../components/orders/InfoOrderModal"

export default function Orders() {
	const { orders,
		page,
		setPage,
		limit,
		filterStatus,
		searchDate,
		setSearchDate,
		setAppliedDate,
		setFilterStatus,
		handleOrderCreate,
		handleOrderUpdate,
		handleOrderDelete,
		loading,
		submitting,
		errors: orderErrors,
		loadError,
		submitError
	} = useOrders()
	const { customers, handleCustomerCreate, errors: customerErrors } = useCustomer()
	const { products } = useProducts()

	const customerById = useMemo(() => {
		return Object.fromEntries(customers.map(customer => [customer.id, customer]))
	}, [customers])

	const [ activeModal, setActiveModal] = useState<ActiveModal>(null)
	const [ showCreateOrderModal, setShowCreateOrderModal ] = useState<boolean>(false)
	const activeOrder = orders.find(o => o.id === activeModal?.id)

	if (loadError) return (<div className="text-center text-red-500">{loadError}</div>)

	const handleStatusChange = (val: OrderStatus |  "") => {
		const apiStatusValue = val === "" ? null : val;
		setFilterStatus(apiStatusValue);
	}

	return (
		<ScreenLayout>
			<div className="flex flex-col w-full gap-2 mt-2">

			{/* Search and filter tab */}
			<div className="flex flex-col sm:flex-row justify-between mx-2 gap-2">
				   {/* Search filter */}
				    <div className="flex flex-row w-full">
				    <input
					value={searchDate ?? ""}
					type='date'
					onChange={(e) => setSearchDate(e.target.value)}
					onKeyDown={(e) => { if (e.key === 'Enter') setAppliedDate(searchDate) }}
					className="bg-neutral-100 border border-neutral-300 rounded-l-lg px-3 h-10 w-full focus:outline-none focus:ring-1 focus:ring-neutral-500"
				    />
				    <button
					onClick={() => setAppliedDate(searchDate)}
					className="bg-neutral-800 text-white px-4 h-10 rounded-r-lg hover:bg-neutral-700 transition-colors whitespace-nowrap">
					Search
				    </button>
				    {searchDate && (
					<button
					    onClick={() => { setSearchDate(null); setAppliedDate(null) }}
					    className="ml-2 text-neutral-400 hover:text-red-500 transition-colors">
					    <TrashIcon />
					</button>
				    )}
				</div>
				    {/* Drop down filters */}
				<div className="flex flex-row gap-2">
				<select 
				  id="filter-select"
				  value={filterStatus ?? ""}
				  onChange={(e) => handleStatusChange(e.target.value as OrderStatus | "")}
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
					onClick={() => handleStatusChange('')}
					className={`text-red-500 cursor-pointer hover:scale-105
						${filterStatus ? 'block' : 'hidden'}`}>
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
				{!loading ? (
					orders.length > 0 ? (
						orders.map((order, idx) => (
							<OrdersRow 
								key={idx}
								order={order}
								customer={customerById[order.customer_id]}
								onTriggerInfo={() => setActiveModal({  mode: 'info', id: order.id})}
								onTriggerEdit={() => setActiveModal({ mode: 'edit', id: order.id })}
								onTriggerDelete={() => setActiveModal({ mode: 'delete', id: order.id })}
								/>

						))
					) : (
						<EmptyRow message={`No ${filterStatus || searchDate ? 'matching' : ''} orders`} />
					)
				) : (
					<TableSkeleton />
				)}
				{/* Simple Pagination Controls Footer */}
				<div className="flex flex-row justify-center items-center gap-4 mt-4 mb-2">
					<button
						disabled={page === 1 || loading}
						onClick={() => setPage(prev => Math.max(prev - 1, 1))}
						className={`${buttonVariants.secondary} px-4 py-1 disabled:opacity-50 disabled:cursor-not-allowed`}
					>
						Previous
					</button>
					<span className="font-mono text-sm">Page {page}</span>
					<button
						disabled={orders.length < limit || loading} // Hide next if page has less than full limit rows
						onClick={() => setPage(prev => prev + 1)}
						className={`${buttonVariants.secondary} px-4 py-1 disabled:opacity-50 disabled:cursor-not-allowed`}
					>
						Next
					</button>
				</div>
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
					submitError={submitError}
				/>
			)}

			{activeModal?.mode === 'info' && activeOrder && (
				<InfoOrderModal
					onClose={() => setActiveModal(null)}
					order={activeOrder}
					customer={customerById[activeOrder.customer_id]}
					products={products}
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
					submitError={submitError}
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
					submitError={submitError}
					/>
			)}

		</ScreenLayout>
	)
}

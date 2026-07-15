import {useMemo, useState} from "react"
import ScreenLayout from "../layouts/ScreenLayout"
import type { ActiveModal, OrderStatus } from "../types"
import OrdersTable from "../components/orders/OrdersTable"
import OrdersRow from "../components/orders/OrdersRow"
import { TrashIcon } from "../components/styles/Icons"
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
import InputSearchFilter from "../components/InputSearchFilter"
import PaginationControlFooter from "../components/PaginationControlFooter"
import ErrorLoading from "../components/errors/ErrorLoading"

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
		validateOrder,
		validateOrderUpdate,
		handleOrderCreate,
		handleOrderUpdate,
		handleOrderDelete,
		loading,
		submitting,
		errors: orderErrors,
		loadError,
		clearErrors: orderClearErrors
	} = useOrders()
	const { customers, 
		validateCustomer,
		handleCustomerCreate, 
		errors: customerErrors,
		clearErrors: customerClearErrors,
	} = useCustomer()
	const { products } = useProducts()

	const customerById = useMemo(() => {
		return Object.fromEntries(customers.map(customer => [customer.id, customer]))
	}, [customers])

	const [ activeModal, setActiveModal] = useState<ActiveModal>(null)
	const [ showCreateOrderModal, setShowCreateOrderModal ] = useState<boolean>(false)
	const activeOrder = orders.find(o => o.id === activeModal?.id)

	if (loadError) return (<ErrorLoading message={loadError}/>)

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
				   <InputSearchFilter 
					id="searchDate"
					type="date"
					value={searchDate}
					onChange={setSearchDate}
					onApply={setAppliedDate}
				   />
				    
				    {/* Drop down filters */}
				<div className="flex flex-row gap-2">
				<select 
				  id="filter-select"
				  value={filterStatus ?? ""}
				  onChange={(e) => handleStatusChange(e.target.value as OrderStatus | "")}
				  className="bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded p-2 font-medium focus:outline-none focus:ring-neutral-500 cursor-pointer"
				>
					<option value="" disabled hidden>Filter by status</option>
					<option value="pending">Pending</option>
					<option value="cancelled">Cancelled</option>
					<option value="delivered">Delivered</option>
					<option value="confirmed">Confirmed</option>
				</select>

				{filterStatus && (
					<button 
						title="Remove status filter"
						onClick={() => handleStatusChange('')}

						className="text-neutral-400 hover:text-red-500 transition-colors">
					<TrashIcon />
					</button>
				)}

				<button
					onClick={() => setShowCreateOrderModal(true)}
					className={buttonVariants.secondary}>
				+ Add order
				</button>
				</div>
			</div>

			{/* Orders table */}
			{!loading ? (
				<OrdersTable> 
					{orders.length > 0 ? (
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
					)}
					<PaginationControlFooter 
						loading={loading}
						page={page}
						setPage={setPage}
						itemCount={orders.length}
						limit={limit}
						
					/>
				</OrdersTable>
			) : (
					<TableSkeleton />
				)}
			</div>

			{/* Modals */}
			{showCreateOrderModal && (
				<AddOrderModal 
					onCreate={handleOrderCreate}
					onCreateCustomer={handleCustomerCreate}
					onClose={() => {
						customerClearErrors()
						orderClearErrors()
						setShowCreateOrderModal(false)
					}}
					validateOrder={validateOrder}
					validateCustomer={validateCustomer}
					products={products}
					customers={customers}
					submitting={submitting}
					orderErrors={orderErrors}
					customerErrors={customerErrors}
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
					onClose={() => {
						orderClearErrors()
						setActiveModal(null)
					}}
					onEdit={handleOrderUpdate}
					validateOrderUpdate={validateOrderUpdate}
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

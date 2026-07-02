import {useEffect, useState} from "react"
import ScreenLayout from "../layouts/ScreenLayout"
import type { Order, OrderStatus } from "../types"
import EditableOrdersTable from "../components/EditableOrdersTable"
import {TrashIcon} from "../components/Icons"
import { buttonVariants } from "../components/ButtonStyles"
import { useOrders } from "../hooks/useOrders"
import {useCustomer} from "../hooks/useCustomers"
import AddOrderModal from "../components/AddOrderModal"
import {useProducts} from "../hooks/useProducts"

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

	const [ showMenu, setShowMenu ] = useState<boolean>(false)

	if (loading) return (<div className="text-center p-12">Loading orders...</div>)
	if (error) return (<div className="text-center text-red-500">{error}</div>)

	return (
		<ScreenLayout>
			<div className="flex flex-col w-full gap-2 mt-2">

			{showMenu && (
				<AddOrderModal 
					onCreate={handleOrderCreate}
					onCreateCustomer={handleCustomerCreate}
					onClose={() => setShowMenu(false)}
					products={products}
					customers={customers}
					submitting={submitting}
					orderErrors={orderErrors}
					customerErrors={customerErrors}
				/>
			)}

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
					onClick={() => setShowMenu(true)}
					className={buttonVariants.secondary}>
				+ Add order
				</button>
				</div>
			</div>
			{/* Orders table */}
			<EditableOrdersTable 
				orders={visibleOrders}
				customers={customers}
				onEdit={handleOrderUpdate}
				onDelete={handleOrderDelete}
				submitting={submitting}
				errors={orderErrors}
				/>
			</div>
		</ScreenLayout>
	)
}

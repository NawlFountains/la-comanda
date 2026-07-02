import { useMemo, useState } from 'react'
import { PenIcon, TrashIcon } from '../components/Icons'
import { formatDatetime } from '../utils/date'
import type { Order, Customer, CreateOrderPayload } from '../types'
import {cardVariants} from './CardStyles'
import ConfirmDeletionModal from './ConfirmDeletionModal'
import EditOrderModal from './EditOrderModal'
import type {OrderErrors} from '../schemas/order'

interface EditableOrdersTableProps {
	onEdit: (id: string, data:Partial<CreateOrderPayload>) => Promise<boolean>,
	onDelete: (id: string) => void,
	orders: Order[]
	customers: Customer[]
	submitting: boolean
	errors: OrderErrors
}

export default function EditableOrdersTable({ orders, customers, onEdit, onDelete, submitting, errors}: EditableOrdersTableProps) {
	if (orders.length == 0) return (<div> No orders </div>)

	return (
	<div className={`${cardVariants.table} sm:mx-2`}>
		<div className="flex flex-col divide-y divide-neutral-300 rounded-b-xl">
			<div className="bg-neutral-200 grid grid-cols-4 md:grid-cols-5 p-1 font-mono">
				<p className='hidden md:block'>Order_ID</p>
				<p>Customer name</p>
				<p>Status</p>
				<p>Created at</p>
				<p>Actions</p>
			</div>
			{orders.map(order => (
				<OrdersRow 
					key={order.id}
					order={order}
					customers={customers}
					onEdit={onEdit}
					onDelete={onDelete}
					submitting={submitting}
					errors={errors}
					/>
			))}
		</div>
	</div>
	)
}

interface OrdersRowProps {
	order: Order
	customers: EditableOrdersTableProps['customers']
	onEdit: EditableOrdersTableProps['onEdit']
	onDelete: EditableOrdersTableProps['onDelete']
	submitting: EditableOrdersTableProps['submitting']
	errors: EditableOrdersTableProps['errors']
}

function OrdersRow({ order, customers, onEdit, onDelete, submitting, errors }: OrdersRowProps) {
	const customerById = useMemo(() => {
		return Object.fromEntries(customers.map(customer => [customer.id, customer]))
	}, [customers])

	const [showDeleteMenu, setShowDeleteMenu] = useState<boolean>(false)
	const [showEditMenu, setShowEditMenu] = useState<boolean>(false)
	return (
		<div 
			className="grid grid-cols-4 md:grid-cols-5 p-1">
			<p className="font-mono hidden md:block">{order.id}</p>
			<p>{customerById[order.customer_id].name}</p>
			<p className={`font-mono ${order.status === 'cancelled' ? 'text-red-500' : '' }`}>{order.status}</p>
			<p>{formatDatetime(order.created_at)}</p>
			<div className='space-x-3'>
				<button
					disabled={order.status === 'cancelled'}
					onClick={() => setShowEditMenu(true)}
					title="Edit item"
					className='cursor-pointer hover:scale-110 disabled:text-gray-200'>
					<PenIcon className='w-6 h-6' />
				</button>
				<button
					disabled={order.status === 'cancelled'}
					onClick={() => setShowDeleteMenu(true)}
					title="Delete item"
					className='cursor-pointer text-red-500 hover:scale-110 disabled:text-gray-200'>
					<TrashIcon className='w-6 h-6' />
				</button>

				{/* Modals */}

				{showEditMenu && (
					<EditOrderModal 
						onClose={() => setShowEditMenu(false)}
						onEdit={onEdit}
						submitting={submitting}
						order={order}
						customer={customerById[order.customer_id]}
						errors={errors}
					/> 
				)}

				{showDeleteMenu && (
					<ConfirmDeletionModal
						name={`order for ${customerById[order.customer_id].name}`}
						onClose={() => setShowDeleteMenu(false)}
						onConfirm={() => {
							onDelete(order.id)
							setShowDeleteMenu(false)
						}}	
						submitting={submitting}
						/>
				)}
			</div>
		</div>
	)
}

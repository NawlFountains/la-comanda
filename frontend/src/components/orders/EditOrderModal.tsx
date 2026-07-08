import React, { useState } from 'react'
import ModalLayout from '../../layouts/ModalLayout'
import ErrorMessage from '../errors/ErrorMessage'
import { buttonVariants } from '../styles/ButtonStyles'
import { formatDatetime } from '../../utils/date'
import type { OrderErrors } from '../../schemas/order'
import type { Customer, Order, CreateOrderPayload, OrderStatus } from '../../types'

interface EditOrderModalProps {
	onClose: () => void,
	onEdit: (id: string, data: Partial<CreateOrderPayload>) => Promise<boolean>
	order: Order,
	customer: Customer,
	submitting: boolean
	errors: OrderErrors
	submitError: string | null
}

export default function EditOrderModal({ 
	onClose, 
	onEdit,
	order, 
	customer, 
	submitting, 
	errors,
	submitError
}: EditOrderModalProps ) {
	const [ status, setStatus ] = useState<OrderStatus>(order?.status || 'pending' as OrderStatus)

	const handleSubmit = async () => {
		const success = await onEdit(order.id, {
			status
		})

		if (success) onClose()
	}

	return (
		<ModalLayout onClose={onClose}>
			{/* Title & Order ID Header */}
			<div className="text-lg border-neutral-200 pb-2 mb-4">
				<h1 className="font-mono text-neutral-500 text-center break-all px-4">
					Edit Order 
				</h1>
			</div>

			{/* Customer and Order Status Grid */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 max-w-lg mx-auto text-md mb-2 bg-neutral-50 p-3 rounded-md border border-neutral-200">
				<div className="text-left text-neutral-500 font-mono uppercase tracking-wider text-sm flex flex-col gap-2 justify-center">
					<p>Customer:</p>
					<p>Contact:</p>
					<p>Status:</p>
					<p>Created at:</p>
					<p>ID:</p>
				</div>
				<div className="text-left text-neutral-800 font-medium tracking-wider  text-sm flex flex-col gap-2 justify-center sm:col-span-3">
					<p>{customer.name}</p>
					<p>{customer.phone || 'N/A'}</p>
					<p className={`font-mono capitalize font-bold ${
						order.status === 'cancelled' ? 'text-red-500' : 'text-amber-600'
					}`}>
						{order.status}
					</p>
					<p>{formatDatetime(order.created_at)}</p>
					<p className='font-mono'>{order.id}</p>
				</div>
			</div>
			<div className='flex flex-col'>
			<fieldset className="border border-neutral-400 rounded-lg px-2 pb-1">
				<legend className="text-xs px-1 text-neutral-600">Status</legend>
				<select
				      	className='w-full py-1 px-2'
					value={status}
					onChange={(e) => setStatus(e.target.value as OrderStatus)}
				      >
				      <option value="cancelled">Cancelled</option>
				      <option value="pending">Pending</option>
				      <option value="delivered">Delivered</option>
				      <option value="confirmed">Confirmed</option>
				</select>
				</fieldset>
				{status === 'cancelled' && (
					<p className='text-red-500 p-2'> Setting an order status as cancelled it's irreversible. </p>
				)}
				{errors.status && (<ErrorMessage message={errors.status}/>)}
			</div>

			{submitError && (<ErrorMessage message={submitError} />)}

			<div className="flex flex-col md:flex-row justify-between md:mx-4 gap-2 mt-4">
					<button
						onClick={onClose}
						className={`${buttonVariants.danger} border border-dashed w-full md:w-1/4`}>
						Cancel
					</button>
					<button 
						onClick={handleSubmit}
						disabled={submitting}
						className={`${buttonVariants.secondary} w-full md:w-1/4`}>
						{submitting ? 'Editing...' : 'Edit'}
					</button>
				</div>
		</ModalLayout>
	)
}

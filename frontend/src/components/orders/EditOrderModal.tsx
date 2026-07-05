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
}

export default function EditOrderModal({ onClose, onEdit, order, customer, submitting, errors }: EditOrderModalProps ) {
	const [ status, setStatus ] = useState<OrderStatus>(order?.status || 'pending' as OrderStatus)

	const handleSubmit = async () => {
		const success = await onEdit(order.id, {
			status
		})

		if (success) onClose()
	}

	return (
		<ModalLayout onClose={onClose}>
			<div className='flex flex-col'>
				<h1 className='font-mono font-lg text-center'>Edit Order</h1>
			</div>
			<div className='w-full flex-1'>
				<h2 className=''>Change status order for <span className='font-mono font-medium'>{customer.name}</span> created at <span className='font-medium'>{formatDatetime(order.created_at)}</span></h2>
				<p>Phone number : <span className='font-mono'>{customer.phone}</span></p>
			</div>
			<div className='flex flex-col'>
				<select
				      	className='w-full border border-neutral-700 rounded-lg py-1 px-2'
					value={status}
					onChange={(e) => setStatus(e.target.value as OrderStatus)}
				      >
				      <option value="cancelled">Cancelled</option>
				      <option value="pending">Pending</option>
				      <option value="delivered">Delivered</option>
				      <option value="confirmed">Confirmed</option>
				</select>
				{status === 'cancelled' && (
					<p className='text-red-500 p-2'> Setting an order status as cancelled it's irreversible. </p>
				)}
				{errors.status && (<ErrorMessage message={errors.status}/>)}
			</div>

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

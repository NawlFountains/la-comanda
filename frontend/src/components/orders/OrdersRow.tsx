import React from 'react'
import { PenIcon, TrashIcon } from '../styles/Icons'
import { formatDatetime } from '../../utils/date'
import type { Order, Customer } from '../../types'

interface OrdersRowProps {
	order: Order
	customer: Customer
	onTriggerEdit: () => void
	onTriggerDelete: () => void
}

export default function OrdersRow({ order, customer, onTriggerEdit, onTriggerDelete }: OrdersRowProps) {
	return (
		<div 
			className="grid grid-cols-4 md:grid-cols-5 p-1">
			<p className="font-mono hidden md:block">{order.id}</p>
			<p>{customer?.name}</p>
			<p className={`font-mono ${order.status === 'cancelled' ? 'text-red-500' : '' }`}>{order.status}</p>
			<p>{formatDatetime(order.created_at)}</p>
			<div className='space-x-3'>
				<button
					disabled={order.status === 'cancelled'}
					onClick={onTriggerEdit}
					title="Edit item"
					className='cursor-pointer hover:scale-110 disabled:text-gray-200'>
					<PenIcon className='w-6 h-6' />
				</button>
				<button
					disabled={order.status === 'cancelled'}
					onClick={onTriggerDelete}
					title="Delete item"
					className='cursor-pointer text-red-500 hover:scale-110 disabled:text-gray-200'>
					<TrashIcon className='w-6 h-6' />
				</button>
			</div>
		</div>
	)
}

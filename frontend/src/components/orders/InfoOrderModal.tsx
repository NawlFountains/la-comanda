import React, {useMemo} from 'react'
import ModalLayout from '../../layouts/ModalLayout'
import type { Customer, Order, Product } from '../../types'
import {formatDatetime} from '../../utils/date'

interface InfoOrderModalProps {
	onClose: () => void
	order: Order 
	customer: Customer
	products: Product[]
}

export default function InfoOrderModal({ onClose, order, customer, products }: InfoOrderModalProps) {
	const total = order.order_items.reduce((sum, item) => {
	    return sum + (parseFloat(item.unit_price) * item.quantity)
	}, 0)
	const productById = useMemo(() => {
		return Object.fromEntries(products.map(product => [product.id, product]))
	}, [products])
	return (
		<ModalLayout onClose={onClose}>
			{/* Title & Order ID Header */}
			<div className="text-lg border-neutral-200 pb-2 mb-4">
				<h1 className="font-mono text-neutral-500 text-center break-all px-4">
					Order <span className="text-neutral-800 font-semibold">{order.id}</span>
				</h1>
			</div>

			{/* Customer and Order Status Grid */}
			<div className="grid grid-cols-2 gap-x-4 max-w-lg mx-auto text-md mb-6 bg-neutral-50 p-3 rounded-md border border-neutral-200">
				<div className="text-right text-neutral-500 font-mono uppercase tracking-wider text-sm flex flex-col gap-2 justify-center">
					<p>Customer:</p>
					<p>Contact:</p>
					<p>Status:</p>
					<p>Created at:</p>
				</div>
				<div className="text-left text-neutral-800 font-medium tracking-wider  text-sm flex flex-col gap-2 justify-center">
					<p>{customer.name}</p>
					<p>{customer.phone || 'N/A'}</p>
					<p className={`font-mono capitalize font-bold ${
						order.status === 'cancelled' ? 'text-red-500' : 'text-amber-600'
					}`}>
						{order.status}
					</p>
					<p>{formatDatetime(order.created_at)}</p>
				</div>
			</div>

			{/* Ordered products */}	
			{order?.order_items && order?.order_items?.length > 0 && (
				<table className='text-center'>
				<thead>
					<tr className='font-mono bg-neutral-200 text-lg'>
						<td className='w-1/3'>
						Product
						</td>
						<td className='w-1/3'>
						Quantity
						</td>
						<td className='w-1/3'>
						Unit price
						</td>
					</tr>
				</thead>
				<tbody>
				{order.order_items.map((orderItem, idx) => (
					<tr key={idx}>
						<td className='p-2'>
						{productById[orderItem.product_id]?.name}
						</td>
						<td>
						{orderItem.quantity} 
						</td>
						<td>
						${orderItem.unit_price}
						</td>
					</tr>
				))}
				</tbody>
				</table>
			)}

			{/* Total Section */}
			<div className="flex justify-between items-center p-3 bg-neutral-100 rounded-md border border-neutral-200">
				<span className="text-neutral-600 font-medium text-sm">Total Amount</span>
				<p className="font-mono text-xl font-bold text-neutral-900">${total.toFixed(2)}</p>
			</div>
		</ModalLayout>
	)
}

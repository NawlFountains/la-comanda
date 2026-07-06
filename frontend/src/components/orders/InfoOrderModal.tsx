import React, {useMemo} from 'react'
import ModalLayout from '../../layouts/ModalLayout'
import type { Customer, Order, Product } from '../../types'

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
			<div>
				<h1 className='font-mono text-lg text-center'>Order {order.id}</h1>
			</div>

			{/* Customer and order status*/}
			<div className='text-center grid grid-cols-2 gap-2 mx-5'>
				<div className='font-bold'>
					<p>Customer:</p>
					<p>Contact:</p>
					<p>Unit price:</p>
				</div>
				<div>
				<p>{customer.name}</p>
				<p>{customer.phone}</p>
				<p className={`font-mono ${order.status === 'cancelled' ? 'text-red-500' : ''}`}>{order.status}</p>
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
			<div className='text-center'>
			 <p className='font-mono text-lg'>Total: ${total.toFixed(2)}</p>
			</div>
		</ModalLayout>
	)
}

import {useState} from 'react'
import type { OrderErrors } from '../../schemas/order'
import type { Product, Customer, CreateOrderPayload, OrderStatus, CreateOrderItemPayload, CreateCustomerPayload } from '../../types'
import { buttonVariants } from '../styles/ButtonStyles'
import ModalLayout from '../../layouts/ModalLayout'
import InputModal from '../InputModal'
import ErrorMessage from '../errors/ErrorMessage'
import type {CustomerErrors} from '../../schemas/customer'

interface AddOrderModalProps {
	onClose: () => void
	onCreate: (data: CreateOrderPayload) => Promise<boolean>
	onCreateCustomer: (data: CreateCustomerPayload) => Promise<string | null>
	products: Product[]
	customers: Customer[]
	submitting: boolean
	orderErrors: OrderErrors
	customerErrors: CustomerErrors 
	submitError: string | null
}

export default function AddOrderModal({
	onClose, 
	onCreate, 
	onCreateCustomer, 
	products, 
	customers, 
	submitting, 
	orderErrors, 
	customerErrors,
	submitError
}: AddOrderModalProps) {
	const [customerId, setCustomerId] = useState('')
	const [status, setStatus] = useState<OrderStatus>('pending')
	const [orderItems, setOrderItems] = useState<CreateOrderItemPayload[]>([])

	const [customerName, setCustomerName] = useState<string>('')
	const [customerPhone, setCustomerPhone] = useState<string>('')

	const handleSubmit = async () => {
		let finalCustomerId: string | null = customerId

		if (customerId === 'create-customer') {
			const newId = await onCreateCustomer({
				name: customerName,
				phone: customerPhone
			})

			if (!newId) return

			finalCustomerId = newId
			setCustomerId(newId)
		}

		const success = await onCreate({
			customer_id: finalCustomerId,
			status,
			order_items: orderItems
		})
		
		if (success) onClose()

	}

	const handleAddOrderItem = () => {
		const newOrderItem: CreateOrderItemPayload = {
			product_id: products[0]?.id || '',
			quantity: 1
		}

		setOrderItems([...orderItems, newOrderItem])
	}

	const handleItemChange = (index: number, field: keyof CreateOrderItemPayload, value: string | number) => {
		const updatedItems = [...orderItems]
		updatedItems[index] = {
			...updatedItems[index],
			[field]: value
		} as CreateOrderItemPayload
		setOrderItems(updatedItems)
	}

	const handleRemoveItem = (index: number) => {
		setOrderItems(orderItems.filter((_, i) => i !== index))
	}


	return (
		<ModalLayout onClose={onClose}>
			<div className='flex flex-col'>
				<div>
				<h1 className='text-center text-lg font-mono'>Add Order</h1>
				</div>
			</div>
			<div className='w-full flex-1'>
	<fieldset className="border border-neutral-400 dark:border-neutral-600 rounded-lg px-2 pb-1">
				<legend className="text-xs px-1 text-neutral-600 dark:text-neutral-200">Customer</legend>
				      <select
				      	className='dark:bg-neutral-800 w-full py-1 px-2'
					value={customerId}
					id="customerId"
					onChange={(e) => setCustomerId(e.target.value)}
				      >
					<option value="" disabled>Select an costumer</option>
					<option value='create-customer'>
					 Create new customer
					</option>
					{customers.map((validCustomers) => (
					  <option key={validCustomers.id} value={validCustomers.id}>
					    {validCustomers.name}
					  </option>
					))}
					
				      </select>
		</fieldset>
				    {orderErrors.customer_id && (<ErrorMessage message={orderErrors.customer_id}/>)}
			    </div>
			    
			{/* Create customer */}
			{customerId === 'create-customer' && (
				<div className='flex flex-col min-h-10 sm:flex-row gap-3'>
				<div className='flex flex-col'>
					<InputModal 
						className='p-1 w-full'
						id="customerName"
						label="Name"
						value={customerName}
						onChange={(e) => setCustomerName(e.target.value)}
						placeholder='e.g. Cornelius'/>
					{customerErrors.name && (<ErrorMessage message={customerErrors.name}/>)}
				</div>
				<div>
					<InputModal 
						className='p-1 w-full'
						value={customerPhone}
						id="customerPhone"
						label="Phone"
						onChange={(e) => setCustomerPhone(e.target.value)}
						placeholder='+54 9 11 1234-5678'/>
					{customerErrors.phone && (<ErrorMessage message={customerErrors.phone}/>)}
				</div>
				</div>
			)}
			<div className='flex flex-col'>
				<fieldset className="border border-neutral-400 dark:border-neutral-600 rounded-lg px-2 pb-1">
						<legend className="text-xs px-1 text-neutral-600 dark:text-neutral-200">Status</legend>

				<select
				      	className='dark:bg-neutral-800 w-full rounded-lg py-1 px-2'
					value={status}
					id="orderStatus"
					onChange={(e) => setStatus(e.target.value as OrderStatus)}
				      >
				      <option value="cancelled">Cancelled</option>
				      <option value="pending">Pending</option>
				      <option value="delivered">Delivered</option>
				      <option value="confirmed">Confirmed</option>
				</select>
				</fieldset>
			</div>
			 <div className='flex flex-col gap-2'>
				<h2 className='text-center text-xl font-mono'>Products ordered</h2>
				{orderItems.map((item, index) => (
					<div key={index} className='flex flex-row gap-2 items-center pb-2'>

					    {/* Item Dropdown Selection */}
					    <div className='w-full flex-1'>
					    <fieldset className="border border-neutral-400 dark:border-neutral-600 rounded-lg px-2 pb-1">
						<legend className="text-xs px-1 text-neutral-600 dark:text-neutral-200">Product</legend>

					      <select
						className='dark:bg-neutral-800 w-full rounded-lg py-1 px-2'
						id={`orderItem${index}Id$`}
						value={item.product_id}
						onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
					      >
						<option value="" disabled>Select an product</option>
						{products.map((validProducts) => (
						  <option key={validProducts.id} value={validProducts.id}>
						    {validProducts.name}
						  </option>
						))}
					      </select>
					      </fieldset>
					    </div>
					    
					    {/* Quantity Input */}
					    <div className='w-32 flex flex-row gap-2'>
					    <InputModal
						    className='w-full'
						    placeholder='e.g. 3'
						    type='number'
						    step='1'
						    id={`orderItem${index}Id`}
						    label="Quantity"
						    value={item.quantity || ''}
						    onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
					    />
					    </div>

					    {/* Remove item button */}
					    <button
					      type="button"
					      onClick={() => handleRemoveItem(index)}
					      className="p-2 text-gray-400 hover:text-red-500 text-sm"
					      title="Remove item"
					    >
					      ✕
					    </button>
					  </div>
					       ))}
				<button
					onClick={() => handleAddOrderItem()}
					className={buttonVariants.secondary}>
					+ Add product 
				</button>
				{orderErrors.order_items && (<ErrorMessage message={orderErrors.order_items} /> )}
				</div>

			{submitError && ( <ErrorMessage message={submitError} />) }
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
						{submitting ? 'Adding...' : 'Add'}
					</button>
				</div>
		</ModalLayout>
	)
}

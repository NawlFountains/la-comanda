import {useState} from 'react'
import { useTranslation } from 'react-i18next'
import type { OrderCreateData, OrderErrors, OrderItemCreateData } from '../../schemas/order'
import type { Product, Customer, OrderStatus } from '../../types'
import { buttonVariants } from '../styles/ButtonStyles'
import ModalLayout from '../../layouts/ModalLayout'
import InputModal from '../InputModal'
import ErrorMessage from '../errors/ErrorMessage'
import type {CustomerCreateData, CustomerErrors} from '../../schemas/customer'

interface AddOrderModalProps {
	onClose: () => void
	onCreate: (data: OrderCreateData) => Promise<boolean>
	onCreateCustomer: (data: CustomerCreateData) => Promise<string | null>
	validateOrder: (data: OrderCreateData) => boolean
	validateCustomer: (data: CustomerCreateData) => boolean
	products: Product[]
	customers: Customer[]
	submitting: boolean
	orderErrors: OrderErrors
	customerErrors: CustomerErrors 
}

export default function AddOrderModal({
	onClose, 
	onCreate, 
	onCreateCustomer, 
	validateOrder,
	validateCustomer,
	products, 
	customers, 
	submitting, 
	orderErrors, 
	customerErrors,
}: AddOrderModalProps) {
	const { t } = useTranslation()
	const [customerId, setCustomerId] = useState('')
	const [status, setStatus] = useState<OrderStatus>('pending')
	const [orderItems, setOrderItems] = useState<OrderItemCreateData[]>([])

	const [customerName, setCustomerName] = useState<string>('')
	const [customerPhone, setCustomerPhone] = useState<string>('')

	const handleSubmit = async () => {
		let finalCustomerId: string | null = customerId

		if (customerId === 'create-customer') {
			const customerData = { name: customerName, phone: customerPhone }
			if (!validateCustomer(customerData)) return 
			const newId = await onCreateCustomer(customerData)
			if (!newId) return

			finalCustomerId = newId
			setCustomerId(newId)
		}

		const orderData = { customer_id: finalCustomerId, status, order_items: orderItems }
		if (!validateOrder(orderData)) return
		onClose()
		onCreate(orderData)

	}

	const handleAddOrderItem = () => {
		const newOrderItem: OrderItemCreateData = {
			product_id: products[0]?.id || '',
			quantity: 1
		}

		setOrderItems([...orderItems, newOrderItem])
	}

	const handleItemChange = (index: number, field: keyof OrderItemCreateData, value: string | number) => {
		const updatedItems = [...orderItems]
		updatedItems[index] = {
			...updatedItems[index],
			[field]: value
		} as OrderItemCreateData
		setOrderItems(updatedItems)
	}

	const handleRemoveItem = (index: number) => {
		setOrderItems(orderItems.filter((_, i) => i !== index))
	}


	return (
		<ModalLayout onClose={onClose}>
			<div className='flex flex-col'>
				<div>
				<h1 className='text-center text-lg font-mono'>{t("orders.addOrder")}</h1>
				</div>
			</div>
			<div className='w-full flex-1'>
	<fieldset className="border border-neutral-400 dark:border-neutral-600 rounded-lg px-2 pb-1">
				<legend className="text-xs px-1 text-neutral-600 dark:text-neutral-200">{t("customers.singular")}</legend>
				      <select
				      	className='dark:bg-neutral-800 w-full py-1 px-2'
					value={customerId}
					id="customerId"
					onChange={(e) => setCustomerId(e.target.value)}
				      >
					<option value="" disabled>{t("orders.selectCustomer")}</option>
					<option value='create-customer'>
					 {t("orders.createCustomer")}
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
						label={t("common.fields.name")}
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
						label={t("common.fields.phone")}
						onChange={(e) => setCustomerPhone(e.target.value)}
						placeholder='+54 9 11 1234-5678'/>
					{customerErrors.phone && (<ErrorMessage message={customerErrors.phone}/>)}
				</div>
				</div>
			)}
			<div className='flex flex-col'>
				<fieldset className="border border-neutral-400 dark:border-neutral-600 rounded-lg px-2 pb-1">
						<legend className="text-xs px-1 text-neutral-600 dark:text-neutral-200">{t("common.fields.status")}</legend>

				<select
				      	className='dark:bg-neutral-800 w-full rounded-lg py-1 px-2'
					value={status}
					id="orderStatus"
					onChange={(e) => setStatus(e.target.value as OrderStatus)}
				      >
				      <option value="cancelled">{t("orderStatus.cancelled")}</option>
				      <option value="pending">{t("orderStatus.pending")}</option>
				      <option value="delivered">{t("orderStatus.delivered")}</option>
				      <option value="confirmed">{t("orderStatus.confirmed")}</option>
				</select>
				</fieldset>
			</div>
			 <div className='flex flex-col gap-2'>
				<h2 className='text-center text-xl font-mono'>{t("orders.productsOrdered")}</h2>
				{orderItems.map((item, index) => (
					<div key={index} className='flex flex-row gap-2 items-center pb-2'>

					    {/* Item Dropdown Selection */}
					    <div className='w-full flex-1'>
					    <fieldset className="border border-neutral-400 dark:border-neutral-600 rounded-lg px-2 pb-1">
						<legend className="text-xs px-1 text-neutral-600 dark:text-neutral-200">{t("products.singular")}</legend>

					      <select
						className='dark:bg-neutral-800 w-full rounded-lg py-1 px-2'
						id={`orderItem${index}Id$`}
						value={item.product_id}
						onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
					      >
						<option value="" disabled>{t("orders.selectProduct")}</option>
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
						    label={t("common.fields.quantity")}
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
					+ {t("products.addProduct")}
				</button>
				{orderErrors.order_items && (<ErrorMessage message={orderErrors.order_items} /> )}
				</div>

			<div className="flex flex-col md:flex-row justify-between md:mx-4 gap-2 mt-4">

					<button
						onClick={onClose}
						className={`${buttonVariants.danger} border border-dashed w-full md:w-1/4`}>						
						{t('common.actions.cancel')}
					</button>
					<button 
						onClick={handleSubmit}
						disabled={submitting}
						className={`${buttonVariants.secondary} w-full md:w-1/4`}>
						{submitting ? t('common.actions.adding') : t('common.actions.add')}
					</button>
				</div>
		</ModalLayout>
	)
}

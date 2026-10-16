import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { Order, Customer } from '../../types'
import {cardVariants} from '../styles/CardStyles'
import { formatDatetime } from '../../utils/date'
import EmptyRow from '../EmptyRow'
import {Link} from 'react-router-dom'

interface PendingOrdersCardProps {
	orders: Order[]
	customers: Customer[]
	route?: string 
}

export default function PendingOrdersCard({ orders, customers, route }: PendingOrdersCardProps) {
	const { t } = useTranslation()
	const customerById = useMemo(() => {
		return Object.fromEntries(customers.map(customer => [customer.id, customer]))
	}, [customers])

	return (
		<div className={cardVariants.tableBody}>
			<div className='flex flex-col gap-2 p-4'>
				<h1 className="text-xl ">{t("orders.currentlyPendingOrders")}</h1>
			</div>
			<div className="flex flex-col divide-y divide-neutral-300 dark:divide-neutral-600 rounded-b-xl">
				<div className="bg-neutral-200 dark:bg-neutral-900 grid grid-cols-3 sm:grid-cols-4 p-1 font-mono">
						<p className='hidden sm:block'>Ref</p>
						<p>{t("orders.customer")}</p>
						<p>{t("orders.createdAt")}</p>
						<p>{t("orders.total")}</p>
				</div>
				{orders.length > 0 ? (
					orders.map(order => {
						const total = order.order_items.reduce((sum, item) => {
						    return sum + (parseFloat(item.unit_price) * item.quantity)
						}, 0)

						return (
							<div 
								key={order.id} 
								className="grid grid-cols-3 sm:grid-cols-4 p-1">
								<p className="font-mono hidden sm:block">#{order.id.slice(0, 6).toUpperCase()}</p>
								<p>{customerById[order.customer_id]?.name}</p>
								<p>{formatDatetime(order.created_at)}</p>
								<p>${total}</p>
							</div>
						)}
					)
				): (
					<EmptyRow message='No pending orders' />
				)}
			</div>
			{route && (
				<div className="p-3 bg-neutral-50 dark:bg-neutral-800 text-center border-t border-neutral-300 dark:border-neutral-600 rounded-b-xl">
					<Link 
						to={route} 
						className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50 underline transition-colors"
					>
						{t("orders.morePendingOrders")} →
					</Link>
				</div>
			)}
		</div>
	)
}

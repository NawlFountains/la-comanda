import React from 'react'
import { useTranslation } from 'react-i18next'
import {cardVariants} from '../styles/CardStyles'

export default function OrdersTable({ children }: { children: React.ReactNode }) {
	const { t } = useTranslation()
	return (
	<div className={`${cardVariants.tableBody} sm:mx-2 overflow-hidden`}>
		<div className="flex flex-col divide-y divide-neutral-300 dark:divide-neutral-600 rounded-b-xl">
			<div className="bg-neutral-200 dark:bg-neutral-900 grid grid-cols-4 md:grid-cols-5 p-1 font-mono">
				<p>Ref</p>
				<p>{t('orders.customerName')}</p>
				<p>{t('orders.status')}</p>
				<p className='hidden md:block'>{t('orders.createdAt')}</p>
				<p>Actions</p>
			</div>
			{children}
		</div>
	</div>
	)
}



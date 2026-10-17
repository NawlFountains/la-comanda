import React from 'react'
import { useTranslation } from 'react-i18next'
import {cardVariants} from '../styles/CardStyles'

export default function StockTable({ children }: { children: React.ReactNode }) {
	const { t } = useTranslation()
	return (
	<div className={`${cardVariants.tableBody} sm:mx-2 overflow-hidden`}>
		<div className="flex flex-col divide-y divide-neutral-300 dark:divide-neutral-600 rounded-b-xl">

			{/* Header */}
			<div className="bg-neutral-200 dark:bg-neutral-900 grid grid-cols-3 sm:grid-cols-4 p-2 font-mono">
				<p>{t("common.fields.name")}</p>
				<p>{t("items.currentStock")}</p>
				<p className='hidden sm:block'>{t("items.lowStockThreshold")}</p>
				<p>Actions</p>
			</div>

			{/* Table body */}
			{children}
		</div>
	</div>
	)
}



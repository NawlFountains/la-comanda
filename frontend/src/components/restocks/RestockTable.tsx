import React from 'react'
import { useTranslation } from 'react-i18next'
import {cardVariants} from '../styles/CardStyles'

export default function RestockTable({ children }: { children: React.ReactNode} ) {
	const { t } = useTranslation()
	return (
	<div className={`${cardVariants.tableBody} sm:mx-2 overflow-hidden`}>
		<div className="flex flex-col divide-y divide-neutral-300 dark:divide-neutral-600 rounded-b-xl">

			{/* Header */}
			<div className="bg-neutral-200 dark:bg-neutral-900 grid grid-cols-3 sm:grid-cols-5 p-2 font-mono">
				<p className='hidden sm:block'>Ref</p>
				<p>{t("restocks.supplier")}</p>
				<p className='hidden sm:block'>{t("restocks.items") }</p>
				<p>{t("restocks.date")}</p>
				<p>Actions</p>
			</div>

			{/* Table body */}
			{children}

		</div>
	</div>
	)
}

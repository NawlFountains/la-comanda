import React from 'react'
import {cardVariants} from '../styles/CardStyles'

export default function StockTable({ children }: { children: React.ReactNode }) {
	return (
	<div className={`${cardVariants.tableBody} sm:mx-2 overflow-hidden`}>
		<div className="flex flex-col divide-y divide-neutral-300 dark:divide-neutral-600 rounded-b-xl">

			{/* Header */}
			<div className="bg-neutral-200 dark:bg-neutral-900 grid grid-cols-3 sm:grid-cols-4 p-2 font-mono">
				<p>Name</p>
				<p>Current stock</p>
				<p className='hidden sm:block'>Low stock threshold</p>
				<p>Actions</p>
			</div>

			{/* Table body */}
			{children}
		</div>
	</div>
	)
}



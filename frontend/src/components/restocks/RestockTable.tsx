import React from 'react'
import {cardVariants} from '../styles/CardStyles'

export default function RestockTable({ children }: { children: React.ReactNode} ) {
	return (
	<div className={`${cardVariants.table} sm:mx-2 overflow-hidden`}>
		<div className="flex flex-col divide-y divide-neutral-300 rounded-b-xl">

			{/* Header */}
			<div className="bg-neutral-200 grid grid-cols-3 sm:grid-cols-5 p-2 font-mono">
				<p className='hidden sm:block'>Ref</p>
				<p>Supplier</p>
				<p className='hidden sm:block'>Items</p>
				<p>Date</p>
				<p>Actions</p>
			</div>

			{/* Table body */}
			{children}

		</div>
	</div>
	)
}

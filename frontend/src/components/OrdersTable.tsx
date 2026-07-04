import React from 'react'
import {cardVariants} from './CardStyles'

export default function OrdersTable({ children }: { children: React.ReactNode }) {
	return (
	<div className={`${cardVariants.table} sm:mx-2`}>
		<div className="flex flex-col divide-y divide-neutral-300 rounded-b-xl">
			<div className="bg-neutral-200 grid grid-cols-4 md:grid-cols-5 p-1 font-mono">
				<p className='hidden md:block'>Order_ID</p>
				<p>Customer name</p>
				<p>Status</p>
				<p>Created at</p>
				<p>Actions</p>
			</div>
			{children}
		</div>
	</div>
	)
}



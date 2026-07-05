import React from 'react'
import {cardVariants} from '../styles/CardStyles'

export default function ProductsTable({ children }: { children : React.ReactNode} ) {
	return (
	<div className={`${cardVariants.table} sm:mx-2`}>
		<div className="flex flex-col divide-y divide-neutral-300 rounded-b-xl">

			{/* Header */}
			<div className="bg-neutral-200 grid grid-cols-3 p-2 font-mono">
				<p>Product_ID</p>
				<p>Name</p>
				<p>Actions</p>
			</div>

			{/* Table body */}
			{children}
		</div>
	</div>
	)
}



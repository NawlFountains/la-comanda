import React, {useState} from 'react'
import { InfoIcon, PenIcon, TrashIcon } from '../styles/Icons'
import type { Product } from '../../types'

interface ProductsRowProps {
	product: Product
	onTriggerInfo: () => void
	onTriggerEdit: () => void
	onTriggerDelete: () => void
}

export default function ProductsRow({ product, onTriggerEdit, onTriggerInfo, onTriggerDelete }: ProductsRowProps) {
	return (
		<div 
			key={product.id} 
			className="grid grid-cols-3 p-2 gap-4">
			<p className="font-mono">{product.id}</p>
			<p>{product.name}</p>
			<div className='space-x-3'>
				<button
					onClick={onTriggerInfo}
					title="Info product"
					className='cursor-pointer hover:scale-110'>
					<InfoIcon className='w-6 h-6' />
				</button>
				<button
					onClick={onTriggerEdit}
					title="Edit product"
					className='cursor-pointer hover:scale-110'>
					<PenIcon className='w-6 h-6' />
				</button>
				<button
					onClick={onTriggerDelete}
					title="Delete product"
					className='cursor-pointer text-red-500 hover:scale-110'>
					<TrashIcon className='w-6 h-6' />
				</button>
			</div>
		</div>
	)
}

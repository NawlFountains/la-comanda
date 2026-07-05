import React, { useMemo } from 'react'
import ModalLayout from '../layouts/ModalLayout'
import { buttonVariants } from '../components/ButtonStyles.ts'
import type { PriceHistory, Product, RecipeItem, Item } from '../types'
import { LoadingSpinner } from './Icons.tsx'

interface InfoProductModalProps {
	onClose: () => void
	loading: boolean
	product: Product
	prices: PriceHistory[]
	recipeItems: RecipeItem[] 
	items: Item[]
}

export default function InfoProductModal({ onClose, loading, product, prices, recipeItems, items }: InfoProductModalProps) {
	const itemById = useMemo(() => {
		return Object.fromEntries(items.map(item => [item.id, item]))
	}, [items])

	return (
		<ModalLayout onClose={onClose}>
			<div className='flex flex-col'>
				<h1 className='font-mono text-lg text-center'>Info about <span className='font-medium'>{product.name}</span></h1>
			</div>

			{!loading ? (
				<div className='flex flex-col text-center gap-3'>
				<div className='flex flex-col'>
				{prices && prices.length > 0 ? (
					<>
					<h2 className='font-mono text-lg'>Prices</h2>
					<table>
					<thead>
						<tr className='font-mono bg-neutral-200'>
							<td>
							Price
							</td>
							<td>
							valid form
							</td>
						</tr>
					</thead>
					<tbody>
						{prices.map((price, idx) => (
							<tr key={idx}>
							<td>
							${price.price}
							</td>
							<td>
							{price.valid_from}
							</td>
							</tr>
						   ))}
					</tbody>
					</table>
					</>
				) : (
					<p> No price setted </p>
				)}
				</div>
				<div className='flex flex-col'>
				{recipeItems && recipeItems.length > 0 ?  (
					<>
					<h2 className='font-mono text-lg'>Recipe</h2>
					<table>
					<thead>
						<tr className='bg-neutral-200'>
							<td>
								Item
							</td>
							<td>
								Amount
							</td>
						</tr>
					</thead>
					<tbody>
					{recipeItems.map((item, idx) => (
						<tr key={idx}>
							<td> 
							{itemById[item.item_id].name}
							</td>
							<td>
							{item.quantity} {item.unit}
							</td>
						</tr>
					   ))}
					</tbody>
					</table>
					</>
				) : (
					<p> No recipe setted </p>
				)}
				</div>
				</div>
			) : (
				
				<LoadingSpinner className='mx-auto'/>
			)}
			
			<div className="flex flex-col md:flex-row justify-between md:mx-4 gap-2 mt-4">
					<button
						onClick={onClose}
						className={`${buttonVariants.danger} border border-dashed w-full md:w-1/4`}>
						Cancel
					</button>
				</div>
		</ModalLayout>
	)
}

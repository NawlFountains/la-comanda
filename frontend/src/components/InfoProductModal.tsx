import React, { useMemo } from 'react'
import ModalLayout from '../layouts/ModalLayout'
import { buttonVariants } from '../components/ButtonStyles.ts'
import type { PriceHistory, Product, RecipeItem, Item } from '../types'

interface InfoProductModalProps {
	onClose: () => void
	product: Product
	prices: PriceHistory[]
	recipeItems: RecipeItem[] 
	items: Item[]
}

export default function InfoProductModal({ onClose, product, prices, recipeItems, items }: InfoProductModalProps) {
	const itemById = useMemo(() => {
		return Object.fromEntries(items.map(item => [item.id, item]))
	}, [items])
	return (
		<ModalLayout onClose={onClose}>
			<div className='flex flex-col'>
				<h1 className='font-mono text-center'>Info about {product.name}</h1>
			</div>

			<div className='flex flex-col'>
			{prices && prices.length > 0 ? (
				<>
				<h2 className='font-mono text-lg'>Prices</h2>
				{prices.map((price, idx) => (
				<p key={idx}>{price.price}$ {price.valid_from}</p>
			   ))}
				</>
			) : (
				<p> No price setted </p>
			)}
			</div>
			<div className='flex flex-col'>
			{recipeItems && recipeItems.length > 0 ?  (
				<>
				<h2 className='font-mono text-lg'>Recipe</h2>
				{recipeItems.map((item, idx) => (
				<p key={idx}>{itemById[item.item_id].name} {item.quantity}{item.unit}</p>
				   ))}
				</>
			) : (
				<p> No recipe setted </p>
			)}
			</div>
			
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

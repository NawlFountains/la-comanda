import React, { useState, useMemo } from 'react'
import ModalLayout from '../../layouts/ModalLayout'
import type { PriceHistory, Item, ProductWithDetails } from '../../types'
import { LoadingSpinner } from '../styles/Icons'
import {formatDate} from '../../utils/date'

interface InfoProductModalProps {
	onClose: () => void
	loading: boolean
	product: ProductWithDetails
	prices: PriceHistory[]
	items: Item[]
}

export default function InfoProductModal({ onClose, loading, product, prices, items }: InfoProductModalProps) {
	const [showPastPrices, setShowPastPrices] = useState<boolean>(false)
	const itemById = useMemo(() => {
		return Object.fromEntries(items.map(item => [item.id, item]))
	}, [items])

	return (
		<ModalLayout onClose={onClose}>
			<div className='flex flex-col'>
				<h1 className='font-mono text-lg text-center'>Info</h1>
			</div>

			{/* Product info */}
			<div className="grid grid-cols-4 gap-x-4 max-w-lg mx-auto text-md p-3 rounded-md border border-neutral-200">
				<div className="text-center text-neutral-500 font-mono uppercase tracking-wider text-sm flex flex-col gap-2 justify-center">
					<p>Name:</p>
					<p>ID:</p>
				</div>
				<div className="text-left text-neutral-800 font-medium tracking-wider text-sm flex flex-col gap-2 justify-center col-span-3">
					<p>{product.name}</p>
					<p className='font-mono'>{product.id}</p>
				</div>
			</div>

			{!loading ? (
				<div className='flex flex-col text-center gap-3'>
				<div className='flex flex-col'>
				{prices && prices.length > 0 ? (
					<>
					<h2 className='font-mono text-lg'>Prices</h2>
					<table>
					<thead>
						<tr className='text-lg font-mono bg-neutral-200 font-medium'>
							<td>
							Price
							</td>
							<td>
							From
							</td>
						</tr>
					</thead>
					<tbody>
					{(showPastPrices ? prices : prices.slice(0, 1)).map(( price, idx) => (
									<tr key={idx}>
										<td>${price.price}</td>
										<td>{formatDate(price.valid_from)}</td>
									</tr>
							))}
					</tbody>
					</table>
					</>
				) : (
					<p> No price setted </p>
				)}
				{prices && prices.length > 1 && (
						<button 
							onClick={() => setShowPastPrices(!showPastPrices)}
							className="text-sm text-neutral-600 underline cursor-pointer hover:text-neutral-800"
						>
							{showPastPrices? "Hide History" : `Show History (${prices.length - 1} more)`}
						</button>
					)}
				</div>
				<div className='flex flex-col'>
				{product.recipe_items && product.recipe_items.length > 0 ?  (
					<>
					<h2 className='font-mono text-lg'>Recipe</h2>
					<table>
					<thead>
						<tr className='font-mono text-lg bg-neutral-200'>
							<td>
								Item
							</td>
							<td>
								Amount
							</td>
						</tr>
					</thead>
					<tbody>
					{product.recipe_items.map((item, idx) => (
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
		</ModalLayout>
	)
}

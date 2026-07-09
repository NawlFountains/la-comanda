import { useState } from 'react'
import { buttonVariants } from '../styles/ButtonStyles'
import ErrorMessage from '../errors/ErrorMessage'
import InputModal from '../InputModal'
import type { PriceHistoryErrors } from '../../schemas/price_history'
import type { Product, PriceHistory, CreatePriceHistoryPayload } from '../../types'
import {formatDate} from '../../utils/date'


interface PriceSectionProps {
	onAddPrice: (productId: string, data: CreatePriceHistoryPayload) => Promise<boolean>
	product: Product
	prices: PriceHistory[]
	priceErrors: PriceHistoryErrors
}

export default function PriceSection({
	onAddPrice,
	product,
	prices,
	priceErrors
}: PriceSectionProps ) {
	const [showPastPrices, setShowPastPrices] = useState(false)
	const [createPrice, setCreatePrice] = useState(false)
	const [price, setPrice] = useState<string>('')
	const [validFrom, setValidFrom] = useState<string>( () => {
		return new Date().toISOString().split('T')[0]
	})

	const handleSubmit = async () => {
		const successPrice = await onAddPrice(product.id, {
			price,
			valid_from: validFrom
		})
		if (successPrice) {
			setShowPastPrices(true)
			setCreatePrice(false)
		}
	}
	return (
		<div className='flex flex-col text-center gap-3'>
		{/* Current and Past prices */}
		{((prices && prices.length > 0) || (createPrice)) && (
			<table>
			<thead>
				<tr className='text-lg font-mono bg-neutral-200'>
				<td>Price</td>
				<td>From</td>
				</tr>
			</thead>
			<tbody>
			{(showPastPrices ? prices : prices.slice(0, 1)).map(( price, idx) => (
				<tr key={idx}>
					<td className='w-1/2 p-2'>${price.price}</td>
					<td className='w-1/2'>{formatDate(price.valid_from)}</td>
				</tr>
			))}
			{createPrice && (
				<tr className='relative'>
					<td className='flex flex-row items-center gap-2 px-4'>
						<p className='text-right'>
						$
						</p>
					<InputModal
						name="input_price"
						className='w-1/3 text-center'
						value={price}
						placeholder="e.g. 100.50"
						id="priceValue"
						label="Price"
						type='number'
						onChange={(e) => setPrice(e.target.value)}
						/>

					</td>
					<td className='px-4'>
					<InputModal
						name="input_valid_from"
						type="date"
						id="priceValidFrom"
						label="From"
						className='w-1/3 text-center'
						value={validFrom}
						onChange={(e) => setValidFrom(e.target.value)}
						/>
					</td>

				</tr>
			)}	

			{priceErrors && (
				<tr>
					<td>
					{priceErrors.price && (<ErrorMessage message={priceErrors.price}/>)}
					</td>
					<td>
					{priceErrors.valid_from && (<ErrorMessage message={priceErrors.valid_from}/>)}
					</td>
				</tr>
			)}

			{/*  Price creation confirmation */}
			{createPrice && (
				<tr>
					<td className='p-2'>
						<button 
							onClick={() => setCreatePrice(false)}
							className={buttonVariants.danger}>
						Cancel
						</button>
					</td>
					<td>
						<button 
							onClick={() => handleSubmit()}
							className={buttonVariants.secondary}>
						Confirm
						</button>
					</td>
				</tr>
			)}
			</tbody>
			</table>
		)}

		{prices && prices.length > 1 && (
			<button 
				onClick={() => setShowPastPrices(!showPastPrices)}
				className="text-sm text-neutral-600 underline cursor-pointer hover:text-neutral-800"
			>
				{showPastPrices? "Hide History" : `Show History (${prices.length - 1} more)`}
			</button>
		)}

		{!createPrice && (
			<button
				onClick={() => setCreatePrice(true)}
				className={`${buttonVariants.secondary}`}>
				Add Price
			</button>
		)}
		</div>
	)
}

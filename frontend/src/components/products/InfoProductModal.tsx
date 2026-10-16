import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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
	const { t } = useTranslation()
	const [showPastPrices, setShowPastPrices] = useState<boolean>(false)
	const itemById = useMemo(() => {
		return Object.fromEntries(items.map(item => [item.id, item]))
	}, [items])

	return (
		<ModalLayout onClose={onClose}>
			<div className='flex flex-col'>
				<h1 className='font-mono text-lg text-center'>{t("products.infoProduct")}</h1>
			</div>

			{/* Product info */}
			<div className="grid grid-cols-4 gap-x-4 max-w-lg mx-auto text-md p-3 rounded-md border border-neutral-200">
				<div className="text-center text-neutral-500 dark:text-neutral-200 font-mono uppercase tracking-wider text-sm flex flex-col gap-2 justify-center">
					<p>{t("products.name")}</p>
					<p>ID:</p>
				</div>
				<div className="text-left text-neutral-800 dark:text-neutral-400 font-medium tracking-wider text-sm flex flex-col gap-2 justify-center col-span-3">
					<p>{product.name}</p>
					<p className='font-mono'>{product.id}</p>
				</div>
			</div>

			{!loading ? (
				<div className='flex flex-col text-center gap-3'>
				<div className='flex flex-col'>
				{prices && prices.length > 0 ? (
					<>
					<h2 className='font-mono text-lg'>{t("products.prices")}</h2>
					<table>
					<thead>
						<tr className='text-lg font-mono bg-neutral-200 dark:bg-neutral-700 font-medium'>
							<td>
							{t("products.price")}
							</td>
							<td>
							{t("products.priceFrom")}
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
					<p> {t("products.noPrice")} </p>
				)}
				{prices && prices.length > 1 && (
						<button 
							onClick={() => setShowPastPrices(!showPastPrices)}
							className="text-sm text-neutral-600 dark:text-neutral-300 underline cursor-pointer hover:text-neutral-800 dark:hover:text-neutral-100"
						>
							{showPastPrices? t("products.hidePastPrices") : t("products.showPastPrices", { count: prices.length - 1 })}
						</button>
					)}
				</div>
				<div className='flex flex-col'>
				{product.recipe_items && product.recipe_items.length > 0 ?  (
					<>
					<h2 className='font-mono text-lg'>{t("products.recipe")}</h2>
					<table>
					<thead>
						<tr className='font-mono text-lg bg-neutral-200 dark:bg-neutral-700'>
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
					<p> {t("products.noRecipe")} </p>
				)}
				</div>
				</div>
			) : (
				
				<LoadingSpinner className='mx-auto'/>
			)}
		</ModalLayout>
	)
}

import {useMemo} from 'react'
import { useTranslation } from 'react-i18next'
import type { Restock, Item } from '../../types'
import {cardVariants} from '../styles/CardStyles'
import { formatDate } from '../../utils/date'
import EmptyRow from '../EmptyRow'

interface LatestRestockCardProps {
	restocks: Restock[]
	items: Item[]
}

export default function LatestRestockCard({ restocks, items }: LatestRestockCardProps) {
	const { t } = useTranslation()
	const itemById = useMemo(() => {
		return Object.fromEntries(items.map(item => [item.id, item]))
	}, [items])

	if (restocks.length === 0) return (<div>No restocks </div>)


	return (
		<div className={cardVariants.tableBody}>
			<h1 className="text-xl p-6"> {t("restocks.latestRestocks")} </h1>
			<div className="flex flex-col divide-y divide-neutral-300 dark:divide-neutral-600 rounded-b-xl">
				<div className="bg-neutral-200 dark:bg-neutral-900 grid grid-cols-3 p-1 font-mono">
						<p>{t("restocks.date")}</p>
						<p>{t("restocks.supplier")}</p>
						<p>{t("restocks.items")}</p>
				</div>
				{restocks.length > 0 ? (
					restocks.map(restock => (
						<div 
							key={restock.id} 
							className="grid grid-cols-3 p-1">
							<p>{formatDate(restock.restock_date)}</p>
							<p>{restock.supplier}</p>
							<p>
							{restock.restock_items.length > 0 ? (
								restock.restock_items.map((ri, idx) => {
									const item = itemById[ri.item_id]
									return (
										<span key={idx}>{item.name} {ri.quantity} {item.unit}{idx < restock.restock_items.length - 1 ? ',' : ''} </span>
									)
								})
							): (
								<span>-</span>
							)}
							</p>
						</div>
					))
				): (
					<EmptyRow message='No latest restocks' />
				)}
			</div>
		</div>
	)
}

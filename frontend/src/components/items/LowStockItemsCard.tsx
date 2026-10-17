import { useTranslation } from 'react-i18next'
import type { Item } from '../../types'
import {cardVariants} from '../styles/CardStyles'
import EmptyRow from '../EmptyRow'

interface LowStockItemsCardProps {
	items: Item[]
}

export default function LowStockItemsCard({ items } : LowStockItemsCardProps) {	
	const { t } = useTranslation()
	return (
		<div className={cardVariants.tableBody}>
			<h1 className="text-xl p-6"> {t("items.lowStockItems")} </h1>
			<div className="flex flex-col divide-y divide-neutral-300 dark:divide-neutral-600 rounded-b-xl">
				<div className="bg-neutral-200 dark:bg-neutral-900 grid grid-cols-3 p-1 font-mono">
						<p>{t("common.fields.name")}</p>
						<p>{t("items.currentStock")}</p>
						<p>{t("items.lowStockThreshold")}</p>
				</div>
				{items.length > 0 ? (
					items.map(item => (
						<div 
							key={item.id} 
							className='grid grid-cols-3 p-1'>
							<p>{item.name}</p>
							<p>{item.current_stock} {item.unit}</p>
							<p>{item.low_stock_threshold} {item.unit}</p>
						</div>
					))
				): (
					<EmptyRow message='No items running low' />
				)}
			</div>
		</div>
	)
}

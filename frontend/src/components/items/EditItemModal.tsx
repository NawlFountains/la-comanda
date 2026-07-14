import {useState} from "react"
import InputModal from '../InputModal.tsx'
import ErrorMessage from "../errors/ErrorMessage"
import { buttonVariants } from '../styles/ButtonStyles'
import type { Item } from '../../types'
import type {ItemErrors, ItemUpdateData} from "../../schemas/item.ts"
import ModalLayout from "../../layouts/ModalLayout.tsx"

interface EditItemModalProps {
	onClose: () => void
	onEdit: (id: string, data: ItemUpdateData) => Promise<boolean>
	validateItemUpdate: (data: ItemUpdateData) => boolean,
	submitting: boolean
	errors: ItemErrors
	item: Item
}

export default function EditItemModal( { onClose, onEdit, validateItemUpdate, submitting, errors, item } : EditItemModalProps) {
	const [name, setName] = useState(item.name)
	const [currentStock, setCurrentStock] = useState<string>(item.current_stock)
	const [unit, setUnit] = useState(item.unit)
	const [lowStockThreshold, setLowStockThreshold] = useState<string>(item.low_stock_threshold)
	const [notes, setNotes] = useState(item.notes ?? '')
	
	const handleSubmit = async () => {
		const itemData = { name, current_stock: currentStock, unit, low_stock_threshold: lowStockThreshold, notes }

		if (!validateItemUpdate(itemData)) return 
		onClose()
		onEdit(item.id, itemData) 
	}
	return (
			<ModalLayout onClose={onClose}>
				<h2 className="text-center text-lg font-mono p-2">
				Edit item <span className="font-medium">{item.name}</span>
				</h2>
				<div className="flex flex-col">
				<InputModal
					value={name}
					label='Name'
					id='itemName'
					onChange={(e) => setName(e.target.value)}
					placeholder="e.g. Potatoes">
				</InputModal>
				{errors.name && (<ErrorMessage message={errors.name} />)}
				</div>
				<div className="flex flex-col sm:flex-row gap-4 ">
					<div className="flex-2 flex flex-col">
					<InputModal
						value={currentStock}
						type="number"
						id="itemCurrentStock"
						label="Current stock"
						className="w-full"
						onChange={(e) => setCurrentStock(e.target.value)}
						placeholder="e.g. 0.5">
					</InputModal>
					{errors.current_stock && (<ErrorMessage message={errors.current_stock} />)}
					</div>
					<div className="flex-1 flex flex-col">
					<InputModal
						value={unit}
						className="w-full"
						id="itemUnit"
						label="Unit"
						onChange={(e) => setUnit(e.target.value)}
						placeholder="kg/l">
					</InputModal>
					{errors.unit && (<ErrorMessage message={errors.unit} />)}
					</div>
				</div>
				<div className="flex flex-col">
				<InputModal
					value={lowStockThreshold}
					id="itemLowStockThreshold"
					label="Low stock threshold"
					onChange={(e) => setLowStockThreshold(e.target.value)}
					placeholder="e.g. 50">
				</InputModal>
				{errors.low_stock_threshold && (<ErrorMessage message={errors.low_stock_threshold}/>)}
				</div>
				<div className="flex flex-col">
				<InputModal
					value={notes}
					id="itemNotes"
					label="Notes (optional)"
					onChange={(e) => setNotes(e.target.value)}>
				</InputModal>
				{errors.notes && (<ErrorMessage message={errors.notes}/>)}
				</div>

				<div className="flex flex-col md:flex-row justify-between md:mx-4 gap-2 mt-4">
					<button
						onClick={onClose}
						className={`${buttonVariants.danger} border border-dashed w-full md:w-1/4`}>
						Cancel
					</button>
					<button 
						onClick={handleSubmit}
						disabled={submitting}
						className={`${buttonVariants.secondary} w-full md:w-1/4`}>
						{submitting ? 'Editing...' : 'Edit'}
					</button>
				</div>
			</ModalLayout>
	)
}

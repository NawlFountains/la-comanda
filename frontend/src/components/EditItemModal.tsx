import React, {useState} from "react"
import InputModal from '../components/InputModal.tsx'
import ErrorMessage from "./ErrorMessage.tsx"
import { buttonVariants } from '../components/ButtonStyles.ts'
import type { Item, CreateItemPayload } from '../types'
import type {ItemErrors} from "../schemas/item.ts"
import ModalLayout from "../layouts/ModalLayout.tsx"

interface EditItemModalProps {
	onClose: () => void
	onEdit: (id: string, data: Partial<CreateItemPayload>) => Promise<boolean>
	submitting: boolean
	errors: ItemErrors
	item: Item
}

export default function EditItemModal( { onClose, onEdit, submitting, errors, item } : EditItemModalProps) {
	const [name, setName] = useState(item.name)
	const [currentStock, setCurrentStock] = useState<string>(item.current_stock)
	const [unit, setUnit] = useState(item.unit)
	const [lowStockThreshold, setLowStockThreshold] = useState<string>(item.low_stock_threshold)
	const [notes, setNotes] = useState(item.notes ?? '')
	
	const handleSubmit = async () => {
		const success = await onEdit(item.id, {
			name,
			current_stock: currentStock,
			unit,
			low_stock_threshold: lowStockThreshold,
			notes
		})
		if (success) onClose()
	}
	return (
			<ModalLayout onClose={onClose}>
				<h2 className="text-center text-xl font-mono p-2">
				Edit item <span className="font-medium">{item.name}</span>
				</h2>
				<div className="flex flex-col">
				<InputModal
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Name">
				</InputModal>
				{errors.name && (<ErrorMessage message={errors.name} />)}
				</div>
				<div className="flex flex-col sm:flex-row gap-4 ">
					<div className="flex flex-col">
					<InputModal
						value={currentStock}
						type="number"
						onChange={(e) => setCurrentStock(e.target.value)}
						placeholder="Current Stock">
					</InputModal>
					{errors.current_stock && (<ErrorMessage message={errors.current_stock} />)}
					</div>
					<div className="flex flex-col">
					<InputModal
						value={unit}
						onChange={(e) => setUnit(e.target.value)}
						placeholder="Unit">
					</InputModal>
					{errors.unit && (<ErrorMessage message={errors.unit} />)}
					</div>
				</div>
				<div className="flex flex-col">
				<InputModal
					value={lowStockThreshold}
					onChange={(e) => setLowStockThreshold(e.target.value)}
					placeholder="Low Stock threshold">
				</InputModal>
				{errors.low_stock_threshold && (<ErrorMessage message={errors.low_stock_threshold}/>)}
				</div>
				<div className="flex flex-col">
				<InputModal
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					placeholder="Notes (optional)">
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

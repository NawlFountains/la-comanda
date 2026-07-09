import {useState} from "react"
import InputModal from '../InputModal'
import ErrorMessage from "../errors/ErrorMessage"
import { buttonVariants } from '../styles/ButtonStyles'
import type { CreateItemPayload } from '../../types'
import type {ItemErrors} from "../../schemas/item"
import ModalLayout from "../../layouts/ModalLayout"

interface AddItemModalProps {
	onClose: () => void
	onCreate: (data: CreateItemPayload) => Promise<boolean>
	submitting: boolean
	errors: ItemErrors
	submitError: string | null
}

export default function AddItemModal( { onClose, onCreate, submitting, errors, submitError } : AddItemModalProps) {
	const [name, setName] = useState('')
	const [currentStock, setCurrentStock] = useState<string>('')
	const [unit, setUnit] = useState('kg')
	const [lowStockThreshold, setLowStockThreshold] = useState<string>('')
	const [notes, setNotes] = useState('')
	
	const handleSubmit = async () => {
		const success = await onCreate({
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
				Add item
				</h2>
				<div className="flex flex-col">
				<InputModal
					value={name}
					id='itemName'
					label='Name'
					onChange={(e) => setName(e.target.value)}
					placeholder="e.g. Potatoes"/>
				{errors.name && (<ErrorMessage message={errors.name} />)}
				</div>
				<div className="flex flex-col sm:flex-row gap-4 ">
					<div className="flex-2 flex flex-col">
					<InputModal
						value={currentStock}
						type="number"
						id="itemCurrentStock"
						label="Current Stock"
						className="w-full"
						onChange={(e) => setCurrentStock(e.target.value)}
						placeholder="e.g. 0.5"/>
					{errors.current_stock && (<ErrorMessage message={errors.current_stock} />)}
					</div>
					<div className="flex-1 flex flex-col">
					<InputModal
						value={unit}
						id="itemUnit"
						label="Unit"
						onChange={(e) => setUnit(e.target.value)}
						className="w-full"
						placeholder="kg/l"/>
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

				{submitError && (<ErrorMessage message={submitError} />)}
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
						{ submitting ? 'Adding' : 'Add'}
					</button>
				</div>
		</ModalLayout>
	)
}

import React, {useState} from "react"
import InputModal from '../components/InputModal.tsx'
import { buttonVariants } from '../components/ButtonStyles.ts'
import { cardVariants } from '../components/CardStyles'
import type { CreateItemPayload } from '../types'

interface AddItemModalProps {
	onClose: () => void
	onCreate: (data: CreateItemPayload) => void | Promise<void>
}

export default function AddItemModal( { onClose, onCreate } : AddItemModalProps) {
	const [name, setName] = useState('')
	const [currentStock, setCurrentStock] = useState<string>('')
	const [unit, setUnit] = useState('kg')
	const [lowStockThreshold, setLowStockThreshold] = useState<string>('')
	const [notes, setNotes] = useState('')
	
	const handleSubmit = async () => {
		await onCreate({
			name,
			current_stock: currentStock,
			unit,
			low_stock_threshold: lowStockThreshold,
			notes
		})
		onClose()
	}
	return (
		<div 
			onClick={onClose}
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
			<div
				onClick={(e) => e.stopPropagation()}
				className={`${cardVariants.base} gap-4 p-4 w-full md:w-fit shadow-lg`}>
				<h2 className="text-center text-xl font-mono p-2">
				Add item
				</h2>
				<InputModal
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Name">
				</InputModal>
				<div className="flex flex-col sm:flex-row gap-4 ">
					<InputModal
						value={currentStock}
						onChange={(e) => setCurrentStock(e.target.value)}
						placeholder="Current Stock">
					</InputModal>
					<InputModal
						value={unit}
						onChange={(e) => setUnit(e.target.value)}
						placeholder="Unit">
					</InputModal>
				</div>
				<InputModal
					value={lowStockThreshold}
					onChange={(e) => setLowStockThreshold(e.target.value)}
					placeholder="Low Stock threshold">
				</InputModal>
				<InputModal
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					placeholder="Notes (optional)">
				</InputModal>

				<div className="flex flex-col md:flex-row justify-between md:mx-4 gap-2 mt-4">
					<button
						onClick={onClose}
						className={`${buttonVariants.danger} border border-dashed w-full md:w-1/4`}>
						Cancel
					</button>
					<button 
						onClick={handleSubmit}
						className={`${buttonVariants.secondary} w-full md:w-1/4`}>
					Add
					</button>
				</div>
			</div>
		</div>
	)
}

import { useState } from 'react'
import ModalLayout from '../../layouts/ModalLayout'
import InputModal from '../InputModal'
import ErrorMessage from '../errors/ErrorMessage'
import { buttonVariants } from '../styles/ButtonStyles'
import type { RestockUpdateData, RestockErrors } from '../../schemas/restock'
import type { Restock } from '../../types'

interface EditRestockModalProps {
	onClose: () => void,
	onEdit: (id: string, data: RestockUpdateData) => Promise<boolean>
	validateRestockUpdate: (data: RestockUpdateData) => boolean
	submitting: boolean
	restock: Restock,
	errors: RestockErrors
}

export default function EditRestockModal( { onClose, onEdit, validateRestockUpdate, submitting, restock, errors }: EditRestockModalProps ) {
	const [supplier, setSupplier] = useState<string>(restock?.supplier || '')
	const [notes, setNotes] = useState<string>(restock?.notes || '')
	const [restockDate, setRestockDate] = useState<string>(restock?.restock_date || '')

	const handleSubmit = async () => {
		const updatedRestock = ({
			supplier,
			notes,
			restock_date: restockDate
		})
		if (!validateRestockUpdate(updatedRestock)) return
		onClose()
		onEdit(restock.id, updatedRestock)
	}

	return (
		<ModalLayout onClose={onClose}>
				<div className='p-2'>
					<h1 className='text-center text-lg font-mono'>Edit restock</h1>
				</div>
				<div className='flex flex-col'>
					<InputModal 
						type="date"
						value={restockDate}
						id="restockDate"
						label="Date"
						onChange={(e) => setRestockDate(e.target.value)}/>
					{errors.restock_date && (<ErrorMessage message={errors.restock_date}/>)}
				</div>
				<div className='flex flex-col md:grid md:grid-cols-2 gap-4'>
					<div className='flex flex-col'>
						<InputModal 
							placeholder='Supplier name'
							value={supplier}
							id="restockSupplier"
							label="Supplier"
							onChange={(e) => setSupplier(e.target.value)}/>
						{errors.supplier && (<ErrorMessage message={errors.supplier} />)}
					</div>
					<div className='flex flex-col'>
						<InputModal 
							placeholder='Notes'
							value={notes}
							id="restockNotes"
							label="Notes"
							onChange={(e) => setNotes(e.target.value)}/>
						{errors.notes && (<ErrorMessage message={errors.notes} />)}
					</div>
					
				</div>
			<div className="flex flex-col md:flex-row justify-between md:mx-4 gap-2 mt-4">
				<button
					onClick={onClose}
					className={`${buttonVariants.danger} border border-dashed w-full md:w-1/4`}>
					Cancel
				</button>
				<button 
					disabled={submitting}
					onClick={handleSubmit}
					className={`${buttonVariants.secondary} w-full md:w-1/4`}>
					{submitting ? 'Editing...' : 'Edit'}
				</button>
			</div>
		</ModalLayout>
	)
}

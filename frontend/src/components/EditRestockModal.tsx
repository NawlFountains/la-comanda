import React, { useState } from 'react'
import ModalLayout from '../layouts/ModalLayout'
import InputModal from '../components/InputModal'
import ErrorMessage from '../components/ErrorMessage'
import { buttonVariants } from '../components/ButtonStyles'
import type { RestockErrors } from '../schemas/restock'
import type { Restock, CreateRestockPayload } from '../types'

interface EditRestockModalProps {
	onClose: () => void,
	onEdit: (id: string, data: Partial<CreateRestockPayload>) => Promise<boolean>
	submitting: boolean
	restock: Restock,
	errors: RestockErrors
}

export default function EditRestockModal( { onClose, onEdit, submitting, restock, errors }: EditRestockModalProps ) {
	const [supplier, setSupplier] = useState<string>(restock?.supplier || '')
	const [notes, setNotes] = useState<string>(restock?.notes || '')
	const [restockDate, setRestockDate] = useState<string>(restock?.restock_date || '')

	const handleSubmit = async () => {
		const success = await onEdit(restock.id, {
			supplier,
			notes,
			restock_date: restockDate
		})
		if (success) onClose()
	}

	return (
		<ModalLayout onClose={onClose}>
				<div className='p-2'>
					<h1 className='text-center text-xl font-mono'>Create restock</h1>
				</div>
				<div className='flex flex-col'>
					<InputModal 
						placeholder='YYYY-MM-DD'
						value={restockDate}
						onChange={(e) => setRestockDate(e.target.value)}/>
					{errors.restock_date && (<ErrorMessage message={errors.restock_date}/>)}
				</div>
				<div className='flex flex-col md:grid md:grid-cols-2 gap-4'>
					<div className='flex flex-col'>
						<InputModal 
							placeholder='Supplier name'
							value={supplier}
							onChange={(e) => setSupplier(e.target.value)}/>
						{errors.supplier && (<ErrorMessage message={errors.supplier} />)}
					</div>
					<div className='flex flex-col'>
						<InputModal 
							placeholder='Notes'
							value={notes}
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

import React, {useState} from 'react'
import ModalLayout from '../../layouts/ModalLayout'
import { buttonVariants } from '../styles/ButtonStyles'
import InputModal from '../InputModal'
import ErrorMessage from '../errors/ErrorMessage'
import type { CreateProductPayload } from '../../types'
import type { ProductErrors } from '../../schemas/product'

interface AddProductModalProps {
	onClose: () => void
	onCreate: (data: CreateProductPayload) => Promise<boolean>
	submitting: boolean
	errors: ProductErrors
	submitError: string | null
}

export default function AddProductModal({ onClose, onCreate, submitting, errors, submitError }: AddProductModalProps) {
	const [name, setName] = useState('')

	const handleSubmit = async () => {
		const success = await onCreate({
			name
		})
		if (success) onClose()
	}

	return (
		<ModalLayout onClose={onClose}>
			<div className='flex flex-col'>
				<h1 className='font-mono text-center'>Add product</h1>
			</div>
			<div className='flex flex-col'>
				<InputModal 
					placeholder='name'
					value={name}
					onChange={(e) => setName(e.target.value)}/>
				{errors.name && (<ErrorMessage message={errors.name}/>)}
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

import React, { useState } from 'react'
import ModalLayout from '../layouts/ModalLayout'
import InputModal from '../components/InputModal.tsx'
import ErrorMessage from "./ErrorMessage.tsx"
import { buttonVariants } from '../components/ButtonStyles.ts'
import type { Product, CreateProductPayload } from '../types'
import type { ProductErrors } from '../schemas/product'

interface EditProductModalProps {
	onClose: () => void
	onEdit: (id: string, data: Partial<CreateProductPayload>) => Promise<boolean>
	product: Product
	submitting: boolean
	errors: ProductErrors
}

export default function EditProductModal({ onClose, onEdit, product, submitting, errors }: EditProductModalProps) {
	const [name, setName] = useState(product?.name || '')

	const handleSubmit = async () => {
		const success = await onEdit(product.id, {
			name
		})
		if (success) onClose()
	}

	return (
		<ModalLayout onClose={onClose}>
			<div className='flex flex-col'>
				<h1 className='font-mono text-center'>Edit product</h1>
			</div>
			<div className='flex flex-col'>
				<InputModal 
					placeholder='name'
					value={name}
					onChange={(e) => setName(e.target.value)}/>
				{errors.name && (<ErrorMessage message={errors.name}/>)}
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
						{ submitting ? 'Editing' : 'Edit'}
					</button>
				</div>
		</ModalLayout>
	)
}

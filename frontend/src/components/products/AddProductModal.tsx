import {useState} from 'react'
import ModalLayout from '../../layouts/ModalLayout'
import { buttonVariants } from '../styles/ButtonStyles'
import InputModal from '../InputModal'
import ErrorMessage from '../errors/ErrorMessage'
import type { ProductCreateData, ProductErrors } from '../../schemas/product'

interface AddProductModalProps {
	onClose: () => void
	onCreate: (data: ProductCreateData) => Promise<boolean>
	validateProduct: (data: ProductCreateData) => boolean
	submitting: boolean
	errors: ProductErrors
}

export default function AddProductModal({ onClose, onCreate, validateProduct, submitting, errors }: AddProductModalProps) {
	const [name, setName] = useState('')

	const handleSubmit = async () => {
		const productData = { name }
		if (!validateProduct(productData)) return
		onClose()
		onCreate(productData)
	}

	return (
		<ModalLayout onClose={onClose}>
			<div className='flex flex-col'>
				<h1 className='font-mono text-lg text-center'>Add product</h1>
			</div>
			<div className='flex flex-col'>
				<InputModal 
					placeholder='e.g. Milanesas'
					value={name}
					id="productName"
					label="Name"
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
						{ submitting ? 'Adding' : 'Add'}
					</button>
				</div>
		</ModalLayout>
	)
}

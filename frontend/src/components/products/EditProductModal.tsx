import { useRef, useState } from 'react'
import ModalLayout from '../../layouts/ModalLayout'
import InputModal from '../InputModal.tsx'
import ErrorMessage from "../errors/ErrorMessage"
import { buttonVariants } from '../styles/ButtonStyles'
import type { PriceHistory, Item, ProductWithDetails } from '../../types'
import { LoadingSpinner } from '../styles/Icons'
import PriceSection from './PriceSection'
import RecipeItemSection, { type RecipeItemSectionHandle } from './RecipeItemsSection.tsx'
import type { ProductEditActions, PriceActions, RecipeItemActions } from './EditProductModal.types.ts'

interface EditProductModalProps {
	onClose: () => void
	product: ProductWithDetails
	items: Item[]
	prices: PriceHistory[]
	productsActions: ProductEditActions 
	priceActions: PriceActions
	recipeItemActions: RecipeItemActions
}

export default function EditProductModal({
	onClose,
	product,
	items,
	prices,
	productsActions,
	priceActions,
	recipeItemActions
}: EditProductModalProps) {
	const [name, setName] = useState(product?.name || '')
	const { onEdit, validateProductUpdate, errors, submitting, loading } = productsActions

	const recipeSectionRef = useRef<RecipeItemSectionHandle>(null)

	const handleSubmit = async () => {
		const productData = { name }
		if (!validateProductUpdate(productData)) return
		if (recipeSectionRef.current && !recipeSectionRef.current.validate()) return 

		onClose()
		recipeSectionRef?.current?.submit()
		onEdit(product.id, productData)
	}

	return (
		<ModalLayout onClose={onClose}> <div className='flex flex-col'>
				<h1 className='font-mono text-center'>Edit product</h1>
			</div>
			<div className='flex flex-col'>
				<InputModal 
					placeholder='e.g. Potatoes'
					id="productName"
					label="Name"
					value={name}
					onChange={(e) => setName(e.target.value)}/>
				{errors.name && (<ErrorMessage message={errors.name}/>)}
			</div>

			{/* Price History*/}
			{ loading ? (
				<div className='mx-auto p-5'>
				<LoadingSpinner />
				</div>
			) : (
				<>
				<PriceSection 
					product={product}
					prices={prices}
					priceActions={priceActions}
				/>
				{/* Recipe items */}
				<RecipeItemSection 
					product={product}
					items={items}
					recipeItemActions={recipeItemActions}
					ref={recipeSectionRef}
				/>
				
				</>
			)}
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

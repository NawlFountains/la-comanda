import { useState, useMemo } from 'react'
import ModalLayout from '../../layouts/ModalLayout'
import InputModal from '../InputModal.tsx'
import ErrorMessage from "../errors/ErrorMessage"
import { buttonVariants } from '../styles/ButtonStyles'
import type { CreateProductPayload, CreatePriceHistoryPayload, CreateRecipeItemPayload, PriceHistory, Item, ProductWithDetails } from '../../types'
import type { ProductErrors } from '../../schemas/product'
import {LoadingSpinner, PenIcon, TrashIcon} from '../styles/Icons'
import type {PriceHistoryErrors} from '../../schemas/price_history'
import type {RecipeItemErrors} from '../../schemas/recipe_item'
import PriceSection from './PriceSection'

interface EditProductModalProps {
	onClose: () => void
	onEdit: (id: string, data: Partial<CreateProductPayload>) => Promise<boolean>
	onAddPrice: (productId: string, data: CreatePriceHistoryPayload) => Promise<boolean>
	onAddRecipeItem: (productId: string, data: CreateRecipeItemPayload) => Promise<boolean>
	onEditRecipeItem: (productId: string, id: string, data: Partial<CreateRecipeItemPayload>) => Promise<boolean>
	onDeleteRecipeItem: (productId: string, id: string) => void
	product: ProductWithDetails
	prices: PriceHistory[]
	items: Item[]
	submitting: boolean
	loading: boolean
	errors: ProductErrors
	priceErrors: PriceHistoryErrors
	recipeErrors: RecipeItemErrors
	submitError: string | null
}

export default function EditProductModal({
	onClose,
	onEdit,
	onAddPrice, 
	onAddRecipeItem, 
	onEditRecipeItem, 
	onDeleteRecipeItem, 
	product, 
	prices,
	items,
	submitting, 
	loading,
	errors,
	priceErrors,
	recipeErrors,
	submitError
}: EditProductModalProps) {
	const [name, setName] = useState(product?.name || '')
	
	const [newRecipeItems, setNewRecipeItems] = useState<CreateRecipeItemPayload[]>([])

	const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null)	
	const [editedRecipeItems, setEditedRecipeItems] = useState<Record<string, Partial<CreateRecipeItemPayload>>>({})

	const handleRecipeItemChange = (id: string, field: keyof CreateRecipeItemPayload, value: string) => {
	    setEditedRecipeItems(prev => {
		const current = prev[id] || {}
		const updated: Partial<CreateRecipeItemPayload> = {
		    ...current,
		    [field]: value
		}

		// auto-update unit when item_id changes
		if (field === 'item_id') {
		    const selectedItem = items.find(i => i.id === value)
		    if (selectedItem) {
			updated.unit = selectedItem.unit
		    }
		}

		return {
		    ...prev,
		    [id]: updated
		}
	    })
	}

	const itemById = useMemo(() => {
		return Object.fromEntries(items.map(item => [item.id, item]))
	}, [items])

	const handleSubmit = async () => {
		
		if (newRecipeItems && newRecipeItems.length > 0) {
			try {
				const recipePromises = newRecipeItems.map((recipeItem) =>
					onAddRecipeItem(product.id, {
						item_id: recipeItem.item_id,
						quantity: recipeItem.quantity,
						unit: recipeItem.unit
					})
				)

				const recipeResults = await Promise.all(recipePromises)

				const allRecipeSaved = recipeResults.every(res => res === true)
				if (!allRecipeSaved) {
					console.warn("Some recipe items failed to save.")
					return
				}
			} catch (err) {
				console.log("Recipe items addition encountered an error:", err)
				return
			}
		}
		if (Object.keys(editedRecipeItems).length > 0) {
			try {
				const editPromises = Object.entries(editedRecipeItems).map(([id, data]) =>
					   onEditRecipeItem(product.id, id, data)
					  )

				  const editResults = await Promise.all(editPromises)

				const allRecipeEdited = editResults.every(res => res === true)
				if (!allRecipeEdited) {
					console.warn("Some recipe items failed to save.")
					return
				}
			} catch (err) {
				console.log("Recipe items update encounter an error:", err)
			}
		}

		const success = await onEdit(product.id, { name })
		if (success) onClose()
	}

	const handleAddRecipeItem = () => {
		const newRecipeItem: CreateRecipeItemPayload = {
			item_id: items[0]?.id || '',
			quantity: '1',
			unit: items[0]?.unit
		}

		setNewRecipeItems([...newRecipeItems, newRecipeItem])
	}

	const handleItemChange = (index: number, field: keyof CreateRecipeItemPayload, value: string ) => {
		const updatedRecipeItems = [...newRecipeItems]
		updatedRecipeItems[index] = {
			...updatedRecipeItems[index],
			[field]: value
		} as CreateRecipeItemPayload
		setNewRecipeItems(updatedRecipeItems)
	}

	const handleRemoveItem = (index: number) => {
		setNewRecipeItems(newRecipeItems.filter((_, i) => i !== index))
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
					onAddPrice={onAddPrice}
					product={product}
					prices={prices}
					priceErrors={priceErrors}
					
				/>
				{/* Recipe items */}
				<div className='flex flex-col text-center gap-3'>
					{((product.recipe_items && product?.recipe_items?.length > 0) || (newRecipeItems && newRecipeItems.length > 0)) && (
						<table>
						<thead>
							<tr className='text-lg font-mono bg-neutral-200'>
							<td>Item</td>
							<td>Amount</td>
							<td>Actions</td>
							</tr>
						</thead>
						<tbody>
						{product.recipe_items?.map(( item, idx) => {
							const isEditing = item.id === editingRecipeId
							const selectedItem = items.find(i => i.id === item.item_id)

							return (
								<tr key={item.id || idx}>
									{isEditing ? (
										<>
									<td
										onClick={() => setEditingRecipeId(item.id)}
										className='w-2/5'>
										{itemById[item.item_id]?.name}
									</td>
									
									{/* EDIT MODE: Quantity Input */}
									<td className='flex flex-row gap-2 justify-center py-1'>
										<InputModal
											className='w-1/3'
											placeholder='Quantity'
											type='number'
											id={`recipeItem${idx}Quantity`}
											label="Quantity"
											value={editedRecipeItems[item.id]?.quantity ?? item.quantity}
											step="any"
											onChange={(e) => handleRecipeItemChange(item.id, 'quantity', e.target.value) }
										/>
										<span className='p-1'>{selectedItem?.unit}</span>
									</td>

									{/* EDIT MODE: Close/Save Button */}
									<td className='p-2 text-center'>
										<button 
											onClick={() => setEditingRecipeId(null)}
											className="text-emerald-600 font-medium text-sm px-2 cursor-pointer"
										>
											Done
										</button>
									</td>
										</>
									): (
									<>
										<td 
											onClick={() => setEditingRecipeId(item.id)}
											className='w-2/5'>
											{itemById[item.item_id]?.name}
											</td>
										<td 
											onClick={() => setEditingRecipeId(item.id)}
											className='w-2/5'>
											{editedRecipeItems[item.id]?.quantity ?? item.quantity} {item.unit}
											 </td>
										<td className='flex flex-row justify-center gap-2 p-2'>
											<button 
												onClick={() => setEditingRecipeId(item.id)}
												className='cursor-pointer hover:scale-110'>
												<PenIcon />
											</button>
											<button 
												onClick={() => onDeleteRecipeItem(product.id, item.id)}
												className='text-red-500 cursor-pointer hover:scale-110'>
												<TrashIcon />
											</button>
										</td>
									</>
									)
									}
								</tr>
							)
						})}

						{newRecipeItems.map((item, idx) => {
							const selectedItem = items.find( i => i.id === item.item_id)
							return (
								<tr key={idx}>

							    {/* Item Dropdown Selection */}
							    <td>
							<fieldset className="border border-neutral-400 rounded-lg px-2 pb-1">
								<legend className="text-xs px-1 text-neutral-600">Item</legend>
							      <select
								className='w-2/3 py-1 px-2 text-center'
								value={item.item_id}
								id={`recipeItem${idx}ItemId`}
								onChange={(e) => handleItemChange(idx, 'item_id', e.target.value)}
							      >
								<option value="" disabled>Select an item</option>
								{items.map((validItem) => (
								  <option key={validItem.id} value={validItem.id}>
								    {validItem.name}
								  </option>
								))}
							      </select>
							      </fieldset>
							    </td>
							    
							    {/* Quantity Input */}
							    <td className='flex flex-row gap-2 justify-center py-1 items-center'>
							    <InputModal
								    className='w-1/3'
								    placeholder='Quantity'
								    id={`recipeItem${idx}Quantity`}
								    label="Quantity"
								    type='number'
								    value={item.quantity || ''}
								    step="any"
								    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
							    />
							    <span className='p-1'>{selectedItem?.unit}</span>
							    </td>

							    {/* Remove item button */}
							    <td>
							    <button
							      type="button"
							      onClick={() => handleRemoveItem(idx)}
							      className="p-2 text-gray-400 hover:text-red-500 text-sm"
							      title="Remove item"
							    >
							      ✕
							    </button>
							    </td>
							  </tr>
							  )
							})}
							{recipeErrors && (
							<tr>
								<td>
								{recipeErrors.item_id && (<ErrorMessage message={recipeErrors.item_id}/>)}
								</td>
								<td>
								{recipeErrors.quantity && (<ErrorMessage message={recipeErrors.quantity}/>)}
								</td>
							</tr>
						)}
						</tbody>
						</table>
						)}
					<button
						onClick={() => handleAddRecipeItem()} 
						className={`${buttonVariants.secondary}`}>
						Add item
					</button>
				</div>
				</>
			)}
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
						{ submitting ? 'Editing' : 'Edit'}
					</button>
				</div>
		</ModalLayout>
	)
}

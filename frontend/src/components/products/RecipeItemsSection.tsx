import { useState, useMemo, forwardRef, useImperativeHandle } from 'react'
import InputModal from '../InputModal.tsx'
import ErrorMessage from "../errors/ErrorMessage"
import { buttonVariants } from '../styles/ButtonStyles'
import { PenIcon, TrashIcon } from '../styles/Icons'
import type { Item, ProductWithDetails } from '../../types'
import type {RecipeItemCreateData, RecipeItemUpdateData} from '../../schemas/recipe_item'
import type {RecipeItemActions} from './EditProductModal.types.ts'

export interface RecipeItemSectionHandle {
	validate: () => boolean
	submit: () => void
}

interface RecipeItemSectionProps {
	product: ProductWithDetails
	items: Item[]
	recipeItemActions: RecipeItemActions
}

const RecipeItemSection = forwardRef<RecipeItemSectionHandle, RecipeItemSectionProps>(
	({ product, items, recipeItemActions }, ref) => { 
	const { onAdd, onEdit, onDelete, validateRecipe, validateRecipeUpdate, errors } = recipeItemActions

	const [newRecipeItems, setNewRecipeItems] = useState<RecipeItemCreateData[]>([])

	const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null)	
	const [editedRecipeItems, setEditedRecipeItems] = useState<Record<string, RecipeItemUpdateData>>({})

	const handleRecipeItemChange = (id: string, field: keyof RecipeItemCreateData, value: string) => {
	    setEditedRecipeItems(prev => {
		const current = prev[id] || {}
		const updated: RecipeItemUpdateData = {
		    ...current,
		    [field]: value
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

	const validateAll = (): boolean => {
			for (const item of newRecipeItems) {
				if (!validateRecipe(item)) return false
			}
			for (const data of Object.values(editedRecipeItems)) {
				if (!validateRecipeUpdate(data)) return false
			}
			return true
		}

		const submitAll = () => {
			newRecipeItems.forEach((recipeItem) => {
				onAdd(product.id, {
					item_id: recipeItem.item_id,
					quantity: recipeItem.quantity,
					unit: recipeItem.unit
				})
			})
			Object.entries(editedRecipeItems).forEach(([id, data]) => {
				onEdit(product.id, id, data)
			})
			setNewRecipeItems([])
			setEditedRecipeItems({})
		}

		useImperativeHandle(ref, () => ({
			validate: validateAll,
			submit: submitAll
		}))

	const handleAddRecipeItem = () => {
		const newRecipeItem: RecipeItemCreateData = {
			item_id: items[0]?.id || '',
			quantity: '1',
			unit: items[0]?.unit || 'kg'
		}

		setNewRecipeItems([...newRecipeItems, newRecipeItem])
	}

	const handleItemChange = (index: number, field: keyof RecipeItemCreateData, value: string ) => {
		const updatedRecipeItems = [...newRecipeItems]

		if (field === 'item_id') {
			const selectedItem = items.find((i) => i.id === value)
			updatedRecipeItems[index] = {
				...updatedRecipeItems[index],
				item_id: value,
				unit: selectedItem?.unit || ''
			}
		} else {
			updatedRecipeItems[index] = {
				...updatedRecipeItems[index],
				[field]: value
			} as RecipeItemCreateData
		}

		setNewRecipeItems(updatedRecipeItems)	
	}

	const handleRemoveItem = (index: number) => {
		setNewRecipeItems(newRecipeItems.filter((_, i) => i !== index))
	}

	return (
		<div className='flex flex-col text-center gap-3'>
					{((product.recipe_items && product?.recipe_items?.length > 0) || (newRecipeItems && newRecipeItems.length > 0)) && (
						<table>
						<thead>
							<tr className='text-lg font-mono bg-neutral-200 dark:bg-neutral-700'>
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
									<td className='flex flex-row gap-2 px-4 justify-center'>
										<InputModal
											className='w-1/3 text-center'
											placeholder='Quantity'
											type='number'
											id={`recipeItem${idx}Quantity`}
											label="Quantity"
											value={editedRecipeItems[item.id]?.quantity ?? item.quantity}
											step="any"
											onChange={(e) => handleRecipeItemChange(item.id, 'quantity', e.target.value) }
										/>
										<span className='p-1 my-auto'>{selectedItem?.unit}</span>
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
												onClick={() => onDelete(product.id, item.id)}
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
							<fieldset className="border border-neutral-400 dark:border-neutral-600 rounded-lg mx-3 pb-1">
								<legend className="text-xs px-1 text-neutral-600 dark:text-neutral-200">Item</legend>
							      <select
								className='dark:bg-neutral-800 w-2/3 py-1 px-2 text-center'
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
							    <td className='flex flex-row gap-2 justify-center py-1 px-4 items-center'>
							    <InputModal
								    className='w-1/3 text-center'
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
							{errors && (
							<tr>
								<td>
								{errors.item_id && (<ErrorMessage message={errors.item_id}/>)}
								</td>
								<td>
								{errors.quantity && (<ErrorMessage message={errors.quantity}/>)}
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
		)
	}
)

export default RecipeItemSection

